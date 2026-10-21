import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";

export default async function OfficerLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("OFFICER");
  const assignedCategories = await db.category.findMany({
    where: { id: { in: user.categoryIds } },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const categoryNames = assignedCategories.map((category) => category.name);
  const dashboardTitle = categoryNames.join(" · ") || "Officer Workspace";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role="OFFICER" />
      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-600">
                {categoryNames.length > 1 ? "Assigned categories" : "Assigned category"}
              </p>
              <h2 className="break-words text-2xl font-bold text-slate-900">{dashboardTitle}</h2>
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
