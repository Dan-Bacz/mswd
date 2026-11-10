import { notFound } from "next/navigation";
import { BeneficiaryProfile } from "@/components/beneficiaries/beneficiary-profile";
import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminBeneficiaryProfilePage({ params }: { params: Promise<{ beneficiaryId: string }> }) {
  await requireAdmin();
  const { beneficiaryId } = await params;
  const beneficiary = await db.beneficiary.findUnique({
    where: { id: beneficiaryId },
    include: { category: true, assignedOfficer: { select: { name: true } }, documents: { where: { fileType: "PROFILE_IMAGE" }, select: { id: true }, take: 1 }, _count: { select: { assistanceRecords: true } } },
  });
  if (!beneficiary) notFound();
  return <BeneficiaryProfile beneficiary={{ ...beneficiary, categoryName: beneficiary.category.name, assignedOfficerName: beneficiary.assignedOfficer?.name ?? null, hasPhoto: beneficiary.documents.length > 0, assistanceCount: beneficiary._count.assistanceRecords, dateOfBirth: beneficiary.dateOfBirth?.toISOString() ?? null, generalIntakeData: beneficiary.generalIntakeData && typeof beneficiary.generalIntakeData === "object" && !Array.isArray(beneficiary.generalIntakeData) ? { ...beneficiary.generalIntakeData, firstName: beneficiary.firstName, middleName: beneficiary.middleName ?? "", lastName: beneficiary.lastName, sex: beneficiary.sex, dateOfBirth: beneficiary.dateOfBirth?.toISOString().slice(0, 10) ?? "", address: beneficiary.address } as Record<string, unknown> : null, soloParentData: beneficiary.soloParentData && typeof beneficiary.soloParentData === "object" && !Array.isArray(beneficiary.soloParentData) ? beneficiary.soloParentData as Record<string, unknown> : null }} canEdit backHref="/admin/beneficiaries" />;
}
