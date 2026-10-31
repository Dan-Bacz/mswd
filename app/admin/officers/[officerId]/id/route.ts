import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ officerId: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { officerId } = await params;
  const document = await db.staffIdDocument.findUnique({ where: { userId: officerId } });

  if (!document) {
    return new NextResponse("Document not found", { status: 404 });
  }

  const safeName = document.originalName.replace(/["\r\n]/g, "_");
  const body = new Blob([new Uint8Array(document.content)], { type: document.mimeType });

  return new NextResponse(body, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Length": String(document.size),
      "Content-Disposition": `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
