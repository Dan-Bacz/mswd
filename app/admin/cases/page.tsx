import { createCaseAction } from "@/app/actions/mswd";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const [cases, beneficiaries, categories, officers] = await Promise.all([
    db.case.findMany({
      include: { beneficiary: true, category: true, assignedOfficer: true },
      orderBy: { dateOpened: "desc" },
      take: 25,
    }),
    db.beneficiary.findMany({
      orderBy: { firstName: "asc" },
      include: { category: true },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: { name: "OFFICER" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, userCategories: { select: { categoryId: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Case records</h1>
        <p className="mt-2 text-slate-600">Case intake, assignment, and status tracking.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Open case</h2>
          <form action={createCaseAction} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Beneficiary</label>
              <select name="beneficiaryId" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required>
                <option value="">Select beneficiary</option>
                {beneficiaries.map((beneficiary) => (
                  <option key={beneficiary.id} value={beneficiary.id}>{beneficiary.firstName} {beneficiary.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <select name="categoryId" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Case type</label>
                <input name="caseType" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
                <select name="priority" className="w-full rounded-xl border border-slate-300 px-3 py-2.5">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM" selected>Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Assigned officer</label>
              <select name="assignedOfficerId" className="w-full rounded-xl border border-slate-300 px-3 py-2.5">
                <option value="">Unassigned</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>{officer.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
              <textarea name="description" rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Remarks</label>
              <textarea name="remarks" rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </div>

            <button type="submit" className="w-full rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800">
              Save case
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Case</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cases.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.caseNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{item.beneficiary.firstName} {item.beneficiary.lastName}</td>
                    <td className="px-4 py-3 text-slate-600">{item.category.name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
