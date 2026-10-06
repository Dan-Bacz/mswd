import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OFFICER";
  categoryIds: string[];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return {
    ...session,
  };
}

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    redirect("/officer/dashboard");
  }

  return user;
}

export async function requireRole(role: "ADMIN" | "OFFICER") {
  const user = await requireAuth();

  if (user.role !== role) {
    if (role === "ADMIN") {
      redirect("/officer/dashboard");
    }

    redirect("/login");
  }

  return user;
}

export async function canAccessCategory(user: CurrentUser, categoryId: string) {
  if (user.role === "ADMIN") {
    return true;
  }

  return user.categoryIds.includes(categoryId);
}

export async function requireCategoryAccess(categoryId: string) {
  const user = await requireAuth();

  if (user.role === "ADMIN") {
    return user;
  }

  const allowed = await canAccessCategory(user, categoryId);

  if (!allowed) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function withCategoryGuard<T>(
  categoryId: string | null | undefined,
  callback: (user: CurrentUser) => Promise<T>
): Promise<T> {
  const user = await requireAuth();

  if (user.role === "ADMIN") {
    return callback(user);
  }

  if (!categoryId) {
    notFound();
  }

  if (!user.categoryIds.includes(categoryId)) {
    throw new Error("Forbidden");
  }

  return callback(user);
}

export async function getUserWithCategories(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      userCategories: {
        select: {
          categoryId: true,
        },
      },
    },
  });
}
