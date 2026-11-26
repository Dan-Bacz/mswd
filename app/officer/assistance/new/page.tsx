import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { AssistanceRecordForm } from "@/components/assistance/assistance-record-form";

export const dynamic = "force-dynamic";

export default async function NewOfficerAssistancePage() {
  const user = await requireRole("OFFICER");
  const beneficiaries = await db.beneficiary.findMany({ where: { categoryId: { in: user.categoryIds } }, include: { category: { select: { name: true } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  return <AssistanceRecordForm beneficiaries={beneficiaries} backHref="/officer/assistance" />;
}
