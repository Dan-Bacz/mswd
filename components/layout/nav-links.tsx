"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  FileText,
  FolderTree,
  HeartHandshake,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  dashboard: BarChart3,
  reports: FileText,
  categories: FolderTree,
  settings: Settings,
  users: ShieldCheck,
  profile: UserCircle2,
  beneficiaries: Users,
  assistance: HeartHandshake,
  notifications: Bell,
};

export type NavLinkItem = {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
};

export type NavSection = {
  title?: string;
  items: NavLinkItem[];
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  sections,
  className,
  activeClassName,
  collapsed = false,
  onNavigate,
}: {
  sections: NavSection[];
  className?: string;
  activeClassName?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {sections.map((section, sectionIndex) => (
        <div key={section.title ?? sectionIndex}>
          {section.title ? (
            <p className={`mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400 ${collapsed ? "sr-only" : ""}`}>
              {section.title}
            </p>
          ) : null}
          <ul className={className}>
            {section.items.map(({ href, label, icon }) => {
              const Icon = iconMap[icon] ?? FolderTree;
              const active = isActive(pathname, href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? label : undefined}
                    onClick={onNavigate}
                    className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sky-100 transition duration-200 ease-out hover:translate-x-0.5 hover:bg-white/10 hover:text-white",
                    collapsed && "justify-center px-2 hover:translate-x-0",
                      active && activeClassName,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
