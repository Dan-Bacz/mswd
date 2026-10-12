import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar role="ADMIN" />
      <div className="min-w-0 flex-1">
        <header className="relative isolate overflow-hidden border-b border-blue-300/20 bg-gradient-to-r from-[#0b2e59] via-[#0756a8] to-[#0569b3] text-white shadow-[0_10px_32px_-22px_rgba(8,37,75,0.8)]">
          <div className="pointer-events-none absolute -right-12 -top-32 -z-10 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-24 -z-10 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative z-10 flex flex-col gap-5 px-4 pb-5 pt-16 sm:px-6 sm:pt-5 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md shadow-blue-950/25 sm:h-14 sm:w-14">
                <Image src="/images/logo.png" width={400} height={400} alt="DSWD logo" className="h-full w-full object-contain" priority />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:text-xs sm:tracking-[0.16em] lg:text-sm">
                  DEPARTMENT OF SOCIAL WELFARE AND DEVELOPMENT
                </p>
                <p className="mt-1 text-xs font-medium text-blue-100 sm:text-sm">Bawat Pilipino, Mahalaga</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <div
                role="img"
                aria-label={`${notificationCount} unread notifications`}
                className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-sm"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {notificationCount}
                  </span>
                )}
              </div>

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2 py-1.5 shadow-sm transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#0756a8]">
                    {getInitials(user.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-36 truncate text-sm font-semibold text-white">{user.name}</span>
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-blue-100">Administrator</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-white/80 transition-transform group-open:rotate-180" />
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
