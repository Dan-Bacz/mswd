import { ReportBuilder } from "@/components/reports/report-builder";
import { requireRole } from "@/lib/auth/permissions";
import { getReportData, getReportDateRange } from "@/lib/reporting";

export const dynamic = "force-dynamic";

export default async function OfficerReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const user = await requireRole("OFFICER");
  const params = await searchParams;
  const dateRange = getReportDateRange(params?.startDate, params?.endDate);
  const data = await getReportData(dateRange, user.id);

  return (
    <ReportBuilder
      dateRange={dateRange}
      beneficiaries={data.beneficiaries}
      assistance={data.assistance}
      officerName={user.name}
      generatedAt={new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }).format(new Date())}
    />
  );
}
