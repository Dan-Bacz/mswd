import { MembershipForm } from "@/components/membership/membership-form";
import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMembershipPage() {
  await requireAdmin();
  const beneficiaries = await db.beneficiary.findMany({ include: { category: { select: { name: true } }, assignedOfficer: { select: { name: true } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  return <MembershipForm officerMode={false} beneficiaries={beneficiaries.map((beneficiary) => ({ ...beneficiary, categoryName: beneficiary.category.name, assignedOfficerName: beneficiary.assignedOfficer?.name ?? null }))} />;
}
