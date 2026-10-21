import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { getInitials } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

export default async function OfficerLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("OFFICER");
  const assignedCategories = await db.category.findMany({
    where: { id: { in: user.categoryIds } },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const categoryNames = assignedCategories.map((category) => category.name);
  const dashboardTitle = categoryNames.join(" · ") || "Officer Workspace";
  const notificationCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });
  const currentDate = new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date());

  return (
    <div className="flex min-h-screen bg-[#F4F7FC]">
      <Sidebar role="OFFICER" />
      <div className="min-w-0 flex-1">
        <header className="border-b border-[#D9E5F5] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(6,59,145,0.04)] sm:px-6 lg:px-8">
          <div className="flex min-h-11 items-center justify-between gap-4 pl-12 lg:pl-0">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0645AD]">
                {categoryNames.length > 1 ? "Assigned categories" : "Assigned category"}
              </p>
              <h1 className="truncate text-lg font-bold text-[#063B91] sm:text-xl">{dashboardTitle}</h1>
              <p className="mt-0.5 hidden text-xs text-[#6480A9] sm:block">Municipal Social Welfare and Development Office</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <time className="hidden text-xs font-medium text-[#6480A9] md:block">{currentDate}</time>
              <div
                role="img"
                aria-label={`${notificationCount} unread notifications`}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D9E5F5] bg-white text-[#063B91]"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E31837] px-1 text-[10px] font-semibold text-white">
                    {notificationCount}
                  </span>
                )}
              </div>
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-[#D9E5F5] bg-white px-2 py-1.5 transition hover:bg-[#F4F7FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0645AD]/15 sm:gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF1FB] text-sm font-bold text-[#063B91]">
                    {getInitials(user.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-36 truncate text-sm font-semibold text-[#173B70]">{user.name}</span>
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-[#6480A9]">Officer</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#6480A9] transition-transform group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[#D9E5F5] bg-white p-2 shadow-lg">
                  <p className="truncate px-3 py-2 text-xs text-[#6480A9]">{user.email}</p>
                  <Link href="/admin/settings" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#F4F7FC]">
                    Account settings
                  </Link>
                  <form action={logoutAction}>
                    <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50">
                      Sign out
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
