import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
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

  const side = new URL(request.url).searchParams.get("side");
  const selected = side === "front" && document.frontContent
    ? { name: document.frontOriginalName ?? "national-id-front", mimeType: document.frontMimeType ?? "application/octet-stream", size: document.frontSize ?? document.frontContent.byteLength, content: document.frontContent }
    : side === "back" && document.backContent
      ? { name: document.backOriginalName ?? "national-id-back", mimeType: document.backMimeType ?? "application/octet-stream", size: document.backSize ?? document.backContent.byteLength, content: document.backContent }
      : { name: document.originalName, mimeType: document.mimeType, size: document.size, content: document.content };
  const safeName = selected.name.replace(/["\r\n]/g, "_");
  const body = new Blob([new Uint8Array(selected.content)], { type: selected.mimeType });

  return new NextResponse(body, {
    headers: {
      "Content-Type": selected.mimeType,
      "Content-Length": String(selected.size),
      "Content-Disposition": `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
