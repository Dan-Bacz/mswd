import { notFound } from "next/navigation";
import { SoloParentPageForm } from "@/components/beneficiaries/solo-parent-page-form";
import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewSoloParentBeneficiaryPage() {
  await requireAdmin();
  const category = await db.category.findFirst({ where: { name: { contains: "Solo Parent" } }, select: { id: true, name: true } });
  if (!category) notFound();
  const officers = await db.user.findMany({
    where: { role: { name: "OFFICER" }, status: "ACTIVE", userCategories: { some: { categoryId: category.id } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, userCategories: { select: { categoryId: true } } },
  });
  return <SoloParentPageForm category={category} officers={officers.map((officer) => ({ id: officer.id, name: officer.name, categoryIds: officer.userCategories.map((item) => item.categoryId) }))} officerMode={false} backHref="/admin/beneficiaries" />;
}
