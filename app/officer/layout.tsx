import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { requireRole } from "@/lib/auth/permissions";

export default async function OfficerLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("OFFICER");

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role="OFFICER" />
      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-600">Officer module</p>
              <h2 className="text-2xl font-bold text-slate-900">Officer Workspace</h2>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {user.name}
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
