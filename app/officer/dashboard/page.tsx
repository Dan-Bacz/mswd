import { Activity, Bell, Briefcase, ClipboardList, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const categoryIds = user.categoryIds.length > 0 ? user.categoryIds : ["__no_access__"];

  const [myBeneficiaries, activeCases, pendingCases, notifications] = await Promise.all([
    db.beneficiary.count({ where: { assignedOfficerId: user.id } }),
    db.case.count({ where: { assignedOfficerId: user.id, status: { in: ["ACTIVE", "UNDER_ASSESSMENT", "FOR_FOLLOW_UP"] } } }),
    db.case.count({ where: { assignedOfficerId: user.id, status: "PENDING" } }),
    db.notification.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Officer dashboard</h1>
        <p className="mt-2 text-slate-600">Authorized view for {user.name}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="My beneficiaries" value={String(myBeneficiaries)} hint="Accessible caseload" icon={<UserRound className="h-5 w-5" />} />
        <MetricCard label="Active cases" value={String(activeCases)} hint="Ongoing casework" icon={<Briefcase className="h-5 w-5" />} />
        <MetricCard label="Pending cases" value={String(pendingCases)} hint="Needs attention" icon={<ClipboardList className="h-5 w-5" />} />
        <MetricCard label="Notifications" value={String(notifications)} hint="Recent updates" icon={<Bell className="h-5 w-5" />} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-sky-700" />
          <h3 className="text-xl font-semibold text-slate-900">Authorization scope</h3>
        </div>
        <p className="mt-3 text-slate-600">
          This officer is limited to: {categoryIds.length > 0 && categoryIds[0] !== "__no_access__" ? categoryIds.join(", ") : "No categories assigned"}
        </p>
      </div>
    </div>
  );
}
