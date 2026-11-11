import Image from "next/image";
import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  Baby,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  FileText,
  HandHeart,
  HeartHandshake,
  Landmark,
  ShieldCheck,
  Users,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { BeneficiaryDistributionChart } from "@/components/admin/dashboard-charts";
import { AdminDashboardAnalytics } from "@/components/admin/admin-dashboard-analytics";

const chartPalette = ["#0645AD", "#E31837", "#FFD21F", "#58A5E8", "#8B9CB4", "#168653"];

function categoryAppearance(name: string, index: number): { icon: LucideIcon; color: string } {
  const normalized = name.toLowerCase();

  if (normalized.includes("senior") || normalized.includes("citizen")) {
    return { icon: UserRound, color: "#D9A900" };
  }
  if (normalized.includes("pwd") || normalized.includes("disab")) {
    return { icon: Accessibility, color: "#E31837" };
  }
  if (normalized.includes("child") || normalized.includes("youth") || normalized.includes("juvenile")) {
    return { icon: Baby, color: "#0645AD" };
  }
  if (normalized.includes("solo parent") || normalized.includes("parent")) {
    return { icon: Users, color: "#168653" };
  }
  if (normalized.includes("indigenous") || normalized.includes("4ps")) {
    return { icon: HandHeart, color: "#58A5E8" };
  }

  return {
    icon: [BriefcaseBusiness, HeartHandshake, ShieldCheck, Landmark][index % 4],
    color: chartPalette[index % chartPalette.length],
  };
}

function isHiddenDashboardCategory(name: string) {
  const normalized = name.toLowerCase();
  return normalized === "women" || normalized.includes("eccd") || normalized.includes("maifip") || normalized.includes("juvenile");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(value);
}

type DashboardPeriod = "all" | "week" | "month";

function getDashboardRange(period: DashboardPeriod, now = new Date()) {
  if (period === "all") return undefined;
  const manilaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now).replaceAll("/", "-");
  const calendarDate = new Date(`${manilaDate}T00:00:00.000Z`);
  const startCalendar = new Date(calendarDate);

  if (period === "week") {
    const day = startCalendar.getUTCDay();
    startCalendar.setUTCDate(startCalendar.getUTCDate() - (day === 0 ? 6 : day - 1));
  } else {
    startCalendar.setUTCDate(1);
  }

  const endCalendar = new Date(startCalendar);
  if (period === "week") endCalendar.setUTCDate(endCalendar.getUTCDate() + 7);
  else endCalendar.setUTCMonth(endCalendar.getUTCMonth() + 1);

  const dateOnly = (value: Date) => value.toISOString().slice(0, 10);
  return {
    gte: new Date(`${dateOnly(startCalendar)}T00:00:00+08:00`),
    lt: new Date(`${dateOnly(endCalendar)}T00:00:00+08:00`),
  };
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }> | { period?: string };
}) {
  const user = await requireAdmin();
  const params = await Promise.resolve(searchParams ?? {});
  const period: DashboardPeriod = params.period === "week" || params.period === "month" ? params.period : "all";
  const dateRange = getDashboardRange(period);
  const [allCategories, recentActivity, systemSettings, beneficiaries, assistanceRecords] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, description: true } }),
    db.auditLog.findMany({
      where: dateRange ? { createdAt: dateRange } : undefined,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.systemSetting.findMany({ select: { key: true, value: true } }),
    db.beneficiary.count({ where: dateRange ? { registrationDate: dateRange } : undefined }),
    db.beneficiaryAssistance.count({ where: dateRange ? { visitDate: dateRange } : undefined }),
  ]);
  const categories = allCategories.filter((category) => !isHiddenDashboardCategory(category.name));
  const categoryCounts = await Promise.all(
    categories.map(async (category) => [
      category.id,
      await db.beneficiary.count({ where: { categoryId: category.id, ...(dateRange ? { registrationDate: dateRange } : {}) } }),
    ] as const),
  );
  const categoryCountMap = new Map(categoryCounts);

  const municipality =
    systemSettings.find((setting) =>
      ["municipality", "municipality_name", "municipal_name", "local_government_unit"].includes(setting.key.toLowerCase()),
    )?.value ?? "Municipal Government";
  const now = new Date();
  const manilaHour = Number(
    new Intl.DateTimeFormat("en-PH", { hour: "numeric", hour12: false, timeZone: "Asia/Manila" }).format(now),
  );
  const greeting = manilaHour < 12 ? "Good morning" : manilaHour < 18 ? "Good afternoon" : "Good evening";
  const currentDate = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(now);
  const categoryStats = categories.map((category, index) => ({
    name: category.name,
    beneficiaries: categoryCountMap.get(category.id) ?? 0,
    color: categoryAppearance(category.name, index).color,
  }));
  const quickActions = [
    { label: "Register beneficiary", href: "/admin/beneficiaries", icon: Users },
    { label: "Open reports", href: "/admin/reports", icon: FileText },
    { label: "Manage users", href: "/admin/officers", icon: ShieldCheck },
  ];
  const periodLabel = period === "week" ? "This week" : period === "month" ? "This month" : "All time";

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <h1 className="sr-only">Administrator dashboard</h1>

      <section className="relative isolate overflow-hidden rounded-[26px] border border-[#D9E5F5] bg-white px-5 py-5 shadow-[0_22px_48px_-32px_rgba(7,28,58,0.5)] sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-52 overflow-hidden sm:block" aria-hidden="true">
          <span className="absolute -right-5 top-0 h-full w-14 -skew-x-[25deg] bg-[#0645AD]/10" />
          <span className="absolute right-12 top-0 h-full w-8 -skew-x-[25deg] bg-[#E31837]/15" />
          <span className="absolute right-24 top-0 h-full w-5 -skew-x-[25deg] bg-[#FFD21F]/50" />
        </div>
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white bg-white p-1.5 shadow-sm">
              <Image src="/images/logo.png" width={400} height={400} alt="DSWD logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold capitalize text-[#0645AD]">{greeting}, {user.name.split(" ")[0]}!</p>
              <h2 className="mt-1 text-xl font-bold text-[#12335F] sm:text-2xl">MSWD Dashboard</h2>
              <p className="mt-1 text-xs text-[#536E92] sm:text-sm">Here&apos;s the overview of programs and services in {municipality}.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-[#405B80] sm:self-end sm:pb-1">
            <CalendarDays className="h-4 w-4 text-[#0645AD]" />
            <time>{currentDate}</time>
          </div>
        </div>
      </section>

      <AdminDashboardAnalytics beneficiaries={beneficiaries} assistanceRecords={assistanceRecords} categories={categoryStats} periodLabel={periodLabel} />

      <section className="dashboard-panel rounded-2xl border border-[#D9E5F5] bg-white p-4 shadow-[0_20px_42px_-30px_rgba(7,28,58,0.45)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#173B70]">Programs &amp; Services</h2>
            <span className="mt-2 block h-1 w-12 rounded-full bg-[#FFD21F]" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <form method="get" className="flex items-center gap-2">
              <label htmlFor="dashboard-period" className="text-xs font-semibold text-[#405B80]">Show</label>
              <select id="dashboard-period" name="period" defaultValue={period} className="h-9 rounded-lg border border-[#DCE3EE] bg-white px-2 text-xs font-semibold text-[#405B80] focus:border-[#0645AD] focus:outline-none">
                <option value="all">All time</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
              <button type="submit" className="h-9 rounded-lg bg-[#0645AD] px-3 text-xs font-semibold text-white hover:bg-[#073783]">Apply</button>
            </form>
            <Link href="/admin/categories" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0645AD] hover:underline">Manage programs <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
        {categories.length > 0 ? (
          <div className="space-y-3">
            {categories.map((category, index) => {
              const appearance = categoryAppearance(category.name, index);
              const Icon = appearance.icon;
              return (
                <Link
                  key={category.id}
                  href={`/admin/beneficiaries?categoryId=${encodeURIComponent(category.id)}`}
                  className="group flex min-h-[112px] items-start gap-3 rounded-xl border border-[#D9E5F5] border-l-4 p-4 transition hover:-translate-y-0.5 hover:bg-[#F8FAFE] hover:shadow-[0_14px_28px_-20px_rgba(7,28,58,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645AD]"
                  aria-label={`View ${category.name} beneficiaries`}
                  style={{ borderTopColor: appearance.color }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F2F6FC]" style={{ color: appearance.color }}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#173B70]">{category.name}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-[#6480A9]">
                      {category.description || "View beneficiaries enrolled in this program."}
                    </span>
                    <span className="mt-2 block text-[11px] font-medium text-[#405B80]">
                      {(categoryCountMap.get(category.id) ?? 0).toLocaleString()} beneficiaries
                    </span>
                  </span>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#8CA2BF] transition group-hover:translate-x-0.5 group-hover:text-[#0645AD]" />
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-[#D9E5F5] p-5 text-center text-sm text-[#6480A9]">
            No programs are configured yet. Add a category to get started.
          </p>
        )}
      </section>

      <section className="grid gap-4">
        <div className="dashboard-panel rounded-2xl border border-[#D9E5F5] bg-white p-4 shadow-[0_20px_42px_-30px_rgba(7,28,58,0.45)] sm:p-5">
          <div className="mb-3">
            <h2 className="text-base font-bold text-[#173B70]">Beneficiary Distribution</h2>
            <p className="mt-1 text-xs text-[#6480A9]">Registered beneficiaries by program category{period === "week" ? " this week" : period === "month" ? " this month" : ""}</p>
          </div>
          <BeneficiaryDistributionChart categories={categoryStats} />
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="dashboard-panel rounded-2xl border border-[#D9E5F5] bg-white p-4 shadow-[0_20px_42px_-30px_rgba(7,28,58,0.45)] sm:p-5">
            <h2 className="text-base font-bold text-[#173B70]">Quick Actions</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between gap-3 rounded-md border border-[#D9E5F5] px-3 py-2.5 text-xs font-semibold text-[#405B80] transition hover:border-[#9CB6DA] hover:bg-[#F4F7FC] hover:text-[#0645AD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645AD]"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-[#0645AD]" aria-hidden="true" />
                    {label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#8CA2BF]" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#D9E5F5] bg-white p-4 shadow-[0_2px_8px_rgba(6,59,145,0.04)] sm:p-5">
            <h2 className="text-base font-bold text-[#173B70]">Recent Activities</h2>
            {recentActivity.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="flex gap-2.5 border-b border-[#EEF2F8] pb-3 last:border-0 last:pb-0">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0645AD]" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#173B70]">{activity.action}</p>
                      <p className="mt-0.5 text-[11px] text-[#6480A9]">
                        {activity.module} · {activity.user?.name ?? "System"} · {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-md border border-dashed border-[#D9E5F5] p-4 text-xs text-[#6480A9]">
                No recent activities have been recorded.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
