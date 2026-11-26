import { notFound } from "next/navigation";
import { VawcIntakePageForm } from "@/components/beneficiaries/vawc-intake-page-form";
import { requireOfficerCategory, requireRole } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewVawcIntakeBeneficiaryPage({ searchParams }: { searchParams?: Promise<{ categoryId?: string }> | { categoryId?: string } }) {
  const user = await requireRole("OFFICER");
  const params = await Promise.resolve(searchParams ?? {});
  const categoryId = await requireOfficerCategory(user, typeof params.categoryId === "string" ? params.categoryId : null);
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true } });
  const name = category?.name.toLowerCase() ?? "";
  if (!category || (!name.includes("vawc") && (!name.includes("special protection") || name.includes("children in need of special protection")))) notFound();
  return <VawcIntakePageForm category={category} officers={[]} officerMode backHref={`/officer/beneficiaries?categoryId=${category.id}`} />;
}
