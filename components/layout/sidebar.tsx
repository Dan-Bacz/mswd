import { LogOut, Menu } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";
import { NavLinks, type NavLinkItem } from "@/components/layout/nav-links";

const adminLinks: NavLinkItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/cases", label: "Cases", icon: "cases" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/beneficiaries", label: "Beneficiaries", icon: "beneficiaries" },
  { href: "/admin/officers", label: "Users", icon: "users" },
  { href: "/admin/categories", label: "Categories", icon: "categories" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

const officerLinks: NavLinkItem[] = [
  { href: "/officer/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/officer/beneficiaries", label: "My Beneficiaries", icon: "beneficiaries" },
  { href: "/officer/cases", label: "My Cases", icon: "tasks" },
  { href: "/officer/reports", label: "Reports", icon: "reports" },
  { href: "/admin/settings", label: "My Profile", icon: "profile" },
];

export async function Sidebar({ role }: { role: "ADMIN" | "OFFICER" }) {
  const [settings, currentUser] = await Promise.all([
    db.systemSetting.findMany({
      select: { key: true, value: true },
    }),
    getCurrentUser(),
  ]);

  const municipality =
    settings.find((setting) => ["municipality", "municipality_name", "municipal_name", "local_government_unit"].includes(setting.key.toLowerCase()))?.value ??
    "Municipal Government";

  if (role === "OFFICER") {
    const assignedCategories = currentUser
      ? await db.category.findMany({
          where: { userCategories: { some: { userId: currentUser.id } } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [];

    const sections = [
      { items: officerLinks },
      ...(assignedCategories.length > 0
        ? [
            {
              title: "My category dashboards",
              items: assignedCategories.map<NavLinkItem>((category) => ({
                href: `/officer/categories/${category.id}`,
                label: category.name,
                icon: "categories",
              })),
            },
          ]
        : []),
    ];

    return (
      <aside className="w-full max-w-[260px] shrink-0 border-r border-slate-200 bg-sky-950 text-sky-50">
        <div className="border-b border-sky-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 font-bold text-white">MS</div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Municipal</p>
              <h1 className="text-lg font-bold">MSWD</h1>
            </div>
          </div>
        </div>
        <nav className="p-4">
          <NavLinks sections={sections} className="space-y-1" activeClassName="bg-sky-800/90" />
          <div className="mt-6 border-t border-sky-800 pt-4">
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-sky-100 transition hover:bg-sky-800/80">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <div className="contents">
      <input id="admin-navigation-toggle" type="checkbox" className="peer sr-only" />
      <label htmlFor="admin-navigation-toggle" className="fixed left-4 top-4 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-[#0f172a] text-white shadow-lg focus-within:ring-4 focus-within:ring-sky-300 lg:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Toggle navigation menu</span>
      </label>
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[280px] flex-col border-r border-sky-800 bg-[#0f172a] text-sky-50 shadow-2xl peer-checked:flex lg:sticky lg:z-auto lg:flex lg:h-screen lg:shadow-none">
      <div className="border-b border-sky-800/80 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/90 text-sm font-bold text-white shadow-lg shadow-sky-900/20">
            MS
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-sky-300">Municipal</p>
            <h1 className="text-xl font-bold tracking-wide">MSWD</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks
          sections={[{ items: adminLinks }]}
          className="space-y-1.5"
          activeClassName="bg-sky-800/90 text-white"
        />

        <div className="mt-6 border-t border-sky-800 pt-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-sky-100 transition duration-200 hover:bg-sky-800/80"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </nav>

      <div className="border-t border-sky-800/80 px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">MSWD</p>
        <p className="mt-2 text-sm font-semibold text-white">Social Welfare and Development</p>
        <p className="mt-1 text-xs text-sky-200/80">{municipality}</p>
      </div>
      </aside>
    </div>
  );
}
