import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  ClipboardList,
  UserRound,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";
import { getCurrentUser } from "@/lib/auth/permissions";
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

export default async function OfficerCategoryDashboardPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const category = await db.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    notFound();
  }

  if (user.role !== "ADMIN" && !user.categoryIds.includes(categoryId)) {
    redirect("/officer/dashboard");
  }

  const [myCases, activeCases, pendingCases, myBeneficiaries] = await Promise.all([
    db.case.count({ where: { categoryId, assignedOfficerId: user.id } }),
    db.case.count({
      where: {
        categoryId,
        assignedOfficerId: user.id,
        status: { in: ["ACTIVE", "UNDER_ASSESSMENT", "FOR_FOLLOW_UP", "FOR_REFERRAL"] },
      },
    }),
    db.case.count({ where: { categoryId, assignedOfficerId: user.id, status: "PENDING" } }),
    db.beneficiary.count({ where: { categoryId, assignedOfficerId: user.id } }),
  ]);

  const [tasks, beneficiaries] = await Promise.all([
    db.case.findMany({
      where: { categoryId, assignedOfficerId: user.id },
      include: { beneficiary: true, interventions: { include: { serviceType: true } } },
      orderBy: { dateOpened: "desc" },
      take: 25,
    }),
    db.beneficiary.findMany({
      where: { categoryId, assignedOfficerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/officer/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Category dashboard</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{category.name}</h1>
        <p className="mt-2 text-slate-600">
          Your assigned tasks and caseload for this category.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="My tasks"
          value={String(myCases)}
          hint="Cases assigned to you here"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <MetricCard
          label="Active tasks"
          value={String(activeCases)}
          hint="Ongoing casework"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <MetricCard
          label="Pending tasks"
          value={String(pendingCases)}
          hint="Needs attention"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <MetricCard
          label="My beneficiaries"
          value={String(myBeneficiaries)}
          hint="Beneficiary caseload"
          icon={<UserRound className="h-5 w-5" />}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">My tasks</h2>
          <Link href="/officer/cases" className="text-xs font-medium text-sky-700 hover:text-sky-800">
            View all cases
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Case number</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Case type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date opened</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{task.caseNumber}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.beneficiary.firstName} {task.beneficiary.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{task.caseType}</td>
                    <td className="px-4 py-3 text-slate-600">{task.priority}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(task.dateOpened)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getCaseStatusClassName(task.status)}`}>
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updateCaseStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="caseId" value={task.id} />
                        <select
                          name="status"
                          defaultValue={task.status}
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
                    No tasks assigned to you in this category yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            My beneficiaries in this category
          </h2>
          <Link href="/officer/beneficiaries" className="text-xs font-medium text-sky-700 hover:text-sky-800">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary no.</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Sex</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Barangay</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {beneficiaries.length > 0 ? (
                beneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{beneficiary.beneficiaryNumber}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        {beneficiary.firstName} {beneficiary.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{beneficiary.sex}</td>
                    <td className="px-4 py-3 text-slate-600">{beneficiary.barangay ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(beneficiary.registrationDate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm text-slate-500">
                    No beneficiaries assigned to you in this category yet.
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
