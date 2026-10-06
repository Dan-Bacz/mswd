import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "mswd-development-secret-key-2026");

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/login") || pathname.startsWith("/setup")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("mswd_session")?.value;

  if (!token) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/officer")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  try {
    const verified = await jwtVerify(token, secret);
    const role = String(verified.payload.role ?? "");

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/officer/dashboard", request.url));
    }

    if (pathname.startsWith("/officer") && role !== "OFFICER") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/admin") || pathname.startsWith("/officer")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/admin/:path*", "/officer/:path*", "/login", "/setup"],
};
