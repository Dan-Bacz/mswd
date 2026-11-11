import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { AssistanceRecordForm } from "@/components/assistance/assistance-record-form";

export const dynamic = "force-dynamic";

export default async function NewAdminAssistancePage() {
  await requireAdmin();
  const beneficiaries = await db.beneficiary.findMany({ include: { category: { select: { name: true } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  return <AssistanceRecordForm beneficiaries={beneficiaries} backHref="/admin/assistance" />;
}
