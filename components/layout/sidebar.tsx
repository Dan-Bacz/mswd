import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";
import { beneficiaryIntakeHref } from "@/lib/utils";
import type { NavSection } from "@/components/layout/nav-links";
import { SidebarNavigation } from "@/components/layout/sidebar-navigation";

const adminSections: NavSection[] = [
  {
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/admin/categories", label: "Programs & Services", icon: "categories" },
      { href: "/admin/reports", label: "Reports", icon: "reports" },
      { href: "/admin/beneficiaries", label: "Beneficiaries", icon: "beneficiaries" },
      { href: "/admin/membership", label: "Membership Form", icon: "membership" },
      { href: "/admin/assistance", label: "Assistance", icon: "assistance" },
      { href: "/admin/officers", label: "Officers", icon: "users" },
      { href: "/admin/notifications", label: "Notifications", icon: "notifications" },
      { href: "/admin/settings", label: "Settings", icon: "settings" },
      { href: "/admin/settings#backup-recovery", label: "Backup & Recovery", icon: "backup" },
    ],
  },
];

export async function Sidebar({ role }: { role: "ADMIN" | "OFFICER" }) {
  const [settings, currentUser] = await Promise.all([
    db.systemSetting.findMany({
      select: { key: true, value: true },
    }),
    role === "OFFICER" ? getCurrentUser() : Promise.resolve(null),
  ]);

  const municipality =
    settings.find((setting) => ["municipality", "municipality_name", "municipal_name", "local_government_unit"].includes(setting.key.toLowerCase()))?.value ??
    "Municipal Government";

  let sections = adminSections;
  if (role === "OFFICER") {
    const assignedCategories = currentUser
      ? await db.category.findMany({
          where: { id: { in: currentUser.categoryIds } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [];

    sections = [
      {
        items: [
          { href: "/officer/dashboard", label: "Dashboard", icon: "dashboard" },
          { href: "/officer/beneficiaries", label: "Beneficiaries", icon: "beneficiaries" },
          { href: "/officer/membership", label: "Membership Form", icon: "membership" },
          { href: "/officer/assistance", label: "Assistance", icon: "assistance" },
          { href: "/officer/reports", label: "Reports", icon: "reports" },
          { href: "/officer/notifications", label: "Notifications", icon: "notifications" },
          { href: "/officer/profile", label: "My Profile", icon: "profile" },
        ],
      },
      {
        title: "My Categories",
        items: assignedCategories.map((category) => ({
          href: `/officer/beneficiaries?categoryId=${encodeURIComponent(category.id)}`,
          label: category.name,
          icon: "categories" as const,
          children: [
            {
              href: `/officer/beneficiaries?categoryId=${encodeURIComponent(category.id)}`,
              label: "View beneficiaries",
              icon: "view" as const,
            },
            {
              href: beneficiaryIntakeHref(category.name, category.id, "officer"),
              label: "Add beneficiary",
              icon: "add" as const,
            },
          ],
        })),
      },
    ];
  }

  return <SidebarNavigation municipality={municipality} sections={sections} />;
}
