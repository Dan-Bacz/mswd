import { LogOut, Menu } from "lucide-react";
import Image from "next/image";
import { logoutAction } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";
import { NavLinks, type NavLinkItem } from "@/components/layout/nav-links";

const adminLinks: NavLinkItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/categories", label: "Programs & Services", icon: "categories" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/beneficiaries", label: "Beneficiaries", icon: "beneficiaries" },
  { href: "/admin/assistance", label: "Assistance", icon: "assistance" },
  { href: "/admin/officers", label: "Officers", icon: "users" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

const officerLinks: NavLinkItem[] = [
  { href: "/officer/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/officer/beneficiaries", label: "Benefeciaries", icon: "beneficiaries" },
  { href: "/officer/assistance", label: "Assistance", icon: "assistance" },
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
      <div className="contents">
        <input id="officer-navigation-toggle" type="checkbox" className="peer sr-only" />
        <label htmlFor="officer-navigation-toggle" className="fixed left-4 top-4 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-[#073783] text-white shadow-lg focus-within:ring-4 focus-within:ring-sky-300 lg:hidden">
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Toggle navigation menu</span>
        </label>
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[280px] flex-col border-r border-[#0b3478] bg-[#073783] text-white shadow-2xl peer-checked:flex lg:sticky lg:z-auto lg:flex lg:h-screen lg:shadow-none">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
              <Image src="/images/logo.png" width={400} height={400} alt="DSWD logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-white">MSWD Management System</h1>
              <p className="mt-1 text-[10px] leading-relaxed text-blue-100">Municipal Social Welfare and Development Office</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks
            sections={sections}
            className="space-y-1"
            activeClassName="!bg-[#FFD21F] !text-[#073783] font-semibold hover:!bg-[#ffe05a]"
          />
          <div className="mt-6 border-t border-white/15 pt-4">
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-sky-100 transition hover:bg-white/10">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </nav>
        <div className="border-t border-white/15 px-4 py-4">
          <div className="mb-3 flex h-1 overflow-hidden rounded-full" aria-hidden="true">
            <span className="w-1/3 bg-[#FFD21F]" />
            <span className="w-1/3 bg-[#E31837]" />
            <span className="w-1/3 bg-white" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-blue-100">Mahayag • MSWD</p>
          <p className="mt-1 text-xs font-medium text-white">{municipality}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-blue-100/80">Sa Tamang Serbisyo, Mas Matatag na Komunidad.</p>
        </div>
      </aside>
      </div>
    );
  }

  return (
    <div className="contents">
      <input id="admin-navigation-toggle" type="checkbox" className="peer sr-only" />
      <label htmlFor="admin-navigation-toggle" className="fixed left-4 top-4 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-[#073783] text-white shadow-lg focus-within:ring-4 focus-within:ring-sky-300 lg:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Toggle navigation menu</span>
      </label>
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[280px] flex-col border-r border-[#0b3478] bg-[#073783] text-white shadow-2xl peer-checked:flex lg:sticky lg:z-auto lg:flex lg:h-screen lg:shadow-none">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
            <Image src="/images/logo.png" width={400} height={400} alt="DSWD logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white">MSWD Management System</h1>
            <p className="mt-1 text-[10px] leading-relaxed text-blue-100">Municipal Social Welfare and Development Office</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks
          sections={[{ items: adminLinks }]}
          className="space-y-1"
          activeClassName="!bg-[#FFD21F] !text-[#073783] font-semibold hover:!bg-[#ffe05a]"
        />

        <div className="mt-6 border-t border-white/15 pt-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-sky-100 transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </nav>

      <div className="border-t border-white/15 px-4 py-4">
        <div className="mb-3 flex h-1 overflow-hidden rounded-full" aria-hidden="true">
          <span className="w-1/3 bg-[#FFD21F]" />
          <span className="w-1/3 bg-[#E31837]" />
          <span className="w-1/3 bg-white" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-blue-100">Mahayag • MSWD</p>
        <p className="mt-1 text-xs font-medium text-white">{municipality}</p>
        <p className="mt-2 text-[10px] leading-relaxed text-blue-100/80">Sa Tamang Serbisyo, Mas Matatag na Komunidad.</p>
      </div>
      </aside>
    </div>
  );
}
