import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { getInitials } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const notificationCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });
  return (
    <div className="flex min-h-screen bg-[#F4F7FC]">
      <Sidebar role="ADMIN" />
      <div className="min-w-0 flex-1">
        <header className="relative overflow-visible border-b border-[#0B3478] bg-gradient-to-r from-[#0B4599] via-[#0D4A9F] to-[#1556AA] px-4 py-4 text-white shadow-[0_6px_22px_rgba(7,55,131,0.18)] sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[#FFD21F]" />
          <div className="grid min-h-12 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[1fr_minmax(0,3fr)_1fr] sm:gap-4">
            <span aria-hidden="true" className="sm:block" />
            <div className="min-w-0 text-center">
              <h1 className="text-[9px] font-extrabold leading-tight tracking-[0.04em] text-white sm:text-xs sm:tracking-[0.08em] lg:text-sm">DEPARTMENT OF SOCIAL WELFARE AND DEVELOPMENT</h1>
              <p className="mt-1 text-[9px] font-medium tracking-[0.06em] text-blue-100 sm:text-[11px]">
                Mahayag, Zamboanga del Sur
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
              <div
                role="img"
                aria-label={`${notificationCount} unread notifications`}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-inner"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E31837] px-1 text-[10px] font-semibold text-white">
                    {notificationCount}
                  </span>
                )}
              </div>

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2 py-1.5 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD21F]/35 sm:gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#0B4599] shadow-sm">
                    {getInitials(user.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-36 truncate text-sm font-semibold text-white">{user.name}</span>
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-blue-100">Administrator</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-blue-100 transition-transform group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <p className="truncate px-3 py-2 text-xs text-slate-500">{user.email}</p>
                  <Link
                    href="/admin/settings"
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Account settings
                  </Link>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                    >
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
