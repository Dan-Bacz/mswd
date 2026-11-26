import { MembershipForm } from "@/components/membership/membership-form";
import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { isPwdCategory } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMembershipPage() {
  await requireAdmin();
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const visibleCategories = categories.filter((category) => !isPwdCategory(category.name));
  const visibleCategoryIds = visibleCategories.map((category) => category.id);
  const beneficiaries = await db.beneficiary.findMany({ where: { categoryId: { in: visibleCategoryIds } }, include: { category: { select: { name: true } }, assignedOfficer: { select: { name: true } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  return <MembershipForm officerMode={false} categories={visibleCategories} beneficiaries={beneficiaries.map((beneficiary) => ({ ...beneficiary, categoryName: beneficiary.category.name, assignedOfficerName: beneficiary.assignedOfficer?.name ?? null }))} />;
}
