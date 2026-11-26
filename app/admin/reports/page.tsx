import { ReportBuilder } from "@/components/reports/report-builder";
import { requireAdmin } from "@/lib/auth/permissions";
import { getReportData, getReportDateRange } from "@/lib/reporting";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ startDate?: string; endDate?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const dateRange = getReportDateRange(params?.startDate, params?.endDate);
  const data = await getReportData(dateRange);
  const staff = await db.user.findMany({
    where: { role: { name: "OFFICER" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <ReportBuilder
      dateRange={dateRange}
      beneficiaries={data.beneficiaries}
      assistance={data.assistance}
      assistanceTypes={data.assistanceTypes}
      staffOptions={staff}
      generatedAt={new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }).format(new Date())}
    />
  );
}
