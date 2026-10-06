import { BarChart3, Briefcase, FileText, UserRound, Users } from "lucide-react";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [beneficiaries, activeCases, closedCases, pendingCases, officers, categories, thisMonthBeneficiaries] = await Promise.all([
    db.beneficiary.count({}),
    db.case.count({ where: { status: { in: ["ACTIVE", "UNDER_ASSESSMENT", "FOR_FOLLOW_UP", "FOR_REFERRAL"] } } }),
    db.case.count({ where: { status: "CLOSED" } }),
    db.case.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { role: { name: "OFFICER" } } }),
    db.category.count(),
    db.beneficiary.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="mt-2 text-slate-600">Real statistics from the MSWD database.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total beneficiaries" value={String(beneficiaries)} hint="All active records" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Active cases" value={String(activeCases)} hint="Open and active workstreams" icon={<Briefcase className="h-5 w-5" />} />
        <MetricCard label="Closed cases" value={String(closedCases)} hint="Completed or archived" icon={<FileText className="h-5 w-5" />} />
        <MetricCard label="Officers" value={String(officers)} hint="Authorized field personnel" icon={<UserRound className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Pending cases" value={String(pendingCases)} hint="Awaiting action" icon={<BarChart3 className="h-5 w-5" />} />
        <MetricCard label="Categories" value={String(categories)} hint="MSWD service groups" icon={<BarChart3 className="h-5 w-5" />} />
        <MetricCard label="New beneficiaries this month" value={String(thisMonthBeneficiaries)} hint="Current month" icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Operational status</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-sky-50 p-4">
            <p className="text-sm text-sky-700">Monthly coverage</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{thisMonthBeneficiaries} records</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Case resolution</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{closedCases} closed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
