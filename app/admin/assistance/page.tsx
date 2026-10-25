import { AssistanceManagement } from "@/components/assistance/assistance-management";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminAssistancePage() {
  await requireAdmin();

  const [beneficiaries, records, officers] = await Promise.all([
    db.beneficiary.findMany({
      include: { category: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.beneficiaryAssistance.findMany({
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
    />
  );
}
