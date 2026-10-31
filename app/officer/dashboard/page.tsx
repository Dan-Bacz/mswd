import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FolderTree,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { BeneficiaryDistributionChart } from "@/components/admin/dashboard-charts";

const chartPalette = ["#0645AD", "#E31837", "#FFD21F", "#58A5E8", "#8B9CB4", "#168653"];

function getCategoryColor(name: string, index: number) {
  const normalized = name.toLowerCase();
  if (normalized.includes("senior") || normalized.includes("citizen")) return "#D9A900";
  if (normalized.includes("pwd") || normalized.includes("disab")) return "#E31837";
  if (normalized.includes("child") || normalized.includes("youth") || normalized.includes("juvenile")) return "#0645AD";
  if (normalized.includes("solo parent") || normalized.includes("parent")) return "#168653";
  if (normalized.includes("indigenous") || normalized.includes("4ps")) return "#58A5E8";
  return chartPalette[index % chartPalette.length];
}

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [
    myBeneficiaries,
    notifications,
    categories,
  ] = await Promise.all([
    db.beneficiary.count({ where: { assignedOfficerId: user.id } }),
    db.notification.count({ where: { userId: user.id, isRead: false } }),
    db.category.findMany({
      where: { userCategories: { some: { userId: user.id } } },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            beneficiaries: { where: { assignedOfficerId: user.id } },
          },
        },
      },
    }),
  ]);

  const categoryNames = categories.map((category) => category.name);
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
    color: getCategoryColor(category.name, index),
  }));
  const metrics: Array<{ label: string; value: number; hint: string; icon: LucideIcon; color: string; tint: string }> = [
    { label: "My beneficiaries", value: myBeneficiaries, hint: "Assigned to your programs", icon: Users, color: "#0645AD", tint: "#EEF4FF" },
    { label: "Unread notifications", value: notifications, hint: "Updates for your account", icon: Activity, color: "#E31837", tint: "#FFF0F2" },
  ];
  const quickActions: Array<{ label: string; href: string; icon: LucideIcon }> = [
    { label: "View my beneficiaries", href: "/officer/beneficiaries", icon: Users },
    { label: "Open reports", href: "/officer/reports", icon: ClipboardList },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <h2 className="sr-only">Officer dashboard</h2>

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
            <div className="min-w-0">
              <p className="text-sm font-semibold capitalize text-[#0645AD]">{greeting}, {user.name.split(" ")[0]}!</p>
              <h1 className="mt-1 truncate text-xl font-bold text-[#12335F] sm:text-2xl">
                {categoryNames.join(" · ") || "Officer overview"}
              </h1>
              <p className="mt-1 text-xs text-[#536E92] sm:text-sm">Here&apos;s your assigned programs and beneficiary overview.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-[#405B80] sm:self-end sm:pb-1">
            <CalendarDays className="h-4 w-4 text-[#0645AD]" />
            <time>{currentDate}</time>
          </div>
        </div>
      </section>

      <section aria-label="Officer summary" className="grid gap-3 sm:grid-cols-2">
        {metrics.map(({ label, value, hint, icon: Icon, color, tint }) => (
          <div key={label} className="flex min-h-[112px] items-center justify-between rounded-lg border border-[#D9E5F5] border-t-2 bg-white p-4 shadow-[0_2px_8px_rgba(6,59,145,0.04)]" style={{ borderTopColor: color }}>
            <div>
              <p className="text-xs font-medium text-[#6480A9]">{label}</p>
              <p className="mt-2 text-3xl font-bold leading-none text-[#173B70]">{value.toLocaleString()}</p>
              <p className="mt-1.5 text-[10px] text-[#6480A9]">{hint}</p>
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
            <h2 className="text-lg font-bold text-[#173B70]">My Assigned Programs</h2>
            <span className="mt-2 block h-1 w-12 rounded-full bg-[#FFD21F]" />
          </div>
          <span className="rounded-full bg-[#F4F7FC] px-2.5 py-1 text-[11px] font-semibold text-[#6480A9]">
            {categories.length} assigned
          </span>
        </div>
        {categories.length > 0 ? (
          <div className="space-y-3">
            {categories.map((category, index) => {
              const color = getCategoryColor(category.name, index);
              return (
                <Link
                  key={category.id}
                  href={`/officer/categories/${category.id}`}
                  className="group flex min-h-[112px] items-start gap-3 rounded-md border border-[#D9E5F5] border-l-4 p-4 transition hover:bg-[#F8FAFE] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0645AD]"
                  style={{ borderTopColor: color }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F2F6FC]" style={{ color }}>
                    <FolderTree className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#173B70]">{category.name}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-[#6480A9]">
                      Beneficiaries assigned to you in this program.
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
          <div className="flex items-start gap-3 rounded-md border border-dashed border-[#D9E5F5] bg-[#F8FAFE] p-5 text-sm text-[#6480A9]">
            <Activity className="mt-0.5 h-5 w-5 shrink-0 text-[#0645AD]" />
            <p>No categories are assigned to you yet. Ask an administrator to assign a program to unlock its dashboard.</p>
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div className="rounded-lg border border-[#D9E5F5] bg-white p-4 shadow-[0_2px_8px_rgba(6,59,145,0.04)] sm:p-5">
          <div className="mb-3">
            <h2 className="text-base font-bold text-[#173B70]">My Beneficiary Distribution</h2>
            <p className="mt-1 text-xs text-[#6480A9]">Your assigned beneficiaries by program</p>
          </div>
          <BeneficiaryDistributionChart categories={categoryStats} />
        </div>
      </section>

      <section className="grid min-w-0 gap-4">
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
          <div className="mt-4 rounded-md border border-[#D9E5F5] bg-[#F8FAFE] p-3">
            <p className="text-xs font-semibold text-[#173B70]">Your dashboard</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#6480A9]">
              Counts and charts are limited to beneficiaries assigned to your account.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
