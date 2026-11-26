import { BeneficiaryRegistry } from "@/components/admin/beneficiary-registry";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerBeneficiariesPage({
  searchParams,
}: {
  searchParams?: Promise<{ categoryId?: string; q?: string; status?: string }> | { categoryId?: string; q?: string; status?: string };
}) {
  const params = await Promise.resolve(searchParams ?? {});
  const initialSearch = typeof params.q === "string" ? params.q : "";
  const requestedCategoryId = typeof params.categoryId === "string" ? params.categoryId : undefined;
  const statusFilter = params.status === "closed" ? "closed" : "active";
  const user = await requireRole("OFFICER");

  const categories = await db.category.findMany({
    where: { id: { in: user.categoryIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const selectedCategory = categories.find((category) => category.id === requestedCategoryId);
  const scope = selectedCategory
    ? { categoryId: selectedCategory.id }
    : { categoryId: { in: user.categoryIds } };

  const [beneficiaries, activeCount, closedCount] = await Promise.all([
    db.beneficiary.findMany({
      where: {
        ...scope,
        status: statusFilter === "closed" ? { in: ["INACTIVE", "ARCHIVED"] as const } : ("ACTIVE" as const),
      },
      include: { category: true },
      orderBy: { registrationDate: "desc" },
      take: 25,
    }),
    db.beneficiary.count({ where: { ...scope, status: "ACTIVE" } }),
    db.beneficiary.count({ where: { ...scope, status: { in: ["INACTIVE", "ARCHIVED"] } } }),
  ]);

  return (
    <BeneficiaryRegistry
      categories={categories}
      filterCategories={categories}
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
      selectedCategoryId={selectedCategory?.id}
      statusFilter={statusFilter}
      activeCount={activeCount}
      closedCount={closedCount}
      officerMode
      initialSearch={initialSearch}
    />
  );
}
