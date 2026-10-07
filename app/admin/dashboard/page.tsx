import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  FileText,
  Landmark,
  ShieldCheck,
  TrendingUp,
  Users,
  UserRound,
} from "lucide-react";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";

const categoryPalette = [
  "#2563EB",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
  "#EC4899",
  "#3B82F6",
  "#22C55E",
  "#F97316",
  "#A855F7",
  "#F43F5E",
  "#0EA5E9",
];

function buildDonutGradient(categories: Array<{ count: number; color: string }>, total: number) {
  if (total === 0) {
    return "conic-gradient(#e2e8f0 0 100%)";
  }

  let start = 0;
  const segments = categories
    .filter((category) => category.count > 0)
    .map((category) => {
      const segment = (category.count / total) * 100;
      const end = start + segment;
      const background = `${category.color} ${start}% ${end}%`;
      start = end;
      return background;
    })
    .join(", ");

  return `conic-gradient(${segments})`;
}

function getCaseStatusClassName(status: string) {
  const safeStatus = status?.toUpperCase() ?? "DEFAULT";

  switch (safeStatus) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "CLOSED":
      return "bg-slate-200 text-slate-700";
    case "UNDER_ASSESSMENT":
      return "bg-sky-100 text-sky-700";
    case "FOR_REFERRAL":
      return "bg-violet-100 text-violet-700";
    case "FOR_FOLLOW_UP":
      return "bg-orange-100 text-orange-700";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [beneficiaries, activeCases, pendingCases, officers, categories, thisMonthBeneficiaries, caseCategoryCounts, recentCases, recentActivity, systemSettings] = await Promise.all([
    db.beneficiary.count({}),
    db.case.count({ where: { status: { in: ["ACTIVE", "UNDER_ASSESSMENT", "FOR_FOLLOW_UP", "FOR_REFERRAL"] } } }),
    db.case.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { role: { name: "OFFICER" } } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.beneficiary.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    db.case.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
    }),
    db.case.findMany({
      include: { beneficiary: true, category: true },
      orderBy: { dateOpened: "desc" },
      take: 5,
    }),
    db.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.systemSetting.findMany({
      select: { key: true, value: true },
    }),
  ]);

  const categoryMap = new Map(caseCategoryCounts.map((entry) => [entry.categoryId, entry._count._all]));
  const categoryStats = categories.map((category, index) => ({
    ...category,
    count: categoryMap.get(category.id) ?? 0,
    color: categoryPalette[index % categoryPalette.length],
  }));
  const totalCaseCount = categoryStats.reduce((sum, item) => sum + item.count, 0);
  const municipality =
    systemSettings.find((setting) => ["municipality", "municipality_name", "municipal_name", "local_government_unit"].includes(setting.key.toLowerCase()))?.value ??
    "Municipal Government";

  const quickActions = [
    { label: "Add New Beneficiary", href: "/admin/beneficiaries", icon: Users },
    { label: "Create New Case", href: "/admin/cases", icon: BriefcaseBusiness },
    { label: "Generate Report", href: "/admin/reports", icon: FileText },
    { label: "Manage Users", href: "/admin/officers", icon: ShieldCheck },
  ];

  const donutGradient = buildDonutGradient(
    categoryStats.map((category) => ({ count: category.count, color: category.color })),
    totalCaseCount,
  );

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-6 lg:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">Good morning,</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Administrator</h1>
            <p className="mt-3 max-w-lg text-sm text-slate-600">
              Here&apos;s what&apos;s happening with your MSWD system today.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
                <CheckCircle2 className="h-4 w-4" />
                {beneficiaries} beneficiaries
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <TrendingUp className="h-4 w-4" />
                {activeCases} active cases
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                <CircleDashed className="h-4 w-4" />
                {pendingCases} pending
              </div>
            </div>
          </div>

          <div className="hidden bg-sky-50/80 p-6 lg:flex lg:items-center lg:justify-center">
            <div className="relative h-52 w-full max-w-[320px] rounded-[28px] border border-sky-200 bg-white p-5 shadow-[0_18px_35px_-28px_rgba(37,99,235,0.65)]">
              <div className="absolute inset-x-5 top-4 h-16 rounded-2xl bg-sky-50" />
              <div className="relative mt-12 flex items-end gap-3">
                <div className="h-20 w-16 rounded-t-[18px] bg-sky-200" />
                <div className="h-28 w-16 rounded-t-[18px] bg-sky-300" />
                <div className="h-24 w-16 rounded-t-[18px] bg-sky-400" />
                <div className="h-16 w-16 rounded-t-[18px] bg-sky-100" />
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-sky-100 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Location</p>
                  <p className="text-sm font-semibold text-slate-800">{municipality}</p>
                </div>
                <Landmark className="h-5 w-5 text-sky-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total beneficiaries" value={String(beneficiaries)} hint="Live beneficiary registry" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Active cases" value={String(activeCases)} hint="Open and active workstreams" icon={<BriefcaseBusiness className="h-5 w-5" />} />
        <MetricCard label="Pending cases" value={String(pendingCases)} hint="Awaiting action" icon={<AlertCircle className="h-5 w-5" />} />
        <MetricCard label="Total officers" value={String(officers)} hint="Authorized field personnel" icon={<UserRound className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-slate-900">Cases by Category</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {categories.length} categories
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="flex items-center justify-center">
              <div
                className="relative flex h-44 w-44 items-center justify-center rounded-full shadow-inner shadow-slate-200/80"
                style={{ background: donutGradient }}
              >
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner shadow-slate-200/80">
                  <span className="text-2xl font-bold text-slate-900">{totalCaseCount}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cases</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {categoryStats.map((category) => {
                const percentage = totalCaseCount > 0 ? Math.round((category.count / totalCaseCount) * 100) : 0;

                return (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="text-sm font-medium text-slate-700">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-sm font-semibold text-slate-900">{category.count}</span>
                      <span className="min-w-10 text-xs font-medium text-slate-500">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
          <h3 className="text-xl font-semibold text-slate-900">Current Flow</h3>

          <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white shadow-sm ring-1 ring-emerald-100" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-2/3 rounded-full bg-emerald-200" />
                <div className="h-2.5 w-1/2 rounded-full bg-emerald-100" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`h-12 rounded-2xl ${index % 2 === 0 ? "bg-emerald-100" : "bg-white"}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 text-emerald-700">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold">Dashboard Ready</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Dashboard records are loaded from the MSWD database and ready for review.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-slate-900">Recent Cases</h3>
            <Link href="/admin/cases" className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Case No.</th>
                  <th className="pb-3 pr-4 font-medium">Beneficiary</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Date Filed</th>
                  <th className="pb-3 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentCases.map((item) => (
                  <tr key={item.id} className="align-middle">
                    <td className="py-3 pr-4 font-medium text-slate-900">{item.caseNumber}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.beneficiary.firstName} {item.beneficiary.lastName}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.category.name}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getCaseStatusClassName(item.status)}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{formatDate(item.dateOpened)}</td>
                    <td className="py-3 pr-4">
                      <Link href="/admin/cases" className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
            <h3 className="text-xl font-semibold text-slate-900">Quick Actions</h3>
            <div className="mt-4 space-y-2">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
            <h3 className="text-xl font-semibold text-slate-900">Recent Activity</h3>

            {recentActivity.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <span className="mt-1.5 inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{activity.action}</p>
                      <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        {activity.user?.name ?? "System"} • {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">This month</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{thisMonthBeneficiaries}</p>
          <p className="mt-2 text-sm text-slate-600">New beneficiary records</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cases in review</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{activeCases}</p>
          <p className="mt-2 text-sm text-slate-600">Currently active workflows</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Categories</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{categories.length}</p>
          <p className="mt-2 text-sm text-slate-600">Configured MSWD service groups</p>
        </div>
      </div>
    </div>
  );
}
