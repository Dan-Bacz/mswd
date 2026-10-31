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
  const [notificationCount, recentNotifications] = await Promise.all([db.notification.count({
    where: { userId: user.id, isRead: false },
  }), db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 })]);
  return (
    <div className="flex min-h-screen bg-[#F4F7FC]">
      <Sidebar role="ADMIN" />
      <div className="min-w-0 flex-1">
        <header className="relative overflow-visible border-b border-[#0B3478] bg-gradient-to-r from-[#0B4599] via-[#0D4A9F] to-[#1556AA] px-4 py-4 text-white shadow-[0_6px_22px_rgba(7,55,131,0.18)] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[#FFD21F]/80 after:to-transparent sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[#FFD21F]" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
            <span className="absolute -right-12 -top-24 h-56 w-56 rounded-full bg-[#FFD21F]/10 blur-3xl" />
            <span className="absolute right-[12%] top-0 h-full w-12 -skew-x-[28deg] bg-gradient-to-b from-white/10 via-[#FFD21F]/10 to-transparent" />
            <span className="absolute right-[20%] top-0 h-full w-5 -skew-x-[28deg] bg-gradient-to-b from-[#FFD21F]/20 to-transparent" />
            <span className="absolute bottom-0 left-[18%] h-px w-24 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          </div>
          <div className="relative z-10 grid min-h-12 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[1fr_minmax(0,3fr)_1fr] sm:gap-4">
            <span aria-hidden="true" className="sm:block" />
            <div className="min-w-0 text-center">
              <h1 className="text-[9px] font-extrabold leading-tight tracking-[0.04em] text-white sm:text-xs sm:tracking-[0.08em] lg:text-sm">DEPARTMENT OF SOCIAL WELFARE AND DEVELOPMENT</h1>
              <p className="mt-1 text-[9px] font-medium tracking-[0.06em] text-blue-100 sm:text-[11px]">
                Mahayag, Zamboanga del Sur
              </p>
              <span aria-hidden="true" className="mx-auto mt-2 block h-0.5 w-10 rounded-full bg-[#FFD21F] shadow-[0_0_10px_rgba(255,210,31,0.5)]" />
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
<<<<<<< HEAD
              <details className="group relative"><summary className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-inner"><Bell className="h-4 w-4" />{notificationCount > 0 && <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E31837] px-1 text-[10px] font-semibold text-white">{notificationCount}</span>}</summary><div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl"><p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Notifications</p>{recentNotifications.length ? recentNotifications.map((notification) => <Link key={notification.id} href="/admin/officers" className="block rounded-xl px-2 py-2 hover:bg-slate-50"><p className="text-sm font-semibold">{notification.title}</p><p className="mt-1 text-xs text-slate-500">{notification.message}</p></Link>) : <p className="px-2 py-3 text-sm text-slate-500">No notifications.</p>}</div></details>
=======
              <Link
                href="/admin/notifications"
                aria-label={`${notificationCount} unread notifications`}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-inner transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD21F]/35"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E31837] px-1 text-[10px] font-semibold text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>
>>>>>>> 41a1cf9858653e2d1b3b65c6f58e4f4de75bbbdf

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
        <main className="min-w-0 w-full p-3 sm:p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
