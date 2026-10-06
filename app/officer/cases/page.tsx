import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerCasesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const cases = await db.case.findMany({
    where: { assignedOfficerId: user.id },
    include: { beneficiary: true, category: true },
    orderBy: { dateOpened: "desc" },
    take: 25,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My cases</h1>
        <p className="mt-2 text-slate-600">Authorized case tracking and follow-up workflow.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Case number</th>
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
  );
}
