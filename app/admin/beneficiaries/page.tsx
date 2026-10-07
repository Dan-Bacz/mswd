import { createBeneficiaryAction } from "@/app/actions/mswd";
import { db } from "@/lib/db";
import { shouldShowBeneficiaryCategory } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BeneficiariesPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }> | { category?: string };
}) {
  const params = await Promise.resolve(searchParams ?? {});
  const selectedCategory = typeof params.category === "string" ? params.category : undefined;

  const [beneficiaries, categories, officers] = await Promise.all([
    db.beneficiary.findMany({
      where: selectedCategory ? { category: { name: selectedCategory } } : undefined,
      include: { category: true, assignedOfficer: true },
      orderBy: { registrationDate: "desc" },
      take: 25,
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: { name: "OFFICER" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, userCategories: { select: { categoryId: true } } },
    }),
  ]);
  const availableCategories = categories.filter((category) => shouldShowBeneficiaryCategory(category.name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Beneficiaries</h1>
        <p className="mt-2 text-slate-600">Active beneficiary registry and intake workflow.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Add beneficiary</h2>
          <form action={createBeneficiaryAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">First name</label>
                <input name="firstName" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
                <input name="lastName" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Middle name</label>
                <input name="middleName" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Suffix</label>
                <input name="suffix" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Sex</label>
                <select name="sex" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Date of birth</label>
                <input name="dateOfBirth" type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select name="categoryId" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Civil status</label>
                <select name="civilStatus" className="w-full rounded-xl border border-slate-300 px-3 py-2.5">
                  <option value="">Select</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="SEPARATED">Separated</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Contact number</label>
                <input name="contactNumber" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input name="email" type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
              <input name="address" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Barangay</label>
                <input name="barangay" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Municipality</label>
                <input name="municipality" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Province</label>
                <input name="province" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                <label className="mb-2 block text-sm font-medium text-slate-700">Subcategory</label>
                <input name="subcategory" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Remarks</label>
              <textarea name="remarks" rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </div>

            <button type="submit" className="w-full rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800">
              Save beneficiary
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Barangay</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Officer</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {beneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {beneficiary.firstName} {beneficiary.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{beneficiary.category.name}</td>
                    <td className="px-4 py-3 text-slate-600">{beneficiary.barangay ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{beneficiary.assignedOfficer?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-slate-600">{beneficiary.status}</td>
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
