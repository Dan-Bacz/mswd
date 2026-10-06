import Link from "next/link";
import { BarChart3, Briefcase, FileText, FolderTree, ShieldCheck, UserCircle2, Users, ClipboardList, Settings, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/beneficiaries", label: "Beneficiaries", icon: Users },
  { href: "/admin/cases", label: "Cases", icon: Briefcase },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/officers", label: "Officers", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const officerLinks = [
  { href: "/officer/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/officer/beneficiaries", label: "My Beneficiaries", icon: Users },
  { href: "/officer/cases", label: "My Cases", icon: ClipboardList },
  { href: "/officer/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "My Profile", icon: UserCircle2 },
];

export function Sidebar({ role }: { role: "ADMIN" | "OFFICER" }) {
  const links = role === "ADMIN" ? adminLinks : officerLinks;

  return (
    <aside className="w-full max-w-[260px] shrink-0 border-r border-slate-200 bg-sky-950 text-sky-50">
      <div className="border-b border-sky-800 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 font-bold text-white">
            MS
          </div>
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
                  href.includes("dashboard") && "bg-sky-800/90"
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
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-sky-100 transition hover:bg-sky-800/80"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
