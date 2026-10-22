import { AssistanceManagement } from "@/components/assistance/assistance-management";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminAssistancePage() {
  await requireAdmin();

  const [beneficiaries, records] = await Promise.all([
    db.beneficiary.findMany({
      include: { category: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.beneficiaryAssistance.findMany({
      include: {
        beneficiary: { include: { category: true } },
        providedBy: { select: { name: true } },
      },
      orderBy: [{ providedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <AssistanceManagement
      beneficiaries={beneficiaries}
      records={records}
      subtitle="Review assistance provided across all beneficiary categories."
    />
  );
}
