import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "mswd_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OFFICER";
  categoryIds: string[];
};

const secretKey = new TextEncoder().encode(
  process.env.AUTH_SECRET || "mswd-development-secret-key-2026"
);

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    categoryIds: user.categoryIds,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;

  if (!value) {
    return null;
  }

  try {
    const payload = await jwtVerify(value, secretKey);
    const session = payload.payload as Partial<SessionUser>;

    if (!session.id || !session.email || !session.role) {
      return null;
    }

    return {
      id: String(session.id),
      name: String(session.name ?? "User"),
      email: String(session.email),
      role: session.role === "ADMIN" ? "ADMIN" : "OFFICER",
      categoryIds: Array.isArray(session.categoryIds)
        ? session.categoryIds.map(String)
        : [],
    };
  } catch {
    return null;
  }
}
