import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, ChevronDown, Search } from "lucide-react";
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
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar role="ADMIN" />
      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-16 sm:px-6 sm:pt-4 lg:px-8">
            <label className="relative block w-full max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Search cases, beneficiaries, reports, or anything"
                placeholder="Search cases, beneficiaries, reports, or anything..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <div className="flex items-center gap-3">
              <div
                role="img"
                aria-label={`${notificationCount} unread notifications`}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {notificationCount}
                  </span>
                )}
              </div>

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 sm:gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700">
                    {getInitials(user.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">Administrator</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
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
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
