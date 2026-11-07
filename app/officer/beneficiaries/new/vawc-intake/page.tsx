import { notFound } from "next/navigation";
import { VawcIntakePageForm } from "@/components/beneficiaries/vawc-intake-page-form";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewVawcIntakeBeneficiaryPage() {
  const { categoryId } = await requireSelectedOfficerCategory();
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true } });
  const name = category?.name.toLowerCase() ?? "";
  if (!category || (!name.includes("vawc") && !name.includes("special protection"))) notFound();
  return <VawcIntakePageForm category={category} officers={[]} officerMode backHref="/officer/beneficiaries" />;
}
