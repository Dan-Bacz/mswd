import Link from "next/link";
import { Activity, ArrowRight, Bell, Briefcase, ClipboardList, FolderTree, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [myBeneficiaries, activeCases, pendingCases, notifications, categories] =
    await Promise.all([
      db.beneficiary.count({ where: { assignedOfficerId: user.id } }),
      db.case.count({
        where: {
          assignedOfficerId: user.id,
          status: { in: ["ACTIVE", "UNDER_ASSESSMENT", "FOR_FOLLOW_UP"] },
        },
      }),
      db.case.count({ where: { assignedOfficerId: user.id, status: "PENDING" } }),
      db.notification.count({ where: { userId: user.id } }),
      db.category.findMany({
        where: { userCategories: { some: { userId: user.id } } },
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              cases: { where: { assignedOfficerId: user.id } },
              beneficiaries: { where: { assignedOfficerId: user.id } },
            },
          },
        },
      }),
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FolderTree className="h-5 w-5 text-sky-700" />
            <h3 className="text-xl font-semibold text-slate-900">My category dashboards</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {categories.length} assigned
          </span>
        </div>

        {categories.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/officer/categories/${category.id}`}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-300 hover:bg-sky-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Category dashboard
                    </p>
                    <h4 className="mt-2 text-base font-semibold text-slate-900">{category.name}</h4>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-sky-700" />
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                  <span>
                    <span className="font-semibold text-slate-900">{category._count.cases}</span> tasks
                  </span>
                  <span>
                    <span className="font-semibold text-slate-900">{category._count.beneficiaries}</span>{" "}
                    beneficiaries
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <Activity className="mb-2 h-5 w-5 text-slate-400" />
            No categories are assigned to you yet. Ask the administrator to assign you to a
            category to unlock its dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
