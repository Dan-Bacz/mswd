import { ArrowRight, FolderTree } from "lucide-react";
import { logoutAction, selectOfficerCategoryAction } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerSelectCategoryPage() {
  const user = await requireRole("OFFICER");
  const categories = await db.category.findMany({
    where: { userCategories: { some: { userId: user.id } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B4599]">Officer workspace</p>
        <h1 className="mt-2 text-3xl font-bold text-[#12335F]">Choose a category dashboard</h1>
        <p className="mt-2 text-sm text-[#6480A9]">Select the one MSWD program you want to open for this login session. Sign out and sign in again to choose another assigned category.</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="rounded-lg border border-[#D9E5F5] bg-white px-3 py-2 text-sm font-semibold text-[#405B80] shadow-sm hover:bg-[#F8FAFE]">Sign out</button>
        </form>
      </div>
      <section className="space-y-3" aria-label="Assigned category dashboards">
        {categories.map((category) => (
          <form key={category.id} action={selectOfficerCategoryAction}>
            <input type="hidden" name="categoryId" value={category.id} />
            <button type="submit" className="group flex w-full items-center gap-4 rounded-2xl border border-[#D9E5F5] border-l-4 border-l-[#0645AD] bg-white p-5 text-left shadow-[0_2px_10px_rgba(6,59,145,0.04)] transition hover:bg-[#F8FAFE] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645AD]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#0645AD]"><FolderTree className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-base font-bold text-[#173B70]">{category.name}</span><span className="mt-1 block text-sm text-[#6480A9]">{category.description || "Open your assigned category dashboard."}</span></span>
            <ArrowRight className="h-5 w-5 shrink-0 text-[#8CA2BF] transition group-hover:translate-x-1 group-hover:text-[#0645AD]" />
            </button>
          </form>
        ))}
        {categories.length === 0 && <p className="rounded-xl border border-dashed border-[#D9E5F5] bg-white p-6 text-sm text-[#6480A9]">No categories are assigned to your account yet.</p>}
      </section>
    </div>
  );
}
