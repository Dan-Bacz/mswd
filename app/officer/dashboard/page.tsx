import Link from "next/link";
import { ArrowRight, BarChart3, FolderTree, Sparkles, Users, WalletCards } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage() {
  const user = await requireRole("OFFICER");

  const categories = await db.category.findMany({
    where: { id: { in: user.categoryIds } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { beneficiaries: true } },
    },
  });

  const assistanceCounts = await Promise.all(
    categories.map((category) =>
      db.beneficiaryAssistance.count({
        where: { beneficiary: { categoryId: category.id } },
      }),
    ),
  );

  const totals = categories.reduce(
    (acc, category, index) => ({
      beneficiaries: acc.beneficiaries + category._count.beneficiaries,
      assistance: acc.assistance + assistanceCounts[index],
    }),
    { beneficiaries: 0, assistance: 0 },
  );

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-[28px] border border-[#1b4d88] bg-[linear-gradient(135deg,#061a38_0%,#0b4599_58%,#0b68c5_100%)] px-6 py-7 text-white shadow-[0_28px_70px_-28px_rgba(7,28,58,0.65)] sm:px-8 sm:py-9">
        <span className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#ffd21f]/20 blur-3xl" />
        <span className="pointer-events-none absolute bottom-[-70px] left-1/3 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ffd21f]">
              <Sparkles className="h-4 w-4" /> Officer workspace
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">My Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100">
              Welcome back, {user.name}. Open one of your assigned program categories to manage beneficiaries, record assistance, and print reports.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100"><Users className="h-3.5 w-3.5 text-[#ffd21f]" /> Beneficiaries</p>
              <p className="mt-1 text-xl font-black text-white">{totals.beneficiaries.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100"><WalletCards className="h-3.5 w-3.5 text-[#ffd21f]" /> Assistance</p>
              <p className="mt-1 text-xl font-black text-white">{totals.assistance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <section aria-label="Assigned categories">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0B1A3E]">Assigned categories</h2>
            <p className="mt-1 text-sm text-[#6480A9]">Select a category to open its dashboard.</p>
          </div>
          <span className="rounded-full bg-[#eef6ff] px-3 py-1.5 text-xs font-bold text-[#0b4599]">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </span>
        </div>

        {categories.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/officer/categories/${category.id}`}
                className="group relative flex min-h-44 flex-col overflow-hidden rounded-2xl border border-[#DCE7F5] bg-white p-5 shadow-[0_18px_45px_-28px_rgba(7,28,58,0.65)] transition duration-200 hover:-translate-y-1 hover:border-[#0B68C5] hover:shadow-[0_24px_48px_-26px_rgba(7,28,58,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/35"
              >
                <span className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#0B68C5]/10 blur-2xl transition group-hover:bg-[#0B68C5]/20" />
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#071C3A] text-[#F2D36B] shadow-lg">
                    <FolderTree className="h-5 w-5" />
                  </span>
                  <ArrowRight className="h-5 w-5 text-[#0B4599] transition group-hover:translate-x-1 group-hover:text-[#A88724]" />
                </div>
                <div className="relative mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A88724]">Program {String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 text-lg font-bold text-[#071C3A]">{category.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#6480A9]">
                    {category.description || "Open your assigned category dashboard."}
                  </p>
                </div>
                <div className="relative mt-auto flex items-center gap-4 pt-4 text-xs font-semibold text-[#405B80]">
                  <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[#0B68C5]" />{category._count.beneficiaries} beneficiaries</span>
                  <span className="inline-flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-[#0B68C5]" />{assistanceCounts[index].toLocaleString()} assistance</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#B8C9DF] bg-white p-8 text-center">
            <FolderTree className="mx-auto h-8 w-8 text-[#0B4599]" />
            <h3 className="mt-3 font-bold text-[#071C3A]">No categories assigned yet</h3>
            <p className="mt-1 text-sm text-[#6480A9]">Please contact the MSWD administrator to assign a program category to your account.</p>
          </div>
        )}
      </section>
    </div>
  );
}
