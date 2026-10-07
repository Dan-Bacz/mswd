import Link from "next/link";
import { BarChart3, Briefcase, ChevronDown, FileText, FolderTree, LogOut, Menu, Settings, ShieldCheck, UserCircle2, Users, ClipboardList } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { cn, shouldShowBeneficiaryCategory } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/cases", label: "Cases", icon: Briefcase },
  { href: "/admin/reports", label: "Reports", icon: FileText },
];

const officerLinks = [
  { href: "/officer/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/officer/beneficiaries", label: "My Beneficiaries", icon: Users },
  { href: "/officer/cases", label: "My Cases", icon: ClipboardList },
  { href: "/officer/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "My Profile", icon: UserCircle2 },
];

function getCategoryDisplayName(name: string) {
  const normalizedName = name.trim().toLowerCase();

  if (normalizedName.startsWith("assistance to individuals in crisis situation")) return "AICS";
  if (normalizedName === "children in need of special protection") return "CICL-CNSP";
  if (normalizedName === "disaster-affected families/individuals") return "DAFI";
  if (normalizedName.startsWith("person with disabilities")) return "PWD";
  if (normalizedName === "senior citizens") return "Senior Citizens";
  if (normalizedName === "solo parents") return "Solo Parents";
  if (normalizedName === "vawc victims") return "VAWC";
  if (normalizedName.startsWith("women especially in difficult circumstances")) return "WEDC";

  return name;
}

export async function Sidebar({ role }: { role: "ADMIN" | "OFFICER" }) {
  const links = role === "ADMIN" ? adminLinks : officerLinks;
  const settings = await db.systemSetting.findMany({
    select: { key: true, value: true },
  });
  const municipality =
    settings.find((setting) => ["municipality", "municipality_name", "municipal_name", "local_government_unit"].includes(setting.key.toLowerCase()))?.value ??
    "Municipal Government";
  const categories = role === "ADMIN"
    ? (await db.category.findMany({ orderBy: { name: "asc" } })).filter((category) => shouldShowBeneficiaryCategory(category.name))
    : [];

  if (role === "OFFICER") {
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
          <ul className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-800/80",
                    href.includes("dashboard") && "bg-sky-800/90",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
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
        <ul className="space-y-1.5">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-100 transition duration-200 hover:bg-sky-800/80",
                  href.includes("dashboard") && "bg-sky-800/90 text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          ))}

          {role === "ADMIN" && (
            <li>
              <details open className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-sky-100 transition duration-200 hover:bg-sky-800/80">
                  <span className="flex items-center gap-3">
                    <Users className="h-4 w-4" />
                    Beneficiaries
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>

                <div className="mt-2 max-h-72 space-y-1 overflow-y-auto border-l border-sky-700/80 pl-3">
                  <Link
                    href="/admin/beneficiaries"
                    className="flex items-center rounded-lg px-2.5 py-1.5 text-xs text-sky-100/90 transition hover:bg-sky-800/70 hover:text-white"
                  >
                    All beneficiaries
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/admin/beneficiaries?category=${encodeURIComponent(category.name)}`}
                      title={category.name}
                      className="flex items-center rounded-lg px-2.5 py-1.5 text-xs text-sky-100/80 transition hover:bg-sky-800/70 hover:text-white"
                    >
                      {getCategoryDisplayName(category.name)}
                    </Link>
                  ))}
                </div>
              </details>
            </li>
          )}

          {role === "ADMIN" && (
            <>
              <li>
                <Link href="/admin/officers" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-100 transition duration-200 hover:bg-sky-800/80">
                  <ShieldCheck className="h-4 w-4" />
                  Users
                </Link>
              </li>
              <li>
                <Link href="/admin/categories" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-100 transition duration-200 hover:bg-sky-800/80">
                  <FolderTree className="h-4 w-4" />
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/admin/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-100 transition duration-200 hover:bg-sky-800/80">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </li>
            </>
          )}
        </ul>

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
