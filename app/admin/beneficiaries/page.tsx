import Link from "next/link";
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
  const requestedCategory = typeof params.category === "string" ? params.category : undefined;

  const [categories, officers] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: { name: "OFFICER" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, userCategories: { select: { categoryId: true } } },
    }),
  ]);
  const availableCategories = categories.filter((category) => shouldShowBeneficiaryCategory(category.name));
  const selectedCategory = availableCategories.find((category) => category.name === requestedCategory);
  const beneficiaries = await db.beneficiary.findMany({
    where: selectedCategory ? { categoryId: selectedCategory.id } : undefined,
    include: { category: true, assignedOfficer: true },
    orderBy: { registrationDate: "desc" },
  });
  const visibleCategories = selectedCategory ? [selectedCategory] : categories;
  const renderBeneficiaryTable = (records: typeof beneficiaries) => (
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
          {records.map((beneficiary) => (
            <tr key={beneficiary.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{beneficiary.firstName} {beneficiary.lastName}</td>
              <td className="px-4 py-3 text-slate-600">{beneficiary.category.name}</td>
              <td className="px-4 py-3 text-slate-600">{beneficiary.barangay ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">{beneficiary.assignedOfficer?.name ?? "Unassigned"}</td>
              <td className="px-4 py-3 text-slate-600">{beneficiary.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {records.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-slate-500">No beneficiaries in this category yet.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Beneficiaries</h1>
        <p className="mt-2 text-slate-600">Active beneficiary registry and intake workflow.</p>
      </div>

      <nav aria-label="Filter beneficiaries by category" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Browse by category</h2>
          <span className="text-xs text-slate-500">{beneficiaries.length} records</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/beneficiaries"
            aria-current={!selectedCategory ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${!selectedCategory ? "border-sky-700 bg-sky-700 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:text-sky-700"}`}
          >
            All beneficiaries
          </Link>
          {availableCategories.map((category) => (
            <Link
              key={category.id}
              href={`/admin/beneficiaries?category=${encodeURIComponent(category.name)}`}
              aria-current={selectedCategory?.id === category.id ? "page" : undefined}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedCategory?.id === category.id ? "border-sky-700 bg-sky-700 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:text-sky-700"}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>

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

        <div className="space-y-4">
          {visibleCategories
            .map((category) => ({
              category,
              records: beneficiaries.filter((beneficiary) => beneficiary.categoryId === category.id),
            }))
            .filter(({ records }) => selectedCategory || records.length > 0)
            .map(({ category, records }) => (
              <section key={category.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <h2 className="font-semibold text-slate-900">{category.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {records.length} beneficiaries
                  </span>
                </div>
                {renderBeneficiaryTable(records)}
              </section>
            ))}
          {visibleCategories.length === 0 || (!selectedCategory && beneficiaries.length === 0) ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No beneficiaries have been registered yet.
            </div>
          ) : null}
          </div>
      </div>
    </div>
  );
}
