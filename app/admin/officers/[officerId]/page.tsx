import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, FolderTree, UserRound, Users } from "lucide-react";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";
import { assignOfficerCategoriesAction } from "@/app/actions/auth";
import { formatDate, getCaseStatusClassName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OfficerManagePage({
  params,
}: {
  params: Promise<{ officerId: string }>;
}) {
  const { officerId } = await params;

  const officer = await db.user.findUnique({
    where: { id: officerId },
    include: {
      role: true,
      userCategories: { include: { category: true }, orderBy: { category: { name: "asc" } } },
    },
  });

  if (!officer || officer.role.name !== "OFFICER") {
    notFound();
  }

  const [categories, beneficiaryCount, activeCaseCount, totalCaseCount, recentCases] =
    await Promise.all([
      db.category.findMany({ orderBy: { name: "asc" } }),
      db.beneficiary.count({ where: { assignedOfficerId: officer.id } }),
      db.case.count({
        where: {
          assignedOfficerId: officer.id,
          status: { in: ["ACTIVE", "UNDER_ASSESSMENT", "FOR_FOLLOW_UP", "FOR_REFERRAL"] },
        },
      }),
      db.case.count({ where: { assignedOfficerId: officer.id } }),
      db.case.findMany({
        where: { assignedOfficerId: officer.id },
        include: { beneficiary: true, category: true },
        orderBy: { dateOpened: "desc" },
        take: 5,
      }),
    ]);

  const assignedCategoryIds = new Set(officer.userCategories.map((item) => item.categoryId));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/officers"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to officers
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{officer.name}</h1>
        <p className="mt-2 text-slate-600">
          Assign the categories this officer can access and manage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Assigned beneficiaries"
          value={String(beneficiaryCount)}
          hint="Beneficiary caseload"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Active cases"
          value={String(activeCaseCount)}
          hint="Ongoing casework"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <MetricCard
          label="Total cases"
          value={String(totalCaseCount)}
          hint="All assigned cases"
          icon={<UserRound className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <FolderTree className="h-5 w-5 text-sky-700" />
            <h2 className="text-xl font-semibold text-slate-900">Assigned categories</h2>
          </div>
          <form action={assignOfficerCategoriesAction} className="space-y-4">
            <input type="hidden" name="officerId" value={officer.id} />
            <fieldset className="space-y-2">
              <legend className="mb-2 block text-sm font-medium text-slate-700">
                Select the categories this officer may access
              </legend>
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-sky-300 hover:bg-sky-50"
                >
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={category.id}
                    defaultChecked={assignedCategoryIds.has(category.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-800">{category.name}</span>
                    {category.description ? (
                      <span className="mt-0.5 block text-xs text-slate-500">{category.description}</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </fieldset>
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800"
            >
              Save assignments
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Category dashboards
              </h2>
            </div>
            {officer.userCategories.length > 0 ? (
              <ul className="divide-y divide-slate-200">
                {officer.userCategories.map((assignment) => (
                  <li key={assignment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-sm font-medium text-slate-800">{assignment.category.name}</span>
                    <Link
                      href={`/admin/categories/${assignment.categoryId}`}
                      className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                    >
                      Open dashboard
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-slate-500">
                No categories assigned yet. The officer cannot open any category dashboard.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Recent assigned cases
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Case number</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date opened</th>
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
                        <td className="px-4 py-3 text-slate-600">{item.category.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getCaseStatusClassName(item.status)}`}>
                            {item.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(item.dateOpened)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-slate-500">
                        No cases assigned to this officer yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
