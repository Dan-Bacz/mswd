import { db } from "@/lib/db";
import { createOfficerAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function OfficersPage() {
  const officers = await db.user.findMany({
    where: { role: { name: "OFFICER" } },
    include: { userCategories: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Officer management</h1>
        <p className="mt-2 text-slate-600">Assign authorized categories to officers.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Create officer</h2>
          <form action={createOfficerAction} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
              <input name="name" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input name="password" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Assigned categories</label>
              <select name="categoryIds" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800">
              Save officer
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Authorized categories</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {officers.map((officer) => (
                  <tr key={officer.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{officer.name}</td>
                    <td className="px-4 py-3 text-slate-600">{officer.email}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {officer.userCategories.map((assignment) => assignment.category.name).join(", ") || "None"}
                    </td>
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
