import { notFound } from "next/navigation";
import { BeneficiaryProfile } from "@/components/beneficiaries/beneficiary-profile";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OfficerBeneficiaryProfilePage({ params }: { params: Promise<{ beneficiaryId: string }> }) {
  const { user, categoryId } = await requireSelectedOfficerCategory();
  const { beneficiaryId } = await params;
  const beneficiary = await db.beneficiary.findUnique({
    where: { id: beneficiaryId },
    include: { category: true, assignedOfficer: { select: { id: true, name: true } }, documents: { where: { fileType: "PROFILE_IMAGE" }, select: { id: true }, take: 1 }, _count: { select: { assistanceRecords: true } } },
  });
  if (!beneficiary || beneficiary.assignedOfficerId !== user.id || beneficiary.categoryId !== categoryId) notFound();
  return <BeneficiaryProfile beneficiary={{ ...beneficiary, categoryName: beneficiary.category.name, assignedOfficerName: beneficiary.assignedOfficer?.name ?? null, hasPhoto: beneficiary.documents.length > 0, assistanceCount: beneficiary._count.assistanceRecords, dateOfBirth: beneficiary.dateOfBirth?.toISOString() ?? null }} canEdit backHref="/officer/beneficiaries" />;
}
