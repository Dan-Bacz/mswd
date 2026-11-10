"use client";

import { useActionState } from "react";
import { DatabaseBackup, Download, History, LoaderCircle, ShieldCheck, Upload, Wrench } from "lucide-react";
import { setMaintenanceModeAction, type MaintenanceActionState } from "@/app/actions/system";

const initialState: MaintenanceActionState = { ok: true, message: "" };

export function SystemSettingsPanel({ maintenanceMode }: { maintenanceMode: boolean }) {
  const [state, formAction, pending] = useActionState(setMaintenanceModeAction, initialState);

  return (
    <div className="space-y-5">
      {state.message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.message}</p>}

      <section className="rounded-2xl border border-[#D9E5F5] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Wrench className="h-5 w-5" /></span>
            <div><h2 className="text-lg font-bold text-[#102A4C]">Maintenance mode</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Show a clear maintenance notice in the officer workspace while administrators perform system work. Admin access remains available.</p></div>
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${maintenanceMode ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{maintenanceMode ? "Notice active" : "System online"}</span>
        </div>
        <form action={formAction} className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <input type="hidden" name="maintenanceMode" value={String(!maintenanceMode)} />
          <button type="submit" disabled={pending} className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${maintenanceMode ? "bg-emerald-700 hover:bg-emerald-800" : "bg-amber-600 hover:bg-amber-700"}`}>
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
            {maintenanceMode ? "Turn off maintenance notice" : "Turn on maintenance notice"}
          </button>
          <p className="text-xs text-slate-500">Officers will see “System is under maintenance” in their header.</p>
        </form>
      </section>

      <section id="backup-recovery" className="rounded-2xl border border-[#D9E5F5] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><DatabaseBackup className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-[#102A4C]">Backup &amp; recovery</h2><p className="mt-1 text-sm text-slate-500">Download a protected JSON backup of system configuration, categories, beneficiaries, assistance records, and audit history.</p></div></div>
        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <a href="/api/admin/backup" download className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0B4599] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#073783]"><Download className="h-4 w-4" />Download backup</a>
          <form action="/api/admin/backup" method="post" encType="multipart/form-data" onSubmit={(event) => { if (!window.confirm("Restore system settings and program definitions from this backup? Existing beneficiary and assistance records will not be changed.")) event.preventDefault(); }} className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#DCE3EE] px-3 text-sm font-semibold text-[#405B80] hover:bg-[#F4F7FB]"><Upload className="h-4 w-4" />Choose backup<input type="file" name="backup" accept="application/json,.json" required className="sr-only" /></label>
            <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-700 px-4 text-sm font-semibold text-white hover:bg-slate-800"><DatabaseBackup className="h-4 w-4" />Restore</button>
          </form>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Recovery restores system settings and program definitions only. Beneficiary and assistance records are intentionally protected from overwrite. Passwords and raw authentication secrets are never included.</p>
      </section>
    </div>
  );
}

export function SystemLogIcon() {
  return <History className="h-4 w-4" aria-hidden="true" />;
}
