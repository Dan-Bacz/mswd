import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronRight, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { BeneficiaryRegistry } from "@/components/admin/beneficiary-registry";
import { OfficerDashboardAnalytics, type OfficerDashboardTrend } from "@/components/officer/officer-dashboard-analytics";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerCategoryDashboardPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const { user, categoryId: selectedCategoryId } = await requireSelectedOfficerCategory();
  if (categoryId !== selectedCategoryId) redirect(`/officer/categories/${selectedCategoryId}`);

  const category = await db.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    notFound();
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const trendStart = new Date(todayStart);
  trendStart.setDate(trendStart.getDate() - 6);
  const scope = { categoryId, assignedOfficerId: user.id };
  const assistanceScope = { beneficiary: scope };
  const [beneficiaryCount, assistanceCount, beneficiaries, assistance, recentAssistance, recentBeneficiaries] = await Promise.all([
    db.beneficiary.count({ where: scope }),
    db.beneficiaryAssistance.count({ where: assistanceScope }),
    db.beneficiary.findMany({ where: scope, orderBy: { createdAt: "desc" } }),
    db.beneficiaryAssistance.findMany({ where: assistanceScope, select: { id: true, type: true, outcome: true, visitDate: true, financialAmount: true, beneficiary: { select: { firstName: true, lastName: true } } } }),
    db.beneficiaryAssistance.findMany({ where: { ...assistanceScope, visitDate: { gte: trendStart } }, select: { type: true, visitDate: true } }),
    db.beneficiary.findMany({ where: { ...scope, registrationDate: { gte: trendStart } }, select: { registrationDate: true } }),
  ]);

  const trend: OfficerDashboardTrend[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(trendStart);
    date.setDate(trendStart.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      label: date.toLocaleDateString("en-PH", { weekday: "short" }),
      beneficiaries: recentBeneficiaries.filter((item) => item.registrationDate.toISOString().slice(0, 10) === key).length,
      assistance: recentAssistance.filter((item) => item.visitDate.toISOString().slice(0, 10) === key).length,
    };
  });
  const typeLabels: Record<string, string> = { MEDICAL_ASSISTANCE: "Medical", FINANCIAL_ASSISTANCE: "Financial", FOOD_ASSISTANCE: "Food", MATERIAL_ASSISTANCE: "Material", OTHER: "Other" };
  const assistanceTypes = Object.entries(recentAssistance.reduce<Record<string, number>>((result, item) => { result[item.type] = (result[item.type] ?? 0) + 1; return result; }, {})).map(([type, value]) => ({ label: typeLabels[type] ?? type.replaceAll("_", " "), value }));
  const providedCount = assistance.filter((item) => item.outcome === "PROVIDED").length;
  const financialTotal = assistance.reduce((total, item) => total + Number(item.financialAmount ?? 0), 0);
  const recentActivity = [
    ...assistance.slice(0, 4).map((item) => ({ id: item.id, title: `${typeLabels[item.type] ?? "Assistance"} record`, detail: `${item.beneficiary.firstName} ${item.beneficiary.lastName} · ${item.outcome.replaceAll("_", " ")}`, date: item.visitDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) })),
    ...beneficiaries.slice(0, 4).map((item) => ({ id: item.id, title: "Beneficiary registered", detail: `${item.firstName} ${item.lastName}`, date: item.registrationDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-[28px] border border-[#DCE7F5] bg-white px-6 py-7 text-[#071C3A] shadow-[0_24px_55px_-26px_rgba(7,28,58,0.28)] sm:px-8 sm:py-9">
        <span className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#0B68C5]/10 blur-3xl" /><span className="pointer-events-none absolute bottom-[-70px] left-1/3 h-52 w-52 rounded-full bg-[#C9A93F]/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#0B4599]"><Sparkles className="h-4 w-4 text-[#A88724]" /> Officer workspace</div><h1 className="mt-3 text-3xl font-black tracking-tight text-[#071C3A] sm:text-4xl">{category.name}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6480A9]">A focused view of your assigned beneficiaries, services, and actual category activity.</p></div>
          <div className="rounded-2xl border border-[#DCE7F5] bg-[#F7FAFF] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6480A9]">Today</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#173B70]"><CalendarDays className="h-4 w-4 text-[#A88724]" />{today.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</p></div>
        </div>
      </div>

      <OfficerDashboardAnalytics beneficiaryCount={beneficiaryCount} assistanceCount={assistanceCount} financialTotal={financialTotal} providedCount={providedCount} trend={trend} assistanceTypes={assistanceTypes} recentActivity={recentActivity} />

      <div className="flex items-center justify-between gap-3">
        <div>
        <Link
          href="/officer/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        </div><Link href="/officer/assistance/new" className="inline-flex items-center gap-2 rounded-xl bg-[#0B4599] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#073783]">Record assistance <ChevronRight className="h-4 w-4" /></Link>
      </div>

      <BeneficiaryRegistry
        categories={[{ id: category.id, name: category.name }]}
        filterCategories={[]}
        officers={[]}
        beneficiaries={beneficiaries.map((beneficiary) => ({
          id: beneficiary.id,
          beneficiaryNumber: beneficiary.beneficiaryNumber,
          fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
          categoryId: category.id,
          categoryName: category.name,
          barangay: beneficiary.barangay,
          officerName: user.name,
          status: beneficiary.status,
        }))}
        selectedCategoryId={category.id}
        officerMode
      />
    </div>
  );
}
