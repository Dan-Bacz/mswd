"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, ClipboardCheck, Layers3, Users } from "lucide-react";

export function AdminDashboardAnalytics({ beneficiaries, assistanceRecords, categories, periodLabel }: {
  beneficiaries: number;
  assistanceRecords: number;
  categories: { name: string; beneficiaries: number; color: string }[];
  periodLabel: string;
}) {
  const metrics = [
    { label: "Total beneficiaries", value: beneficiaries, hint: `${periodLabel} registered records`, icon: Users, tone: "blue" },
    { label: "Assistance records", value: assistanceRecords, hint: `${periodLabel} service transactions`, icon: ClipboardCheck, tone: "violet" },
    { label: "Programs tracked", value: categories.length, hint: "Configured MSWD categories", icon: Layers3, tone: "gold" },
    { label: "Reporting view", value: periodLabel, hint: "Dashboard filter currently applied", icon: BarChart3, tone: "green" },
  ] as const;

  return <section className="space-y-5" aria-label="Administrator analytics">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, hint, icon: Icon, tone }) => <article key={label} className={`dashboard-3d-card dashboard-3d-${tone} relative overflow-hidden rounded-2xl border p-5`}><span className="dashboard-orb absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-60" /><div className="relative flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-3 truncate text-3xl font-black tracking-tight text-[#0B1C3A]">{typeof value === "number" ? value.toLocaleString() : value}</p><p className="mt-2 text-xs text-slate-500">{hint}</p></div><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[#0B4599] shadow-[0_8px_18px_-10px_rgba(7,55,131,0.8)]"><Icon className="h-5 w-5" /></span></div></article>)}</div>
    <article className="dashboard-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(9,44,92,0.45)] sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B4599]">Program performance</p><h2 className="mt-1 text-lg font-bold text-[#0B1C3A]">Beneficiaries by category</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0B4599]">{periodLabel}</span></div><div className="mt-5 h-[260px] min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={categories} margin={{ top: 8, right: 8, left: -18, bottom: 30 }}><CartesianGrid vertical={false} stroke="#E6EDF7" /><XAxis dataKey="name" angle={-22} textAnchor="end" interval={0} height={55} tick={{ fontSize: 10, fill: "#6480A9" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6480A9" }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#F5F8FC" }} contentStyle={{ borderRadius: 12, border: "1px solid #DCE7F5", boxShadow: "0 12px 24px rgba(9,44,92,.12)" }} /><Bar dataKey="beneficiaries" name="Beneficiaries" fill="#0B68C5" radius={[8, 8, 0, 0]} barSize={30} /></BarChart></ResponsiveContainer></div></article>
  </section>;
}
