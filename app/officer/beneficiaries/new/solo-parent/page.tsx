import { notFound } from "next/navigation";
import { SoloParentPageForm } from "@/components/beneficiaries/solo-parent-page-form";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewSoloParentBeneficiaryPage() {
  const { categoryId } = await requireSelectedOfficerCategory();
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true } });
  if (!category || !category.name.toLowerCase().includes("solo parent")) notFound();
  return <SoloParentPageForm category={category} officers={[]} officerMode={true} backHref="/officer/beneficiaries" />;
}
