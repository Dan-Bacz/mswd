import { notFound } from "next/navigation";
import { SoloParentPageForm } from "@/components/beneficiaries/solo-parent-page-form";
import { requireOfficerCategory, requireRole } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewSoloParentBeneficiaryPage({ searchParams }: { searchParams?: Promise<{ categoryId?: string }> | { categoryId?: string } }) {
  const user = await requireRole("OFFICER");
  const params = await Promise.resolve(searchParams ?? {});
  const categoryId = await requireOfficerCategory(user, typeof params.categoryId === "string" ? params.categoryId : null);
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true } });
  if (!category || !category.name.toLowerCase().includes("solo parent")) notFound();
  return <SoloParentPageForm category={category} officers={[]} officerMode={true} backHref={`/officer/beneficiaries?categoryId=${category.id}`} />;
}
