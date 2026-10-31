import { BeneficiaryRegistry } from "@/components/admin/beneficiary-registry";
import { db } from "@/lib/db";
import { shouldShowBeneficiaryCategory } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BeneficiariesPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{ category?: string; categoryId?: string; q?: string }>
    | { category?: string; categoryId?: string; q?: string };
}) {
  const params = await Promise.resolve(searchParams ?? {});
  const requestedCategory = typeof params.category === "string" ? params.category : undefined;
  const requestedCategoryId = typeof params.categoryId === "string" ? params.categoryId : undefined;
  const initialSearch = typeof params.q === "string" ? params.q : "";

  const [categories, officers] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: { name: "OFFICER" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, userCategories: { select: { categoryId: true } } },
    }),
  ]);
  const filterCategories = categories.filter((category) => shouldShowBeneficiaryCategory(category.name));
  const selectedCategory =
    categories.find((category) => category.id === requestedCategoryId) ??
    filterCategories.find((category) => category.name === requestedCategory);
  const beneficiaries = await db.beneficiary.findMany({
    where: selectedCategory ? { categoryId: selectedCategory.id } : undefined,
    include: { category: { select: { id: true, name: true } }, assignedOfficer: { select: { name: true } } },
    orderBy: { registrationDate: "desc" },
  });

  return (
    <BeneficiaryRegistry
      categories={categories.map(({ id, name }) => ({ id, name }))}
      filterCategories={filterCategories.map(({ id, name }) => ({ id, name }))}
      officers={officers.map((officer) => ({
        id: officer.id,
        name: officer.name,
        categoryIds: officer.userCategories.map((assignment) => assignment.categoryId),
      }))}
      beneficiaries={beneficiaries.map((beneficiary) => ({
        id: beneficiary.id,
        beneficiaryNumber: beneficiary.beneficiaryNumber,
        fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
        categoryId: beneficiary.category.id,
        categoryName: beneficiary.category.name,
        barangay: beneficiary.barangay,
        officerName: beneficiary.assignedOfficer?.name ?? null,
        status: beneficiary.status,
      }))}
      selectedCategoryId={selectedCategory?.id}
      initialSearch={initialSearch}
    />
  );
}
