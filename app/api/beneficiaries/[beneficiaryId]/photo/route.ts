import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ beneficiaryId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { beneficiaryId } = await params;

  const beneficiary = await db.beneficiary.findUnique({
    where: { id: beneficiaryId },
    select: { assignedOfficerId: true },
  });
  if (!beneficiary || (user.role !== "ADMIN" && beneficiary.assignedOfficerId !== user.id)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const photo = await db.document.findFirst({
    where: { beneficiaryId, fileType: "PROFILE_IMAGE" },
    orderBy: { uploadedAt: "desc" },
    select: { content: true, mimeType: true, size: true },
  });
  if (!photo?.content) return new NextResponse("Photo not found", { status: 404 });

  return new NextResponse(new Blob([new Uint8Array(photo.content)], { type: photo.mimeType }), {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(photo.size),
      "Cache-Control": "private, no-store",
    },
  });
}
