"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { NavLinks, type NavSection } from "@/components/layout/nav-links";

const STORAGE_KEY = "mswd-sidebar-collapsed";
const SIDEBAR_PREFERENCE_EVENT = "mswd-sidebar-preference-change";

function subscribeToSidebarPreference(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SIDEBAR_PREFERENCE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SIDEBAR_PREFERENCE_EVENT, onStoreChange);
  };
}

function getSidebarPreference() {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function SidebarNavigation({
  municipality,
  sections,
}: {
  municipality: string;
  sections: NavSection[];
}) {
  const collapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreference,
    () => false,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsedForDisplay = collapsed && !mobileOpen;

  function toggleCollapsed() {
    window.localStorage.setItem(STORAGE_KEY, String(!collapsed));
    window.dispatchEvent(new Event(SIDEBAR_PREFERENCE_EVENT));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileOpen}
        aria-controls="dashboard-sidebar"
        className="fixed left-4 top-4 z-[70] flex h-11 w-11 items-center justify-center rounded-xl bg-[#073783] text-white shadow-lg transition hover:bg-[#0B4599] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD21F]/50 lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[60] bg-[#071329]/55 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-[65] flex h-dvh w-[min(84vw,280px)] flex-col border-r border-[#0b3478] bg-[#073783] text-white shadow-2xl transition-[width,transform] duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-[80px]" : "lg:w-[280px]"}`}
      >
        <div className={`flex min-h-[88px] items-center border-b border-white/10 p-4 ${collapsed ? "lg:justify-center lg:px-2" : ""}`}>
          <div className={`flex min-w-0 items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
              <Image src="/images/logo.png" width={400} height={400} alt="DSWD logo" className="h-full w-full object-contain" />
            </div>
            <div className={collapsed ? "lg:hidden" : "min-w-0"}>
              <h1 className="text-sm font-bold tracking-wide text-white">MSWD Management System</h1>
              <p className="mt-1 text-[10px] leading-relaxed text-blue-100">Municipal Social Welfare and Development Office</p>
            </div>
          </div>
        </div>

        <div className={`hidden border-b border-white/10 px-3 py-2 lg:flex ${collapsed ? "justify-center" : "justify-end"}`}>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
            title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD21F]"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden="true" /> : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>

        <nav className={`flex-1 overflow-x-hidden overflow-y-auto py-4 ${collapsedForDisplay ? "px-2" : "px-3"}`}>
          <NavLinks
            sections={sections}
            collapsed={collapsedForDisplay}
            onNavigate={() => setMobileOpen(false)}
            className="space-y-1"
            activeClassName="!bg-[#FFD21F] !text-[#073783] font-semibold hover:!bg-[#ffe05a]"
          />
          <div className={`mt-6 border-t border-white/15 pt-4 ${collapsed ? "px-0" : ""}`}>
            <form action={logoutAction}>
              <button
                type="submit"
                title={collapsedForDisplay ? "Logout" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-sky-100 transition hover:bg-white/10 ${
                  collapsedForDisplay ? "justify-center px-2" : ""
                }`}
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className={collapsedForDisplay ? "sr-only" : ""}>Logout</span>
              </button>
            </form>
          </div>
        </nav>

        <div className={`border-t border-white/15 px-4 py-4 text-center ${collapsed ? "lg:px-2" : ""}`}>
          <div className="mb-3 flex h-1 overflow-hidden rounded-full" aria-hidden="true">
            <span className="w-1/3 bg-[#FFD21F]" />
            <span className="w-1/3 bg-[#E31837]" />
            <span className="w-1/3 bg-white" />
          </div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-blue-100">{collapsedForDisplay ? "MSWD" : "Mahayag • MSWD"}</p>
          {!collapsedForDisplay && (
            <>
              <p className="mt-1 text-[11px] font-medium text-white">{municipality}</p>
              <p className="mt-2 text-[9px] leading-relaxed text-blue-100/80">Sa Tamang Serbisyo, Mas Matatag na Komunidad.</p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
