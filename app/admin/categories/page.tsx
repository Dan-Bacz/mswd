import Link from "next/link";
import { db } from "@/lib/db";
import { DeleteCategoryForm } from "@/components/admin/delete-category-form";
import { CreateCategoryDialog } from "@/components/admin/create-category-dialog";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
        <p className="mt-2 text-slate-600">Database-driven MSWD categories.</p>
      </div>

      <div className="flex justify-end">
        <CreateCategoryDialog />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{category.name}</td>
                    <td className="px-4 py-3 text-slate-600">{category.description ?? "—"}</td>
                    <td className="space-y-2 px-4 py-3">
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                      >
                        Open dashboard
                      </Link>
                      <DeleteCategoryForm categoryId={category.id} categoryName={category.name} />
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
