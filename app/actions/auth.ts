"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, clearSession } from "@/lib/auth/session";
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
    categoryIds: String(formData.get("categoryIds") ?? ""),
  };

  if (!raw.name || !raw.email || !raw.password || !raw.categoryIds) {
    throw new Error("Please complete all fields and pick an authorized category.");
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
        create: raw.categoryIds
          .split(",")
          .filter(Boolean)
          .map((categoryId) => ({ categoryId })),
      },
    },
  });

  revalidatePath("/admin/officers");
}
