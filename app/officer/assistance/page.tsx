import { AssistanceManagement } from "@/components/assistance/assistance-management";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerAssistancePage() {
  const user = await requireRole("OFFICER");

  const [beneficiaries, records] = await Promise.all([
    db.beneficiary.findMany({
      where: { categoryId: { in: user.categoryIds } },
      include: { category: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.beneficiaryAssistance.findMany({
      where: { beneficiary: { categoryId: { in: user.categoryIds } } },
      include: {
        beneficiary: { include: { category: true } },
        providedBy: { select: { name: true } },
      },
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <AssistanceManagement
      beneficiaries={beneficiaries}
      records={records}
      officers={[]}
      isAdmin={false}
      subtitle="Record and manage in-person assistance requested by beneficiaries in your assigned categories."
    />
  );
}
