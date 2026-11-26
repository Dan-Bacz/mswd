"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bell,
  ClipboardCheck,
  DatabaseBackup,
  Eye,
  FileText,
  FolderTree,
  HeartHandshake,
  Plus,
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
  membership: ClipboardCheck,
  backup: DatabaseBackup,
  add: Plus,
  view: Eye,
};

export type NavLinkItem = {
  href?: string;
  label: string;
  icon: keyof typeof iconMap;
  children?: NavLinkItem[];
};

export type NavSection = {
  title?: string;
  items: NavLinkItem[];
};

function hrefMatches(pathname: string, searchParams: URLSearchParams, href: string) {
  const [path, query] = href.split("?");
  if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
  if (!query) return true;
  const wantedCategory = new URLSearchParams(query).get("categoryId");
  return !wantedCategory || searchParams.get("categoryId") === wantedCategory;
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
  const searchParams = useSearchParams();

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
            {section.items.map((item) => {
              const { href, label, icon, children } = item;
              const Icon = iconMap[icon] ?? FolderTree;
              const active = href ? hrefMatches(pathname, searchParams, href) : false;

              return (
                <li key={href ?? label}>
                  {href ? (
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? label : undefined}
                      onClick={onNavigate}
                      className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-100/90 transition duration-200 ease-out hover:translate-x-0.5 hover:bg-white/10 hover:text-white",
                      collapsed && "justify-center px-2 hover:translate-x-0",
                        active && activeClassName,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
                    </Link>
                  ) : (
                    <span
                      title={collapsed ? label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white",
                        collapsed && "justify-center px-2",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
                    </span>
                  )}
                  {children?.length ? (
                    <ul className={cn("mt-1 space-y-0.5 border-l border-white/10", collapsed ? "ml-4 pl-2" : "ml-4 pl-3")}>
                      {children.map((child) => {
                        const ChildIcon = iconMap[child.icon] ?? FolderTree;
                        const childActive = child.href ? hrefMatches(pathname, searchParams, child.href) : false;
                        return (
                          <li key={child.href ?? child.label}>
                            {child.href ? (
                              <Link
                                href={child.href}
                                aria-current={childActive ? "page" : undefined}
                                title={collapsed ? child.label : undefined}
                                onClick={onNavigate}
                                className={cn(
                                  "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-sky-100/80 transition duration-200 hover:bg-white/10 hover:text-white",
                                  collapsed && "justify-center px-2",
                                  childActive && activeClassName,
                                )}
                              >
                                <ChildIcon className="h-3.5 w-3.5" />
                                <span className={collapsed ? "sr-only" : "truncate"}>{child.label}</span>
                              </Link>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
