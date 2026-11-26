import { MembershipForm } from "@/components/membership/membership-form";
import { requireRole } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OfficerMembershipPage() {
  const user = await requireRole("OFFICER");
  const [categories, beneficiaries] = await Promise.all([
    db.category.findMany({
      where: { id: { in: user.categoryIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.beneficiary.findMany({
      where: { categoryId: { in: user.categoryIds } },
      include: { category: { select: { name: true } }, assignedOfficer: { select: { name: true } } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);
  return (
    <MembershipForm
      officerMode
      categories={categories}
      beneficiaries={beneficiaries.map((beneficiary) => ({
        ...beneficiary,
        categoryName: beneficiary.category.name,
        assignedOfficerName: beneficiary.assignedOfficer?.name ?? null,
      }))}
    />
  );
}
