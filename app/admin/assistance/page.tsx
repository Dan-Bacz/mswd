import { AssistanceManagement } from "@/components/assistance/assistance-management";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { isPwdCategory } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAssistancePage({ searchParams }: { searchParams?: Promise<{ categoryId?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const allCategories = await db.category.findMany({ select: { id: true, name: true } });
  const visibleCategoryIds = allCategories.filter((category) => !isPwdCategory(category.name)).map((category) => category.id);

  const [beneficiaries, records, officers] = await Promise.all([
    db.beneficiary.findMany({
      where: { categoryId: { in: visibleCategoryIds } },
      include: { category: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.beneficiaryAssistance.findMany({
      where: { beneficiary: { categoryId: { in: visibleCategoryIds } } },
      include: {
        beneficiary: { include: { category: true } },
        providedBy: { select: { name: true } },
      },
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
    }),
    db.user.findMany({
      where: { role: { name: "OFFICER" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <AssistanceManagement
      beneficiaries={beneficiaries}
      records={records}
      officers={officers}
      isAdmin
      subtitle="Monitor and manage in-person assistance transactions across authorized beneficiary categories."
      initialCategoryId={params?.categoryId}
    />
  );
}
