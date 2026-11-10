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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#061d42_0%,#073783_48%,#0B4599_100%)] px-4 py-8 text-white sm:px-8 lg:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><span className="absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-[#2b80d8]/20 blur-3xl" /><span className="absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#FFD21F]/10 blur-3xl" /><span className="absolute right-[18%] top-0 h-full w-20 -skew-x-[28deg] bg-white/[0.04]" /></div>
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-white/15 pb-5">
          <div className="flex items-center gap-3 sm:gap-4"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white p-1 shadow-lg sm:h-14 sm:w-14"><Image src="/images/logo.png" alt="MSWD logo" width={400} height={400} className="h-full w-full object-contain" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 sm:text-xs">MSWD Management Information System</p><p className="mt-1 text-xs text-blue-100/75">Municipal Social Welfare and Development Office · Mahayag</p></div></div>
          <form action={logoutAction}><button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20"><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span></button></form>
        </header>

        <section className="mx-auto w-full max-w-4xl flex-1 py-12 sm:py-16">
          <div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-[#FFD21F]/30 bg-[#FFD21F]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#FFE98A]"><Sparkles className="h-3.5 w-3.5" /> Secure workspace selection</span><h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Good day, {user.name.split(" ")[0]}.</h1><p className="mt-4 max-w-xl text-base leading-relaxed text-blue-100 sm:text-lg">Choose the MSWD category dashboard you want to work with for this login session.</p></div>

          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/15 bg-black/10 px-4 py-3 text-sm text-blue-100 backdrop-blur-sm"><ShieldCheck className="h-5 w-5 shrink-0 text-[#FFD21F]" /><span>Your access is limited to the categories assigned to your officer account. Sign out and log in again to switch workspaces.</span></div>

          <section className="mt-8" aria-label="Assigned category dashboards"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Available workspaces</p><h2 className="mt-1 text-xl font-bold">Assigned categories</h2></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">{categories.length} {categories.length === 1 ? "category" : "categories"}</span></div>
            {categories.length ? <div className="grid gap-4 sm:grid-cols-2">{categories.map((category, index) => <form key={category.id} action={selectOfficerCategoryAction}><input type="hidden" name="categoryId" value={category.id} /><button type="submit" className="group relative flex min-h-36 w-full items-start gap-4 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.1] p-5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.15)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-[#FFD21F]/60 hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD21F]/35"><span className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#FFD21F]/10 blur-2xl" /><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0B4599] shadow-lg"><FolderTree className="h-5 w-5" /></span><span className="relative min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FFE98A]">Program {String(index + 1).padStart(2, "0")}</span><CheckCircle2 className="h-4 w-4 text-emerald-300" /></span><span className="mt-2 block text-lg font-bold text-white">{category.name}</span><span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-blue-100/75">{category.description || "Open your assigned category dashboard."}</span></span><ArrowRight className="relative mt-1 h-5 w-5 shrink-0 text-blue-200 transition group-hover:translate-x-1 group-hover:text-[#FFD21F]" /></button></form>)}</div> : <div className="rounded-2xl border border-dashed border-white/25 bg-white/[0.06] p-8 text-center"><FolderTree className="mx-auto h-8 w-8 text-blue-200" /><h2 className="mt-3 font-bold">No categories assigned yet</h2><p className="mt-1 text-sm text-blue-100/75">Please contact the MSWD administrator to assign a program category to your account.</p></div>}
          </section>
        </section>

        <footer className="border-t border-white/15 pt-5 text-center text-[10px] uppercase tracking-[0.16em] text-blue-200/70">Mahayag · Zamboanga del Sur · Sa Tamang Serbisyo, Mas Matatag na Komunidad.</footer>
      </div>
    </main>
  );
}
