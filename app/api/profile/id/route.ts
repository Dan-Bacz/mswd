import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const document = await db.staffIdDocument.findUnique({ where: { userId: user.id } });
  if (!document) return new NextResponse("ID not found", { status: 404 });

  const side = new URL(request.url).searchParams.get("side");
  const selected = side === "front" && document.frontContent
    ? { mimeType: document.frontMimeType ?? "application/octet-stream", size: document.frontSize ?? document.frontContent.byteLength, content: document.frontContent }
    : side === "back" && document.backContent
      ? { mimeType: document.backMimeType ?? "application/octet-stream", size: document.backSize ?? document.backContent.byteLength, content: document.backContent }
      : { mimeType: document.mimeType, size: document.size, content: document.content };

  return new NextResponse(new Blob([new Uint8Array(selected.content)], { type: selected.mimeType }), {
    headers: {
      "Content-Type": selected.mimeType,
      "Content-Length": String(selected.size),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
