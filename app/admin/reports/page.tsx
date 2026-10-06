import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [beneficiaries, cases, officers, categories] = await Promise.all([
    db.beneficiary.count(),
    db.case.count(),
    db.user.count({ where: { role: { name: "OFFICER" } } }),
    db.category.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
        <p className="mt-2 text-slate-600">System-wide reporting snapshot.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-sky-50 p-5">
          <p className="text-sm text-sky-700">Beneficiaries</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{beneficiaries}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-5">
          <p className="text-sm text-amber-700">Cases</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{cases}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">Officers</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{officers}</p>
        </div>
        <div className="rounded-2xl bg-violet-50 p-5">
          <p className="text-sm text-violet-700">Categories</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{categories}</p>
        </div>
      </div>
    </div>
  );
}
