"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CalendarRange, ClipboardList, FileDown, Sparkles, UsersRound, WalletCards } from "lucide-react";
import {
  ASSISTANCE_OUTCOME_LABELS,
  ASSISTANCE_TYPE_LABELS,
} from "@/lib/assistance";
import type { ReportDateRange } from "@/lib/reporting";

type BeneficiaryReportRow = {
  beneficiaryNumber: string;
  fullName: string;
  registrationDate: string;
  categoryName: string;
  barangay: string;
  status: string;
};

type AssistanceReportRow = {
  referenceNumber: string;
  type: keyof typeof ASSISTANCE_TYPE_LABELS;
  otherType: string;
  visitDate: string;
  outcome: keyof typeof ASSISTANCE_OUTCOME_LABELS;
  purpose: string;
  requestedDescription: string;
  providedDescription: string;
  medicineCount: number | null;
  medicineQuantity: number | null;
  providerName: string;
  doctorName: string;
  financialAmount: number | null;
  financialType: string;
  transactionDetails: string;
  providedAt: string;
  notProvidedReason: string;
  referralDetails: string;
  followUpReason: string;
  followUpNotes: string;
  internalRemarks: string;
  staffId: string;
  staffName: string;
  beneficiaryNumber: string;
  beneficiaryName: string;
  categoryName: string;
};

type Period = "day" | "week" | "month" | "year";
const periodOptions: Period[] = ["day", "week", "month", "year"];
type SummaryRow = { key: string; label: string; count: number };
type AssistanceSummaryRow = SummaryRow & {
  type: keyof typeof ASSISTANCE_TYPE_LABELS;
  typeLabel: string;
};

const periodLabels: Record<Period, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
};

function getPeriodKey(dateValue: string, period: Period) {
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00.000Z`);
  if (period === "day") return dateValue.slice(0, 10);
  if (period === "year") return dateValue.slice(0, 4);
  if (period === "month") return dateValue.slice(0, 7);
  const monday = new Date(date);
  const weekday = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - weekday);
  return monday.toISOString().slice(0, 10);
}

function formatPeriod(key: string, period: Period) {
  if (period === "year") return key;
  if (period === "month") {
    const date = new Date(`${key}-01T00:00:00.000Z`);
    return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  }
  const date = new Date(`${key}T00:00:00.000Z`);
  const label = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return period === "week" ? `Week of ${label}` : label;
}

function groupBeneficiaries(rows: BeneficiaryReportRow[], period: Period): SummaryRow[] {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const key = getPeriodKey(row.registrationDate, period);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return [...groups]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => ({ key, label: formatPeriod(key, period), count }));
}

function groupAssistance(rows: AssistanceReportRow[], period: Period): AssistanceSummaryRow[] {
  const groups = new Map<string, AssistanceSummaryRow>();
  for (const row of rows) {
    const key = getPeriodKey(row.visitDate, period);
    const typeLabel = row.type === "OTHER" && row.otherType
      ? `Other: ${row.otherType}`
      : ASSISTANCE_TYPE_LABELS[row.type];
    const groupKey = `${key}|${typeLabel}`;
    const group = groups.get(groupKey);
    if (group) {
      group.count += 1;
    } else {
      groups.set(groupKey, {
        key,
        label: formatPeriod(key, period),
        count: 1,
        type: row.type,
        typeLabel,
      });
    }
  }
  return [...groups.values()].sort(
    (left, right) =>
      left.key.localeCompare(right.key) ||
      left.typeLabel.localeCompare(right.typeLabel),
  );
}

function csvCell(value: string | number) {
  let normalized = String(value);
  if (/^[\t\r ]*[=+\-@]/.test(normalized)) normalized = `'${normalized}`;
  return `"${normalized.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isPeriod(value: string): value is Period {
  return value === "day" || value === "week" || value === "month" || value === "year";
}

function assistanceDetail(row: AssistanceReportRow) {
  const details = [
    row.financialAmount === null ? "" : `Amount: ₱${row.financialAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    row.medicineCount === null && row.medicineQuantity === null ? "" : `Quantity: ${row.medicineCount ?? row.medicineQuantity}`,
    row.providerName ? `Provider: ${row.providerName}` : "",
    row.doctorName ? `Doctor: ${row.doctorName}` : "",
    row.financialType ? `Type: ${row.financialType}` : "",
    row.transactionDetails,
    row.providedDescription || row.requestedDescription,
  ].filter(Boolean);
  return details.join(" · ") || "No additional details recorded";
}

export function ReportBuilder({
  dateRange,
  beneficiaries,
  assistance,
  officerName,
  generatedAt,
}: {
  dateRange: ReportDateRange;
  beneficiaries: BeneficiaryReportRow[];
  assistance: AssistanceReportRow[];
  officerName?: string;
  generatedAt: string;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [assistanceType, setAssistanceType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [staffFilter, setStaffFilter] = useState("ALL");
  const reportCategories = useMemo(() => [...new Set(assistance.map((row) => row.categoryName))].sort(), [assistance]);
  const reportStaff = useMemo(() => [...new Set(assistance.map((row) => row.staffName))].sort(), [assistance]);
  const membershipSummary = useMemo(
    () => groupBeneficiaries(beneficiaries, period),
    [beneficiaries, period],
  );
  const filteredAssistance = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return assistance.filter((row) => {
      const matchesType = assistanceType === "ALL" || row.type === assistanceType;
      const matchesCategory = categoryFilter === "ALL" || row.categoryName === categoryFilter;
      const matchesStaff = staffFilter === "ALL" || row.staffName === staffFilter;
      const searchable = [row.beneficiaryName, row.beneficiaryNumber, row.categoryName, row.staffName, row.referenceNumber, row.otherType, row.providerName, row.doctorName, row.providedDescription].join(" ").toLowerCase();
      return matchesType && matchesCategory && matchesStaff && (!normalized || searchable.includes(normalized));
    });
  }, [assistance, assistanceType, categoryFilter, search, staffFilter]);
  const assistanceSummary = useMemo(
    () => groupAssistance(filteredAssistance, period),
    [filteredAssistance, period],
  );
  const selectedAssistanceTotal = filteredAssistance.reduce((total, row) => total + (row.financialAmount ?? 0), 0);
  const providedCount = filteredAssistance.filter((row) => row.outcome === "PROVIDED").length;
  const uniqueBeneficiaryCount = new Set(filteredAssistance.map((row) => row.beneficiaryNumber)).size;
  const selectedTypeLabel = assistanceType === "ALL" ? "All assistance types" : ASSISTANCE_TYPE_LABELS[assistanceType as keyof typeof ASSISTANCE_TYPE_LABELS];
  const typeAnalytics = useMemo(() => Object.entries(ASSISTANCE_TYPE_LABELS).map(([type, label]) => ({
    type,
    label: label.replace(" Assistance", ""),
    count: assistance.filter((row) => row.type === type).length,
  })).filter((row) => row.count > 0).sort((left, right) => right.count - left.count), [assistance]);
  const periodAnalytics = useMemo(() => {
    const groups = new Map<string, { label: string; records: number; amount: number }>();
    for (const row of filteredAssistance) {
      const key = getPeriodKey(row.visitDate, period);
      const group = groups.get(key) ?? { label: formatPeriod(key, period), records: 0, amount: 0 };
      group.records += 1;
      group.amount += row.financialAmount ?? 0;
      groups.set(key, group);
    }
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, value]) => value);
  }, [filteredAssistance, period]);
  const qualifier = officerName ? ` - ${officerName}` : "";
  const filenameRange = `${dateRange.startDate}_to_${dateRange.endDate}`;

  function exportBeneficiaries() {
    downloadCsv(`beneficiary-memberships-${filenameRange}.csv`, [
      [`Membership summary by ${periodLabels[period]}`],
      [periodLabels[period], "New beneficiaries"],
      ...membershipSummary.map((row) => [row.label, row.count]),
      [],
      ["Beneficiary membership details"],
      ["Beneficiary ID", "Full name", "Membership date", "Category", "Barangay", "Status"],
      ...beneficiaries.map((row) => [
        row.beneficiaryNumber,
        row.fullName,
        row.registrationDate,
        row.categoryName,
        row.barangay,
        row.status,
      ]),
    ]);
  }

  function exportAssistance() {
    downloadCsv(`assistance-report-${filenameRange}.csv`, [
      [`Assistance summary by ${periodLabels[period]}`],
      [periodLabels[period], "Assistance type", "Applications / records"],
      ...assistanceSummary.map((row) => [row.label, row.typeLabel, row.count]),
      [],
      ["Assistance record details"],
      ["Reference", "Visit date", "Assistance type", "Other type", "Beneficiary ID", "Beneficiary", "Category", "Assigned staff", "Outcome", "Financial amount", "Medicine quantity", "Provider / doctor", "Details"],
      ...filteredAssistance.map((row) => [
        row.referenceNumber,
        row.visitDate,
        ASSISTANCE_TYPE_LABELS[row.type],
        row.otherType,
        row.beneficiaryNumber,
        row.beneficiaryName,
        row.categoryName,
        row.staffName,
        ASSISTANCE_OUTCOME_LABELS[row.outcome],
        row.financialAmount ?? "",
        row.medicineCount ?? row.medicineQuantity ?? "",
        row.providerName || row.doctorName,
        row.providedDescription || row.requestedDescription,
      ]),
    ]);
  }

  return (
    <div className="space-y-7">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#071C3A] px-6 py-7 text-white shadow-[0_28px_70px_-35px_rgba(7,28,58,0.9)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#0B68C5]/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFD21F]"><Sparkles className="h-3.5 w-3.5" /> MSWD intelligence center</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Reports &amp; analytics</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80">A clear operational view of beneficiary reach and assistance delivery{officerName ? " for your assigned workspace" : " across the municipal office"}.</p></div>
          <button type="button" onClick={() => window.print()} className="print:hidden inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"><FileDown className="h-4 w-4" /> Print / Save PDF</button>
        </div>
        <div className="relative mt-7 grid gap-3 border-t border-white/10 pt-5 text-xs text-blue-100/75 sm:grid-cols-3"><span className="inline-flex items-center gap-2"><CalendarRange className="h-4 w-4 text-[#FFD21F]" /> {dateRange.startDate} – {dateRange.endDate}</span><span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#FFD21F]" /> {selectedTypeLabel}</span><span className="inline-flex items-center gap-2 sm:justify-end"><ArrowUpRight className="h-4 w-4 text-[#FFD21F]" /> Live database report</span></div>
      </header>

      <form method="get" className="print:hidden flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          From
          <input className="h-10 rounded-lg border border-slate-300 px-3" type="date" name="startDate" defaultValue={dateRange.startDate} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          To
          <input className="h-10 rounded-lg border border-slate-300 px-3" type="date" name="endDate" defaultValue={dateRange.endDate} />
        </label>
        <button type="submit" className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Apply dates
        </button>
        <label className="ml-auto grid gap-1 text-sm font-medium text-slate-700">
          Group by
          <select
            className="h-10 rounded-lg border border-slate-300 px-3"
            value={period}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (isPeriod(value)) setPeriod(value);
            }}
          >
            {periodOptions.map((value) => (
              <option key={value} value={value}>{periodLabels[value]}</option>
            ))}
          </select>
        </label>
      </form>

      <section className="print:hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-35px_rgba(9,44,92,0.7)]" aria-label="Report filters">
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(220px,1fr)]">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Type of Assistance<select value={assistanceType} onChange={(event) => setAssistanceType(event.currentTarget.value)} className="h-12 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-semibold normal-case tracking-normal text-[#0B1A3E] outline-none focus:border-[#0B68C5] focus:ring-4 focus:ring-blue-100"><option value="ALL">All assistance types</option>{Object.entries(ASSISTANCE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Search reports<input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Beneficiary, staff, reference, provider..." className="h-12 rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#0B68C5] focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm font-medium text-slate-700">Search records<input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Beneficiary, staff, reference..." className="h-10 w-full min-w-64 rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.currentTarget.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option value="ALL">All categories</option>{reportCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">Staff<select value={staffFilter} onChange={(event) => setStaffFilter(event.currentTarget.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option value="ALL">All staff</option>{reportStaff.map((staff) => <option key={staff} value={staff}>{staff}</option>)}</select></label>
          <div className="ml-auto flex flex-wrap gap-2 text-sm"><span className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800">{filteredAssistance.length} transactions</span><span className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-800">₱{selectedAssistanceTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })} total amount</span></div>
        </div>
      </section>

      <section className="print:hidden grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
        <ReportKpi icon={<ClipboardList />} label="Assistance records" value={filteredAssistance.length.toLocaleString()} note={selectedTypeLabel} tone="blue" />
        <ReportKpi icon={<UsersRound />} label="Beneficiaries served" value={uniqueBeneficiaryCount.toLocaleString()} note="Unique clients in view" tone="violet" />
        <ReportKpi icon={<WalletCards />} label="Financial assistance" value={`₱${selectedAssistanceTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} note="Recorded monetary amount" tone="gold" />
        <ReportKpi icon={<ArrowUpRight />} label="Provided" value={providedCount.toLocaleString()} note="Successful assistance outcomes" tone="green" />
      </section>

      <section className="print:hidden grid gap-5 xl:grid-cols-[1.45fr_0.95fr]" aria-label="Report analytics">
        <div className="dashboard-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_50px_-35px_rgba(9,44,92,0.7)] sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B4599]">Activity trend</p><h2 className="mt-1 text-xl font-bold text-[#0B1A3E]">Assistance delivery over time</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Grouped by {periodLabels[period]}</span></div><div className="mt-5 h-[265px] min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={periodAnalytics} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E8EEF7" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6480A9" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6480A9" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #DCE7F5", boxShadow: "0 18px 35px rgba(9,44,92,.14)" }} /><Bar dataKey="records" name="Assistance records" fill="#0B68C5" radius={[8, 8, 2, 2]} barSize={28} /></BarChart></ResponsiveContainer></div></div>
        <div className="dashboard-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_50px_-35px_rgba(9,44,92,0.7)] sm:p-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B4599]">Service mix</p><h2 className="mt-1 text-xl font-bold text-[#0B1A3E]">Records by assistance type</h2></div><div className="mt-5 h-[265px] min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={typeAnalytics} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#E8EEF7" /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="label" width={105} tick={{ fontSize: 10, fill: "#405B80" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #DCE7F5" }} /><Bar dataKey="count" name="Records" radius={[0, 8, 8, 0]} barSize={20}>{typeAnalytics.map((entry, index) => <Cell key={entry.type} fill={index % 2 ? "#C9A93F" : "#0B68C5"} />)}</Bar></BarChart></ResponsiveContainer></div></div>
      </section>

      <div className="report-print-document space-y-8">
        <div className="hidden print:block">
          <h1 className="text-2xl font-bold">Mahayag MSWD Reports{qualifier}</h1>
          <p className="mt-1 text-sm">Reporting period: {dateRange.startDate} to {dateRange.endDate}</p>
          <p className="text-sm">Generated: {generatedAt}</p>
        </div>

        <section aria-labelledby="membership-report-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="membership-report-heading" className="text-xl font-bold text-slate-900">Beneficiary membership report</h2>
              <p className="text-sm text-slate-600">{beneficiaries.length.toLocaleString()} new members in selected date range</p>
            </div>
            <button type="button" onClick={exportBeneficiaries} className="print:hidden rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Export beneficiary CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr><th className="px-4 py-3">{periodLabels[period]}</th><th className="px-4 py-3 text-right">New beneficiaries</th></tr>
              </thead>
              <tbody>
                {membershipSummary.length ? membershipSummary.map((row) => (
                  <tr key={row.key} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.label}</td><td className="px-4 py-3 text-right font-semibold">{row.count}</td>
                  </tr>
                )) : <EmptyRow columns={2} />}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Member ID</th><th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Membership date</th><th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Barangay</th><th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.length ? beneficiaries.map((row) => (
                  <tr key={row.beneficiaryNumber} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.beneficiaryNumber}</td><td className="px-4 py-3">{row.fullName}</td>
                    <td className="px-4 py-3">{displayDate(row.registrationDate)}</td><td className="px-4 py-3">{row.categoryName}</td>
                    <td className="px-4 py-3">{row.barangay || "—"}</td><td className="px-4 py-3">{row.status}</td>
                  </tr>
                )) : <EmptyRow columns={6} />}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="assistance-report-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="assistance-report-heading" className="text-xl font-bold text-slate-900">Assistance activity report</h2>
              <p className="text-sm text-slate-600">{filteredAssistance.length.toLocaleString()} assistance records in selected date range</p>
            </div>
            <button type="button" onClick={exportAssistance} className="print:hidden rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Export assistance CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">{periodLabels[period]}</th><th className="px-4 py-3">Assistance type</th>
                  <th className="px-4 py-3 text-right">Applications / records</th>
                </tr>
              </thead>
              <tbody>
                {assistanceSummary.length ? assistanceSummary.map((row) => (
                  <tr key={`${row.key}-${row.typeLabel}`} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.label}</td><td className="px-4 py-3">{row.typeLabel}</td>
                    <td className="px-4 py-3 text-right font-semibold">{row.count}</td>
                  </tr>
                )) : <EmptyRow columns={3} />}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Reference</th><th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Assistance type</th><th className="px-4 py-3">Beneficiary / category</th>
                  <th className="px-4 py-3">Assigned staff</th><th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Amount</th><th className="px-4 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssistance.length ? filteredAssistance.map((row) => (
                  <tr key={row.referenceNumber} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.referenceNumber}</td><td className="px-4 py-3">{displayDate(row.visitDate)}</td>
                    <td className="px-4 py-3">{row.type === "OTHER" && row.otherType ? row.otherType : ASSISTANCE_TYPE_LABELS[row.type]}</td>
                    <td className="px-4 py-3"><span className="font-semibold">{row.beneficiaryName}</span><span className="block text-xs text-slate-500">{row.beneficiaryNumber} · {row.categoryName}</span></td>
                    <td className="px-4 py-3">{row.staffName}</td>
                    <td className="max-w-72 px-4 py-3 text-xs text-slate-600">{assistanceDetail(row)}</td>
                    <td className="px-4 py-3">{row.financialAmount === null ? "—" : `₱${row.financialAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}</td>
                    <td className="px-4 py-3">{ASSISTANCE_OUTCOME_LABELS[row.outcome]}</td>
                  </tr>
                )) : <EmptyRow columns={8} />}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function EmptyRow({ columns }: { columns: number }) {
  return (
    <tr>
      <td className="px-4 py-5 text-center text-slate-500" colSpan={columns}>
        No records found for this date range.
      </td>
    </tr>
  );
}

function ReportKpi({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone: "blue" | "violet" | "gold" | "green" }) {
  const tones = {
    blue: "border-blue-200 bg-gradient-to-br from-white to-blue-50 text-blue-700",
    violet: "border-violet-200 bg-gradient-to-br from-white to-violet-50 text-violet-700",
    gold: "border-amber-200 bg-gradient-to-br from-white to-amber-50 text-amber-700",
    green: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50 text-emerald-700",
  };
  return <article className={`dashboard-3d-card relative overflow-hidden rounded-2xl border p-5 shadow-[0_22px_42px_-32px_rgba(9,44,92,0.7)] ${tones[tone]}`}><div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-current opacity-[0.07] blur-xl" /><div className="relative flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm [&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">Live</span></div><p className="relative mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="relative mt-1 text-2xl font-black tracking-tight text-[#0B1A3E]">{value}</p><p className="relative mt-1 text-xs font-medium text-slate-500">{note}</p></article>;
}
