import { MembershipForm } from "@/components/membership/membership-form";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OfficerMembershipPage() {
  const { user, categoryId } = await requireSelectedOfficerCategory();
  const beneficiaries = await db.beneficiary.findMany({ where: { assignedOfficerId: user.id, categoryId }, include: { category: { select: { name: true } }, assignedOfficer: { select: { name: true } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  return <MembershipForm officerMode beneficiaries={beneficiaries.map((beneficiary) => ({ ...beneficiary, categoryName: beneficiary.category.name, assignedOfficerName: beneficiary.assignedOfficer?.name ?? null }))} />;
}
