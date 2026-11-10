import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, UserRound, ScrollText } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { SystemLogIcon, SystemSettingsPanel } from "@/components/admin/system-settings-panel";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(value);
}

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const [settings, profile, logs] = await Promise.all([
    db.systemSetting.findMany({ select: { key: true, value: true } }),
    db.userProfile.findUnique({ where: { userId: admin.id }, select: { photoContent: true, address: true, contactNumber: true } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { name: true } } } }),
  ]);
  const maintenanceMode = settings.find((setting) => setting.key === "maintenance_mode")?.value === "true";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-2xl border border-[#D9E5F5] bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A88724]">Administration</p>
        <h1 className="mt-2 text-3xl font-bold text-[#102A4C]">System settings</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">Manage system availability, secure backups, administrator profile details, and accountability records.</p>
        <nav className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4" aria-label="Settings sections">
          <a href="#system-controls" className="rounded-lg bg-[#EEF4FF] px-3 py-2 text-xs font-semibold text-[#0B4599]">System controls</a>
          <a href="#backup-recovery" className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Backup &amp; recovery</a>
          <a href="#system-logs" className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">System logs</a>
        </nav>
      </header>

      <section id="system-controls" className="grid gap-5 lg:grid-cols-[1fr_330px]">
        <SystemSettingsPanel maintenanceMode={maintenanceMode} />
        <aside id="admin-profile" className="rounded-2xl border border-[#D9E5F5] bg-[#082B59] p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><ShieldCheck className="h-5 w-5 text-[#FFD21F]" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">Administrator access</p><h2 className="mt-1 text-lg font-bold">System owner profile</h2></div></div>
          <div className="mt-6 flex items-center gap-3"><span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-xl font-bold text-[#0B4599]">{profile?.photoContent ? <Image src="/api/profile/photo" alt="Administrator profile" fill unoptimized className="object-cover" /> : <UserRound className="h-7 w-7" />}</span><div className="min-w-0"><p className="truncate font-semibold">{admin.name}</p><p className="truncate text-xs text-blue-200">{admin.email}</p></div></div>
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-blue-100"><p><span className="text-blue-300">Contact:</span> {profile?.contactNumber || "Not recorded"}</p><p><span className="text-blue-300">Address:</span> {profile?.address || "Not recorded"}</p></div>
          <Link href="#admin-profile" className="mt-5 inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold text-[#082B59] hover:bg-blue-50">View admin profile</Link>
        </aside>
      </section>

      <section id="system-logs" className="overflow-hidden rounded-2xl border border-[#D9E5F5] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><ScrollText className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-[#102A4C]">System logs</h2><p className="mt-1 text-xs text-slate-500">Recent administrative and system activity.</p></div></div>
        {logs.length ? <div className="divide-y divide-slate-100">{logs.map((log) => <div key={log.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 rounded-lg bg-[#EEF4FF] p-2 text-[#0B4599]"><SystemLogIcon /></span><div className="min-w-0"><p className="text-sm font-semibold text-[#173B70]">{log.action} <span className="font-normal text-slate-500">in {log.module}</span></p><p className="mt-1 truncate text-xs text-slate-500">{log.description}</p></div></div><p className="shrink-0 text-xs text-slate-400">{formatDate(log.createdAt)} · {log.user?.name ?? "System"}</p></div>)}</div> : <p className="p-6 text-sm text-slate-500">No system activity has been recorded yet.</p>}
      </section>
    </div>
  );
}
