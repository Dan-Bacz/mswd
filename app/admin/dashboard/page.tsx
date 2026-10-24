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

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const [
    beneficiaries,
    assistanceRecords,
    allCategories,
    recentActivity,
    systemSettings,
  ] = await Promise.all([
    db.beneficiary.count(),
    db.beneficiaryAssistance.count(),
    db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { beneficiaries: true } } },
    }),
    db.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.systemSetting.findMany({ select: { key: true, value: true } }),
  ]);
  const categories = allCategories.filter((category) => !isHiddenDashboardCategory(category.name));

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
    beneficiaries: category._count.beneficiaries,
    color: categoryAppearance(category.name, index).color,
  }));
  const quickActions = [
    { label: "Register beneficiary", href: "/admin/beneficiaries", icon: Users },
    { label: "Open reports", href: "/admin/reports", icon: FileText },
    { label: "Manage users", href: "/admin/officers", icon: ShieldCheck },
  ];
  const metrics = [
    { label: "Total beneficiaries", value: beneficiaries, icon: Users, color: "#0645AD", tint: "#EEF4FF" },
    { label: "Assistance records", value: assistanceRecords, icon: HandHeart, color: "#E31837", tint: "#FFF0F2" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <h1 className="sr-only">Administrator dashboard</h1>

      <section className="relative isolate overflow-hidden rounded-xl border border-[#D9E5F5] bg-[#EAF2FC] px-5 py-5 sm:px-7 sm:py-6">
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

      <section aria-label="System summary" className="grid gap-3 sm:grid-cols-2">
        {metrics.map(({ label, value, icon: Icon, color, tint }) => (
          <div key={label} className="flex min-h-[112px] items-center justify-between rounded-lg border border-[#D9E5F5] border-t-2 bg-white p-4 shadow-[0_2px_8px_rgba(6,59,145,0.04)]" style={{ borderTopColor: color }}>
            <div>
              <p className="text-xs font-medium text-[#6480A9]">{label}</p>
              <p className="mt-2 text-3xl font-bold leading-none text-[#173B70]">{value.toLocaleString()}</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: tint, color }}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[#D9E5F5] bg-white p-4 shadow-[0_2px_8px_rgba(6,59,145,0.04)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#173B70]">Programs &amp; Services</h2>
            <span className="mt-2 block h-1 w-12 rounded-full bg-[#FFD21F]" />
          </div>
          <Link href="/admin/categories" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0645AD] hover:underline">
            Manage programs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {categories.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => {
              const appearance = categoryAppearance(category.name, index);
              const Icon = appearance.icon;
              return (
                <Link
                  key={category.id}
                  href={`/admin/beneficiaries?categoryId=${encodeURIComponent(category.id)}`}
                  className="group flex min-h-[112px] items-start gap-3 rounded-md border border-[#D9E5F5] border-t-2 p-3.5 transition hover:bg-[#F8FAFE] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645AD]"
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
                      {category._count.beneficiaries.toLocaleString()} beneficiaries
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
        <div className="rounded-lg border border-[#D9E5F5] bg-white p-4 shadow-[0_2px_8px_rgba(6,59,145,0.04)] sm:p-5">
          <div className="mb-3">
            <h2 className="text-base font-bold text-[#173B70]">Beneficiary Distribution</h2>
            <p className="mt-1 text-xs text-[#6480A9]">Registered beneficiaries by program category</p>
          </div>
          <BeneficiaryDistributionChart categories={categoryStats} />
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border border-[#D9E5F5] bg-white p-4 shadow-[0_2px_8px_rgba(6,59,145,0.04)] sm:p-5">
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
