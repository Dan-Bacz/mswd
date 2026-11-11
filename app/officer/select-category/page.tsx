import Image from "next/image";
import { ArrowRight, CheckCircle2, FolderTree, LogOut, ShieldCheck, Sparkles } from "lucide-react";
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
    <main className="relative min-h-screen overflow-hidden bg-[#F5F8FC] px-4 py-8 text-[#071C3A] sm:px-8 lg:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><Image src="/images/logo.png" alt="" fill priority className="object-contain opacity-[0.045]" /><span className="absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-[#0B68C5]/10 blur-3xl" /><span className="absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#C9A93F]/10 blur-3xl" /></div>
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 rounded-2xl border border-[#16345A] bg-[#071C3A] px-4 py-4 shadow-[0_18px_40px_-26px_rgba(7,28,58,0.7)] sm:px-5">
          <div className="flex items-center gap-3 sm:gap-4"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white p-1 shadow-lg sm:h-14 sm:w-14"><Image src="/images/logo.png" alt="MSWD logo" width={400} height={400} className="h-full w-full object-contain" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 sm:text-xs">MSWD Management Information System</p><p className="mt-1 text-xs text-blue-100/75">Municipal Social Welfare and Development Office · Mahayag</p></div></div>
          <form action={logoutAction}><button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20"><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span></button></form>
        </header>

        <section className="mx-auto w-full max-w-4xl flex-1 py-12 sm:py-16">
          <div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-[#C9A93F]/40 bg-[#FFF8DF] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#806516]"><Sparkles className="h-3.5 w-3.5" /> Secure workspace selection</span><h1 className="mt-5 text-4xl font-black tracking-tight text-[#071C3A] sm:text-5xl">Select a category workspace</h1><p className="mt-4 max-w-xl text-base leading-relaxed text-[#6480A9] sm:text-lg">Choose the MSWD category dashboard you want to work with for this login session.</p></div>

          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-[#DCE7F5] bg-white px-4 py-3 text-sm text-[#405B80] shadow-[0_12px_28px_-22px_rgba(9,44,92,0.45)]"><ShieldCheck className="h-5 w-5 shrink-0 text-[#A88724]" /><span>Your access is limited to the categories assigned to your officer account. Sign out and log in again to switch workspaces.</span></div>

          <section className="mt-8" aria-label="Assigned category dashboards"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B4599]">Available workspaces</p><h2 className="mt-1 text-xl font-bold text-[#071C3A]">Assigned categories</h2></div><span className="rounded-full bg-[#071C3A] px-3 py-1 text-xs font-semibold text-white">{categories.length} {categories.length === 1 ? "category" : "categories"}</span></div>
            {categories.length ? <div className="grid gap-4 sm:grid-cols-2">{categories.map((category, index) => <form key={category.id} action={selectOfficerCategoryAction}><input type="hidden" name="categoryId" value={category.id} /><button type="submit" className="group relative flex min-h-36 w-full items-start gap-4 overflow-hidden rounded-2xl border border-[#DCE7F5] bg-white p-5 text-left shadow-[0_18px_45px_-28px_rgba(7,28,58,0.65)] transition duration-200 hover:-translate-y-1 hover:border-[#0B68C5] hover:shadow-[0_24px_48px_-26px_rgba(7,28,58,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/35"><span className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#0B68C5]/10 blur-2xl" /><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#071C3A] text-[#F2D36B] shadow-lg"><FolderTree className="h-5 w-5" /></span><span className="relative min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A88724]">Program {String(index + 1).padStart(2, "0")}</span><CheckCircle2 className="h-4 w-4 text-emerald-600" /></span><span className="mt-2 block text-lg font-bold text-[#071C3A]">{category.name}</span><span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-[#6480A9]">{category.description || "Open your assigned category dashboard."}</span></span><ArrowRight className="relative mt-1 h-5 w-5 shrink-0 text-[#0B4599] transition group-hover:translate-x-1 group-hover:text-[#A88724]" /></button></form>)}</div> : <div className="rounded-2xl border border-dashed border-[#B8C9DF] bg-white p-8 text-center"><FolderTree className="mx-auto h-8 w-8 text-[#0B4599]" /><h2 className="mt-3 font-bold text-[#071C3A]">No categories assigned yet</h2><p className="mt-1 text-sm text-[#6480A9]">Please contact the MSWD administrator to assign a program category to your account.</p></div>}
          </section>
        </section>

        <footer className="border-t border-[#DCE7F5] pt-5 text-center text-[10px] uppercase tracking-[0.16em] text-[#6480A9]">Mahayag · Zamboanga del Sur · Sa Tamang Serbisyo, Mas Matatag na Komunidad.</footer>
      </div>
    </main>
  );
}
