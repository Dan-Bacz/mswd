import Link from "next/link";
import { db } from "@/lib/db";
import { CreateOfficerDialog } from "@/components/admin/create-officer-dialog";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Officer management</h1>
          <p className="mt-2 text-slate-600">Assign authorized categories to officers.</p>
        </div>
        <CreateOfficerDialog categories={categories} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Employee ID / position</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Authorized categories</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {officers.map((officer) => (
                <tr key={officer.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{officer.name}</td>
                  <td className="px-4 py-3 text-slate-600">{officer.email}</td>
                  <td className="px-4 py-3 text-slate-600">{officer.employeeId ?? "—"}<br /><span className="text-xs">{officer.position ?? "—"}</span></td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        officer.status === "PENDING_APPROVAL"
                          ? "bg-amber-100 text-amber-800"
                          : officer.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {officer.status === "PENDING_APPROVAL"
                        ? "Pending approval"
                        : officer.status === "ACTIVE"
                          ? "Active"
                          : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {officer.userCategories.map((assignment) => assignment.category.name).join(", ") || "None"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/officers/${officer.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
