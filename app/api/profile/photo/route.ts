import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const profile = await db.userProfile.findUnique({
    where: { userId: user.id },
    select: { photoContent: true, photoMimeType: true, photoSize: true },
  });
  if (!profile?.photoContent || !profile.photoMimeType) return new NextResponse("Photo not found", { status: 404 });

  return new NextResponse(new Blob([new Uint8Array(profile.photoContent)], { type: profile.photoMimeType }), {
    headers: {
      "Content-Type": profile.photoMimeType,
      "Content-Length": String(profile.photoSize ?? profile.photoContent.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
