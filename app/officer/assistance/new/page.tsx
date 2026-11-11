import { db } from "@/lib/db";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";
import { AssistanceRecordForm } from "@/components/assistance/assistance-record-form";

export const dynamic = "force-dynamic";

export default async function NewOfficerAssistancePage() {
  const { categoryId } = await requireSelectedOfficerCategory();
  const beneficiaries = await db.beneficiary.findMany({ where: { categoryId }, include: { category: { select: { name: true } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  return <AssistanceRecordForm beneficiaries={beneficiaries} backHref="/officer/assistance" />;
}
