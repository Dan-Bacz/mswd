import { BeneficiaryRegistry } from "@/components/admin/beneficiary-registry";
import { db } from "@/lib/db";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerBeneficiariesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }> | { q?: string };
}) {
  const params = await Promise.resolve(searchParams ?? {});
  const initialSearch = typeof params.q === "string" ? params.q : "";
  const { user } = await requireSelectedOfficerCategory();

  const [categories, beneficiaries] = await Promise.all([
    db.category.findMany({
      where: { id: { in: user.categoryIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.beneficiary.findMany({
      where: { categoryId: { in: user.categoryIds } },
      include: { category: true },
      orderBy: { registrationDate: "desc" },
      take: 25,
    }),
  ]);

  return (
    <BeneficiaryRegistry
      categories={categories}
      filterCategories={[]}
      officers={[]}
      beneficiaries={beneficiaries.map((beneficiary) => ({
        id: beneficiary.id,
        beneficiaryNumber: beneficiary.beneficiaryNumber,
        fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
        categoryId: beneficiary.category.id,
        categoryName: beneficiary.category.name,
        barangay: beneficiary.barangay,
        officerName: user.name,
        status: beneficiary.status,
      }))}
      selectedCategoryId={undefined}
      officerMode
      initialSearch={initialSearch}
    />
  );
}
