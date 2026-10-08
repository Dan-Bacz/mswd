"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, clearSession } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/permissions";
import { loginSchema, setupSchema } from "@/lib/validation";

export async function loginAction(
  _previousState: { ok: boolean; error: string } | null,
  formData: FormData
) {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({
    where: { email },
    include: {
      role: true,
      userCategories: { select: { categoryId: true } },
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (user.status !== "ACTIVE") {
    return { ok: false, error: "This account is inactive." };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name as "ADMIN" | "OFFICER",
    categoryIds: user.userCategories.map((item) => item.categoryId),
  });

  revalidatePath("/");
  redirect(user.role.name === "ADMIN" ? "/admin/dashboard" : "/officer/dashboard");
}

export async function setupAction(
  _previousState: { ok: boolean; error: string } | null,
  formData: FormData
) {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    setupKey: String(formData.get("setupKey") ?? ""),
  };

  const parsed = setupSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (process.env.MSWD_SETUP_KEY && parsed.data.setupKey !== process.env.MSWD_SETUP_KEY) {
    return { ok: false, error: "Invalid setup key." };
  }

  if (!process.env.MSWD_SETUP_KEY) {
    return { ok: false, error: "MSWD_SETUP_KEY is not configured." };
  }

  const existing = await db.user.count({ where: { email: parsed.data.email } });

  if (existing > 0) {
    return { ok: false, error: "An administrator with that email already exists." };
  }

  const adminRole = await db.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      roleId: adminRole.id,
      status: "ACTIVE",
    },
    include: {
      role: true,
      userCategories: { select: { categoryId: true } },
    },
  });

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name as "ADMIN" | "OFFICER",
    categoryIds: user.userCategories.map((item) => item.categoryId),
  });

  revalidatePath("/");
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    throw new Error("Category name is required.");
  }

  await db.category.create({
    data: { name, description: description || null },
  });

  revalidatePath("/admin/categories");
}

export async function createOfficerAction(formData: FormData) {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    categoryIds: formData.getAll("categoryIds").flatMap((item) => String(item).split(",")).filter(Boolean),
  };

  if (!raw.name || !raw.email || !raw.password || raw.categoryIds.length === 0) {
    throw new Error("Please complete all fields and pick at least one authorized category.");
  }

  const officerRole = await db.role.upsert({
    where: { name: "OFFICER" },
    update: {},
    create: { name: "OFFICER" },
  });

  await db.user.create({
    data: {
      name: raw.name,
      email: raw.email,
      passwordHash: await bcrypt.hash(raw.password, 12),
      roleId: officerRole.id,
      status: "ACTIVE",
      userCategories: {
        create: raw.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
  });

  revalidatePath("/admin/officers");
}

function readCategoryIds(formData: FormData, fieldName = "categoryIds") {
  return Array.from(
    new Set(
      formData
        .getAll(fieldName)
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export async function assignOfficerCategoriesAction(formData: FormData) {
  const admin = await requireAdmin();

  const officerId = String(formData.get("officerId") ?? "");
  const categoryIds = readCategoryIds(formData);

  if (!officerId) {
    throw new Error("Officer is required.");
  }

  const [officer, categories, existing] = await Promise.all([
    db.user.findUnique({ where: { id: officerId }, include: { role: true } }),
    categoryIds.length > 0
      ? db.category.findMany({ where: { id: { in: categoryIds } } })
      : Promise.resolve([]),
    db.userCategory.findMany({ where: { userId: officerId }, select: { categoryId: true } }),
  ]);

  if (!officer || officer.role.name !== "OFFICER") {
    throw new Error("Officer was not found.");
  }

  if (categories.length !== categoryIds.length) {
    throw new Error("One or more selected categories were not found.");
  }

  const existingIds = new Set(existing.map((item) => item.categoryId));
  const addedCategoryIds = categoryIds.filter((id) => !existingIds.has(id));

  await db.$transaction([
    db.userCategory.deleteMany({ where: { userId: officerId } }),
    ...(categoryIds.length > 0
      ? [
          db.userCategory.createMany({
            data: categoryIds.map((categoryId) => ({ userId: officerId, categoryId })),
          }),
        ]
      : []),
    ...(addedCategoryIds.length > 0
      ? [
          db.assignment.createMany({
            data: addedCategoryIds.map((categoryId) => ({
              officerId,
              categoryId,
              assignedById: admin.id,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/admin/officers");
  revalidatePath(`/admin/officers/${officerId}`);
  revalidatePath("/officer/dashboard");
}

export async function setCategoryOfficersAction(formData: FormData) {
  const admin = await requireAdmin();

  const categoryId = String(formData.get("categoryId") ?? "");
  const officerIds = Array.from(
    new Set(
      formData
        .getAll("officerIds")
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  if (!categoryId) {
    throw new Error("Category is required.");
  }

  const [category, officers] = await Promise.all([
    db.category.findUnique({ where: { id: categoryId } }),
    officerIds.length > 0
      ? db.user.findMany({
          where: { id: { in: officerIds } },
          include: { role: true },
        })
      : Promise.resolve([]),
  ]);

  if (!category) {
    throw new Error("Category was not found.");
  }

  if (officers.some((officer) => officer.role.name !== "OFFICER")) {
    throw new Error("Only officers can be assigned to a category.");
  }

  if (officers.length !== officerIds.length) {
    throw new Error("One or more selected officers were not found.");
  }

  const existing = await db.userCategory.findMany({
    where: { categoryId },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((item) => item.userId));
  const nextIds = new Set(officerIds);

  const toAdd = officerIds.filter((id) => !existingIds.has(id));
  const toRemove = existing.filter((item) => !nextIds.has(item.userId));

  await db.$transaction([
    ...(toRemove.length > 0
      ? [
          db.userCategory.deleteMany({
            where: { categoryId, userId: { in: toRemove.map((item) => item.userId) } },
          }),
        ]
      : []),
    ...(toAdd.length > 0
      ? [
          db.userCategory.createMany({
            data: toAdd.map((userId) => ({ userId, categoryId })),
          }),
        ]
      : []),
    ...(toAdd.length > 0
      ? [
          db.assignment.createMany({
            data: toAdd.map((officerId) => ({
              officerId,
              categoryId,
              assignedById: admin.id,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath("/admin/officers");
  revalidatePath("/officer/dashboard");
}
