import { notFound } from "next/navigation";
import { GeneralIntakePageForm } from "@/components/beneficiaries/general-intake-page-form";
import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewGeneralIntakeBeneficiaryPage({ searchParams }: { searchParams?: Promise<{ categoryId?: string }> | { categoryId?: string } }) {
  await requireAdmin();
  const params = await Promise.resolve(searchParams ?? {});
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "";
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true } });
  const categoryName = category?.name.toLowerCase() ?? "";
  if (!category || categoryName.includes("solo parent") || categoryName.includes("vawc") || (categoryName.includes("special protection") && !categoryName.includes("children in need of special protection"))) notFound();
  const officers = await db.user.findMany({
    where: { role: { name: "OFFICER" }, status: "ACTIVE", userCategories: { some: { categoryId: category.id } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, userCategories: { select: { categoryId: true } } },
  });
  return <GeneralIntakePageForm category={category} officers={officers.map((officer) => ({ id: officer.id, name: officer.name, categoryIds: officer.userCategories.map((item) => item.categoryId) }))} officerMode={false} backHref={`/admin/beneficiaries?categoryId=${category.id}`} />;
}
