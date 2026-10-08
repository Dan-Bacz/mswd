import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";
import { setCategoryOfficersAction } from "@/app/actions/auth";
import { updateCaseStatusAction } from "@/app/actions/mswd";
import { formatDate, getCaseStatusClassName } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CASE_STATUSES = [
  "NEW",
  "PENDING",
  "UNDER_ASSESSMENT",
  "ACTIVE",
  "FOR_REFERRAL",
  "FOR_FOLLOW_UP",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const;

export default async function AdminCategoryDashboardPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  const category = await db.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    notFound();
  }

  const [
    beneficiaryCount,
    activeCaseCount,
    pendingCaseCount,
    totalCaseCount,
    statusCounts,
    officers,
    assignedOfficers,
    recentCases,
  ] = await Promise.all([
    db.beneficiary.count({ where: { categoryId } }),
    db.case.count({
      where: {
        categoryId,
        status: { in: ["ACTIVE", "UNDER_ASSESSMENT", "FOR_FOLLOW_UP", "FOR_REFERRAL"] },
      },
    }),
    db.case.count({ where: { categoryId, status: "PENDING" } }),
    db.case.count({ where: { categoryId } }),
    db.case.groupBy({ by: ["status"], where: { categoryId }, _count: { _all: true } }),
    db.user.findMany({
      where: { role: { name: "OFFICER" } },
      include: { userCategories: { select: { categoryId: true } } },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { role: { name: "OFFICER" }, userCategories: { some: { categoryId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    db.case.findMany({
      where: { categoryId },
      include: { beneficiary: true, assignedOfficer: true },
      orderBy: { dateOpened: "desc" },
      take: 10,
    }),
  ]);

  const assignedOfficerIds = new Set(assignedOfficers.map((officer) => officer.id));
  const maxStatusCount = Math.max(1, ...statusCounts.map((entry) => entry._count._all));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/categories"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to categories
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{category.name}</h1>
        <p className="mt-2 text-slate-600">
          {category.description ?? "Category dashboard for cases, beneficiaries, and assigned officers."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Beneficiaries"
          value={String(beneficiaryCount)}
          hint="Registered in this category"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Active cases"
          value={String(activeCaseCount)}
          hint="Open and active workstreams"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />
        <MetricCard
          label="Pending cases"
          value={String(pendingCaseCount)}
          hint="Awaiting action"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <MetricCard
          label="Assigned officers"
          value={String(assignedOfficers.length)}
          hint="Personnel managing this category"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <UserRound className="h-5 w-5 text-sky-700" />
            <h2 className="text-xl font-semibold text-slate-900">Assigned officers</h2>
          </div>
          <form action={setCategoryOfficersAction} className="space-y-4">
            <input type="hidden" name="categoryId" value={category.id} />
            <fieldset className="space-y-2">
              <legend className="mb-2 block text-sm font-medium text-slate-700">
                Choose the officers who manage this category
              </legend>
              {officers.length > 0 ? (
                officers.map((officer) => (
                  <label
                    key={officer.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <input
                      type="checkbox"
                      name="officerIds"
                      value={officer.id}
                      defaultChecked={assignedOfficerIds.has(officer.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-800">{officer.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{officer.email}</span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                  No officers created yet.
                </p>
              )}
            </fieldset>
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800"
            >
              Save officer assignments
            </button>
          </form>

          {assignedOfficers.length > 0 ? (
            <ul className="mt-5 space-y-2 border-t border-slate-200 pt-4">
              {assignedOfficers.map((officer) => (
                <li key={officer.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700">{officer.name}</span>
                  <Link
                    href={`/admin/officers/${officer.id}`}
                    className="text-xs font-medium text-sky-700 hover:text-sky-800"
                  >
                    Manage
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-sky-700" />
                <h2 className="text-xl font-semibold text-slate-900">Case status breakdown</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {totalCaseCount} cases
              </span>
            </div>

            {statusCounts.length > 0 ? (
              <div className="space-y-3">
                {statusCounts
                  .slice()
                  .sort((a, b) => b._count._all - a._count._all)
                  .map((entry) => (
                    <div key={entry.status} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getCaseStatusClassName(entry.status)}`}>
                          {entry.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{entry._count._all}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-sky-600"
                          style={{ width: `${(entry._count._all / maxStatusCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No cases recorded for this category yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Recent cases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Case number</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Officer</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date opened</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Update status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentCases.length > 0 ? (
                recentCases.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.caseNumber}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.beneficiary.firstName} {item.beneficiary.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.assignedOfficer?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-slate-600">{item.priority}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getCaseStatusClassName(item.status)}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(item.dateOpened)}</td>
                    <td className="px-4 py-3">
                      <form action={updateCaseStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="caseId" value={item.id} />
                        <select
                          name="status"
                          defaultValue={item.status}
                          className="rounded-xl border border-slate-300 px-2 py-1.5 text-xs"
                        >
                          {CASE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-xl bg-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-sm text-slate-500">
                    No cases recorded for this category yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
