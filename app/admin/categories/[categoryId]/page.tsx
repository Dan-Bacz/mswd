import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, HandHeart, ShieldCheck, UserRound, Users } from "lucide-react";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";
import { setCategoryOfficersAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

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

  const [beneficiaryCount, assistanceCount, officers, assignedOfficers, beneficiaries] = await Promise.all([
    db.beneficiary.count({ where: { categoryId } }),
    db.beneficiaryAssistance.count({ where: { beneficiary: { categoryId } } }),
    db.user.findMany({
      where: { role: { name: "OFFICER" }, status: { not: "PENDING_APPROVAL" } },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { role: { name: "OFFICER" }, userCategories: { some: { categoryId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    db.beneficiary.findMany({
      where: { categoryId },
      include: { assignedOfficer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const assignedOfficerIds = new Set(assignedOfficers.map((officer) => officer.id));

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
          {category.description ?? "Manage beneficiaries, assistance, and officers for this category."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Beneficiaries"
          value={String(beneficiaryCount)}
          hint="Registered in this category"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Assistance records"
          value={String(assistanceCount)}
          hint="Provided in this category"
          icon={<HandHeart className="h-5 w-5" />}
        />
        <MetricCard
          label="Assigned officers"
          value={String(assignedOfficers.length)}
          hint="Authorized for this category"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  No approved officers are available for assignment.
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
          {assignedOfficers.length > 0 && (
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
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Recent beneficiaries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary no.</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Barangay</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {beneficiaries.length ? beneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{beneficiary.beneficiaryNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{beneficiary.firstName} {beneficiary.lastName}</td>
                    <td className="px-4 py-3 text-slate-600">{beneficiary.barangay ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{beneficiary.assignedOfficer?.name ?? "Unassigned"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">No beneficiaries in this category yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
