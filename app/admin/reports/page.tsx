import { ReportBuilder } from "@/components/reports/report-builder";
import { requireAdmin } from "@/lib/auth/permissions";
import { getReportData, getReportDateRange } from "@/lib/reporting";

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

  return (
    <ReportBuilder
      dateRange={dateRange}
      beneficiaries={data.beneficiaries}
      assistance={data.assistance}
      generatedAt={new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }).format(new Date())}
    />
  );
}
