import { notFound } from "next/navigation";
import { GeneralIntakePageForm } from "@/components/beneficiaries/general-intake-page-form";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewGeneralIntakeBeneficiaryPage() {
  const { categoryId } = await requireSelectedOfficerCategory();
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true } });
  const categoryName = category?.name.toLowerCase() ?? "";
  if (!category || categoryName.includes("solo parent") || categoryName.includes("vawc") || (categoryName.includes("special protection") && !categoryName.includes("children in need of special protection"))) notFound();
  return <GeneralIntakePageForm category={category} officers={[]} officerMode backHref="/officer/beneficiaries" />;
}
