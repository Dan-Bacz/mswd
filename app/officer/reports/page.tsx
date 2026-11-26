import { ReportBuilder } from "@/components/reports/report-builder";
import { requireRole } from "@/lib/auth/permissions";
import { getReportData, getReportDateRange } from "@/lib/reporting";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OfficerReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const user = await requireRole("OFFICER");
  const params = await searchParams;
  const dateRange = getReportDateRange(params?.startDate, params?.endDate);
  const data = await getReportData(dateRange, user.id, undefined, user.categoryIds);
  const assignedCategories = await db.category.findMany({
    where: { id: { in: user.categoryIds } },
    orderBy: { name: "asc" },
    select: { name: true },
  });

  return (
    <ReportBuilder
      dateRange={dateRange}
      categoryOptions={assignedCategories.map((category) => category.name)}
      beneficiaries={data.beneficiaries}
      assistance={data.assistance}
      assistanceTypes={data.assistanceTypes}
      staffOptions={[{ id: user.id, name: user.name }]}
      officerName={user.name}
      generatedAt={new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }).format(new Date())}
    />
  );
}
