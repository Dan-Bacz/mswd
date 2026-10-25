"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  sendNewOfficerRegistrationEmail,
  sendOfficerApprovalEmail,
  sendOfficerRejectionEmail,
} from "@/lib/email";
import { createSession, clearSession } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/permissions";
import { categorySchema, loginSchema, officerRegistrationSchema, setupSchema } from "@/lib/validation";

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

  const { password } = parsed.data;
  const email = parsed.data.email.toLowerCase();
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

  if (user.status === "PENDING_APPROVAL") {
    return { ok: false, error: "Your account is awaiting administrator approval." };
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

export async function registerOfficerAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData
) {
  const parsed = officerRegistrationSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid registration details." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, message: "An account with that email address already exists." };
  }

  const officerRole = await db.role.upsert({
    where: { name: "OFFICER" },
    update: {},
    create: { name: "OFFICER" },
  });

  let officer: { id: string; name: string; email: string };
  try {
    officer = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        roleId: officerRole.id,
        status: "PENDING_APPROVAL",
      },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "An account with that email address already exists." };
    }
    throw error;
  }

  const admins = await db.user.findMany({
    where: { role: { name: "ADMIN" }, status: "ACTIVE" },
    select: { name: true, email: true },
  });

  try {
    await sendNewOfficerRegistrationEmail(admins, officer);
  } catch (error) {
    console.error("Officer registration was saved, but administrator notification email could not be sent:", error);
    return {
      ok: false,
      message: `Registration was saved and is awaiting approval, but the administrator notification email failed: ${error instanceof Error ? error.message : "Unknown email delivery error."} Do not submit the registration again.`,
    };
  }

  return {
    ok: true,
    message: "Registration submitted. Your account will be available after an administrator approves it.",
  };
}

export async function createCategoryAction(
  _previousState: { ok: boolean; message: string; saved?: boolean },
  formData: FormData,
) {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please enter a valid category.",
    };
  }

  try {
    await db.category.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "A category with this name already exists." };
    }
    throw error;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/beneficiaries");
  revalidatePath("/admin/officers");
  revalidatePath("/admin/officers/[officerId]", "page");
  revalidatePath("/officer/dashboard");
  return { ok: true, message: "Category added successfully.", saved: true };
}

export async function deleteCategoryAction(
  _previousState: { ok: boolean; message: string },
  formData: FormData,
) {
  await requireAdmin();

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!categoryId) {
    return { ok: false, message: "Select a category to delete." };
  }

  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: {
      name: true,
      _count: {
        select: {
          beneficiaries: true,
          assignments: true,
          userCategories: true,
        },
      },
    },
  });

  if (!category) {
    return { ok: false, message: "This category no longer exists. Refresh the page." };
  }

  const linkedItems = ([
    [category._count.beneficiaries, "beneficiaries"],
    [category._count.userCategories, "officer assignments"],
    [category._count.assignments, "assignment records"],
  ] as const)
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`);

  let deletedCount = 0;
  try {
    const result = await db.category.deleteMany({
      where: {
        id: categoryId,
        beneficiaries: { none: {} },
        assignments: { none: {} },
        userCategories: { none: {} },
      },
    });
    deletedCount = result.count;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        ok: false,
        message: `Cannot delete "${category.name}" because it is linked to other records. Reassign or remove them first.`,
      };
    }
    throw error;
  }

  if (deletedCount === 0) {
    return {
      ok: false,
      message: linkedItems.length > 0
        ? `Cannot delete "${category.name}" because it is linked to ${linkedItems.join(", ")}. Reassign or remove them first.`
        : "This category is in use. Refresh the page and try again.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/officers");
  revalidatePath("/officer/dashboard");

  return { ok: true, message: `Category "${category.name}" deleted.` };
}

export async function createOfficerAction(
  _previousState: { ok: boolean; message: string; saved?: boolean; resetKey: number },
  formData: FormData,
) {
  await requireAdmin();

  const parsed = officerRegistrationSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Enter valid officer details.",
      resetKey: _previousState.resetKey,
    };
  }

  const categoryIds = Array.from(
    new Set(formData.getAll("categoryIds").flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean)),
  );
  if (categoryIds.length === 0) {
    return { ok: false, message: "Select at least one authorized category.", resetKey: _previousState.resetKey };
  }

  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true },
  });
  if (categories.length !== categoryIds.length) {
    return { ok: false, message: "One or more selected categories are no longer available. Refresh and try again.", resetKey: _previousState.resetKey };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, message: "An account with that email address already exists.", resetKey: _previousState.resetKey };
  }

  const officerRole = await db.role.upsert({
    where: { name: "OFFICER" },
    update: {},
    create: { name: "OFFICER" },
  });

  try {
    await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        roleId: officerRole.id,
        status: "ACTIVE",
        userCategories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "An account with that email address already exists.", resetKey: _previousState.resetKey };
    }
    throw error;
  }

  revalidatePath("/admin/officers");
  revalidatePath("/admin/dashboard");
  revalidatePath("/officer/dashboard");
  return { ok: true, message: "Officer account created successfully.", saved: true, resetKey: _previousState.resetKey + 1 };
}

export async function approveOfficerAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData
) {
  await requireAdmin();

  const officerId = String(formData.get("officerId") ?? "");
  if (!officerId) {
    return { ok: false, message: "Officer was not found." };
  }

  const officer = await db.user.findUnique({
    where: { id: officerId },
    include: { role: true },
  });

  if (!officer || officer.role.name !== "OFFICER") {
    return { ok: false, message: "Officer was not found." };
  }
  if (officer.status !== "PENDING_APPROVAL") {
    return { ok: false, message: "This officer account is no longer awaiting approval." };
  }

  try {
    await sendOfficerApprovalEmail({ name: officer.name, email: officer.email });
  } catch (error) {
    console.error("Unable to send officer approval email:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to send the approval email. The account remains pending.",
    };
  }

  const result = await db.user.updateMany({
    where: { id: officer.id, roleId: officer.roleId, status: "PENDING_APPROVAL" },
    data: { status: "ACTIVE" },
  });

  if (result.count !== 1) {
    return {
      ok: false,
      message: "The approval email was sent, but the account status changed. Refresh and review the account.",
    };
  }

  revalidatePath("/admin/officers");
  revalidatePath(`/admin/officers/${officer.id}`);
  revalidatePath("/admin/categories");
  revalidatePath("/officer/dashboard");

  return { ok: true, message: "Account approved and notification email sent." };
}

export async function rejectOfficerAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData
) {
  await requireAdmin();

  const officerId = String(formData.get("officerId") ?? "");
  if (!officerId) {
    return { ok: false, message: "Officer was not found." };
  }

  const officer = await db.user.findUnique({
    where: { id: officerId },
    include: { role: true },
  });

  if (!officer || officer.role.name !== "OFFICER") {
    return { ok: false, message: "Officer was not found." };
  }
  if (officer.status !== "PENDING_APPROVAL") {
    return { ok: false, message: "This officer account is no longer awaiting approval." };
  }

  try {
    await sendOfficerRejectionEmail({ name: officer.name, email: officer.email });
  } catch (error) {
    console.error("Unable to send officer rejection email:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to send the rejection email. The account remains pending.",
    };
  }

  const result = await db.user.updateMany({
    where: { id: officer.id, roleId: officer.roleId, status: "PENDING_APPROVAL" },
    data: { status: "INACTIVE" },
  });

  if (result.count !== 1) {
    return {
      ok: false,
      message: "The rejection email was sent, but the account status changed. Refresh and review the account.",
    };
  }

  revalidatePath("/admin/officers");
  revalidatePath(`/admin/officers/${officer.id}`);
  revalidatePath("/admin/categories");

  return { ok: true, message: "Account rejected and notification email sent." };
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
  if (officer.status === "PENDING_APPROVAL") {
    throw new Error("Approve this officer before assigning categories.");
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
  if (officers.some((officer) => officer.status === "PENDING_APPROVAL")) {
    throw new Error("Approve officers before assigning categories.");
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
