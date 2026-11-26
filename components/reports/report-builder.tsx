"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Dialog } from "@/components/ui/dialog";
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
  itemQuantity: number | null;
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
type ReportMode = "programs" | "assistance" | "staff";
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

function downloadExcel(filename: string, sheets: { name: string; rows: (string | number)[][] }[]) {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name);
  }
  XLSX.writeFile(workbook, filename);
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
    row.purpose ? `Purpose: ${row.purpose}` : "",
    row.financialAmount === null ? "" : `Amount: ₱${row.financialAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    row.financialType ? `Financial type: ${row.financialType}` : "",
    row.medicineCount === null && row.medicineQuantity === null ? "" : `Medicine quantity: ${row.medicineQuantity ?? row.medicineCount}`,
    row.itemQuantity === null ? "" : `Items / goods quantity: ${row.itemQuantity}`,
    row.providerName ? `Provider: ${row.providerName}` : "",
    row.doctorName ? `Doctor: ${row.doctorName}` : "",
    row.providedAt ? `Date provided: ${row.providedAt}` : "",
    row.providedDescription ? `Provided: ${row.providedDescription}` : "",
    row.requestedDescription ? `Requested: ${row.requestedDescription}` : "",
    row.transactionDetails ? `Transaction: ${row.transactionDetails}` : "",
    row.referralDetails ? `Referral: ${row.referralDetails}` : "",
    row.notProvidedReason ? `Not provided: ${row.notProvidedReason}` : "",
    row.followUpReason ? `Follow-up reason: ${row.followUpReason}` : "",
    row.followUpNotes ? `Follow-up notes: ${row.followUpNotes}` : "",
    row.internalRemarks ? `Remarks: ${row.internalRemarks}` : "",
  ].filter(Boolean);
  return details.join(" · ") || "No additional details recorded";
}

export function ReportBuilder({
  dateRange,
  beneficiaries,
  assistance,
  assistanceTypes,
  staffOptions,
  officerName,
  generatedAt,
  categoryOptions,
}: {
  dateRange: ReportDateRange;
  beneficiaries: BeneficiaryReportRow[];
  assistance: AssistanceReportRow[];
  assistanceTypes: (keyof typeof ASSISTANCE_TYPE_LABELS)[];
  staffOptions: { id: string; name: string }[];
  officerName?: string;
  generatedAt: string;
  categoryOptions?: string[];
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [reportMode, setReportMode] = useState<ReportMode>("programs");
  const [assistanceType, setAssistanceType] = useState("ALL");
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [staffFilter, setStaffFilter] = useState("ALL");
  const reportCategories = useMemo(() => {
    const names = categoryOptions ?? [...new Set([...beneficiaries.map((row) => row.categoryName), ...assistance.map((row) => row.categoryName)])];
    return [...new Set(names)].sort((left, right) => left.localeCompare(right));
  }, [assistance, beneficiaries, categoryOptions]);
  const reportStaff = useMemo(() => [...new Map([...staffOptions, ...assistance.map((row) => ({ id: row.staffId, name: row.staffName }))].map((staff) => [staff.id, staff])).values()].sort((left, right) => left.name.localeCompare(right.name)), [assistance, staffOptions]);
  const filteredBeneficiaries = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return beneficiaries.filter((row) => {
      const matchesCategory = categoryFilter === "ALL" || row.categoryName === categoryFilter;
      const matchesSearch = !normalized || [row.fullName, row.beneficiaryNumber, row.categoryName, row.barangay].join(" ").toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [beneficiaries, categoryFilter, search]);
  const filteredAssistance = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return assistance.filter((row) => {
      const matchesType = assistanceType === "ALL" || row.type === assistanceType;
      const matchesCategory = categoryFilter === "ALL" || row.categoryName === categoryFilter;
      const matchesStaff = staffFilter === "ALL" || row.staffId === staffFilter || row.staffName === staffFilter;
      const searchable = [row.beneficiaryName, row.beneficiaryNumber, row.categoryName, row.staffName, row.referenceNumber, row.otherType, row.providerName, row.doctorName, row.providedDescription].join(" ").toLowerCase();
      return matchesType && matchesCategory && matchesStaff && (!normalized || searchable.includes(normalized));
    });
  }, [assistance, assistanceType, categoryFilter, search, staffFilter]);
  const reportBeneficiaries = useMemo(() => {
    if (reportMode !== "staff") return filteredBeneficiaries;
    const handledBeneficiaryNumbers = new Set(filteredAssistance.map((row) => row.beneficiaryNumber));
    return filteredBeneficiaries.filter((row) => handledBeneficiaryNumbers.has(row.beneficiaryNumber));
  }, [filteredAssistance, filteredBeneficiaries, reportMode]);
  const membershipSummary = useMemo(
    () => groupBeneficiaries(reportBeneficiaries, period),
    [period, reportBeneficiaries],
  );
  const assistanceSummary = useMemo(
    () => groupAssistance(filteredAssistance, period),
    [filteredAssistance, period],
  );
  const selectedAssistanceTotal = filteredAssistance.reduce((total, row) => total + (row.financialAmount ?? 0), 0);
  const providedCount = filteredAssistance.filter((row) => row.outcome === "PROVIDED").length;
  const uniqueBeneficiaryCount = new Set(filteredAssistance.map((row) => row.beneficiaryNumber)).size;
  const selectedTypeLabel = assistanceType === "ALL" ? "All assistance types" : ASSISTANCE_TYPE_LABELS[assistanceType as keyof typeof ASSISTANCE_TYPE_LABELS];
  const medicineQuantityTotal = filteredAssistance.reduce((total, row) => total + (row.medicineQuantity ?? row.medicineCount ?? 0), 0);
  const itemQuantityTotal = filteredAssistance.reduce((total, row) => total + (row.itemQuantity ?? 0), 0);
  const assistanceBreakdown = useMemo(() => {
    const groups = new Map<string, { transactions: number; quantity: number }>();
    for (const row of filteredAssistance) {
      const description = row.providedDescription || row.requestedDescription || row.otherType || "Description not recorded";
      const group = groups.get(description) ?? { transactions: 0, quantity: 0 };
      group.transactions += 1;
      group.quantity += row.type === "MEDICAL_ASSISTANCE"
        ? row.medicineQuantity ?? row.medicineCount ?? 0
        : row.itemQuantity ?? 0;
      groups.set(description, group);
    }
    return [...groups.entries()].sort((left, right) => right[1].transactions - left[1].transactions);
  }, [filteredAssistance]);
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
  const assistanceDetails = filteredAssistance.map((row) => [
    row.referenceNumber,
    row.visitDate,
    row.providedAt,
    ASSISTANCE_TYPE_LABELS[row.type],
    row.otherType,
    row.beneficiaryNumber,
    row.beneficiaryName,
    row.categoryName,
    row.staffName,
    ASSISTANCE_OUTCOME_LABELS[row.outcome],
    row.purpose,
    row.requestedDescription,
    row.providedDescription,
    row.financialAmount ?? "",
    row.financialType,
    row.medicineCount ?? "",
    row.medicineQuantity ?? "",
    row.itemQuantity ?? "",
    row.providerName,
    row.doctorName,
    row.transactionDetails,
    row.notProvidedReason,
    row.referralDetails,
    row.followUpReason,
    row.followUpNotes,
    row.internalRemarks,
  ]);
  const assistanceDetailHeaders = ["Reference", "Visit date", "Date provided", "Assistance type", "Other type", "Beneficiary ID", "Beneficiary", "Category", "Assigned staff", "Outcome", "Purpose", "Requested details", "Provided details", "Financial amount", "Financial type", "Medicine count", "Medicine quantity", "Items / goods quantity", "Provider", "Doctor", "Transaction details", "Not provided reason", "Referral details", "Follow-up reason", "Follow-up notes", "Internal remarks"];

  function exportBeneficiaries() {
    downloadCsv(`beneficiary-memberships-${filenameRange}.csv`, [
      [`Membership summary by ${periodLabels[period]}`],
      [periodLabels[period], "New beneficiaries"],
      ...membershipSummary.map((row) => [row.label, row.count]),
      [],
      ["Beneficiary membership details"],
      ["Beneficiary ID", "Full name", "Membership date", "Category", "Barangay", "Status"],
      ...reportBeneficiaries.map((row) => [
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
      ["Selected assistance type", selectedTypeLabel],
      ["Reporting period", `${dateRange.startDate} to ${dateRange.endDate}`],
      ["Unique beneficiaries assisted", uniqueBeneficiaryCount],
      ["Total assistance transactions", filteredAssistance.length],
      ["Financial assistance distributed", selectedAssistanceTotal],
      ["Medicine quantity distributed", medicineQuantityTotal],
      ["Items / goods quantity distributed", itemQuantityTotal],
      [],
      ["Description breakdown", "Transactions", "Medicine quantity"],
      ...assistanceBreakdown.map(([description, totals]) => [description, totals.transactions, totals.quantity]),
      [],
      [periodLabels[period], "Assistance type", "Applications / records"],
      ...assistanceSummary.map((row) => [row.label, row.typeLabel, row.count]),
      [],
      ["Assistance record details"],
      assistanceDetailHeaders,
      ...assistanceDetails,
    ]);
  }

  function exportAssistanceExcel() {
    downloadExcel(`assistance-report-${filenameRange}.xlsx`, [
      {
        name: "Summary",
        rows: [
          ["Assistance report summary"],
          ["Assistance type", selectedTypeLabel],
          ["Reporting period", `${dateRange.startDate} to ${dateRange.endDate}`],
          ["Unique beneficiaries assisted", uniqueBeneficiaryCount],
          ["Total assistance transactions", filteredAssistance.length],
          ["Financial assistance distributed", selectedAssistanceTotal],
          ["Medicine quantity distributed", medicineQuantityTotal],
          ["Items / goods quantity distributed", itemQuantityTotal],
          [],
          [periodLabels[period], "Assistance type", "Transactions"],
          ...assistanceSummary.map((row) => [row.label, row.typeLabel, row.count]),
        ],
      },
      {
        name: "Description Breakdown",
        rows: [["Description", "Transactions", "Medicine quantity"], ...assistanceBreakdown.map(([description, totals]) => [description, totals.transactions, totals.quantity])],
      },
      {
        name: "Assistance Records",
        rows: [assistanceDetailHeaders, ...assistanceDetails],
      },
    ]);
  }

  return (
    <div className="space-y-8">
      <nav className="print:hidden grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_40px_-30px_rgba(9,44,92,0.7)] sm:grid-cols-3" aria-label="Report sections">
        {([
          ["programs", "Programs and Services", "Beneficiary registrations by category or program"],
          ["assistance", "Type of Assistance", "Assistance transactions and outcomes"],
          ["staff", "Staff", "Beneficiaries and assistance handled by staff"],
        ] as const).map(([value, label, description]) => (
          <button key={value} type="button" onClick={() => setReportMode(value)} className={`rounded-xl px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${reportMode === value ? "bg-[#0b4599] text-white shadow-md" : "text-[#0b1a3e] hover:bg-blue-50"}`} aria-pressed={reportMode === value}>
            <span className="block text-sm font-bold">{label}</span>
            <span className={`mt-1 block text-xs ${reportMode === value ? "text-blue-100" : "text-slate-500"}`}>{description}</span>
          </button>
        ))}
      </nav>
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-[#1b4d88] bg-[linear-gradient(135deg,#061a38_0%,#0b4599_58%,#0b68c5_100%)] px-6 py-7 text-white shadow-[0_28px_70px_-28px_rgba(7,28,58,0.65)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-[#ffd21f]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ffd21f]"><Sparkles className="h-3.5 w-3.5" /> MSWD intelligence center</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Reports &amp; analytics</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">A clear operational view of beneficiary reach and assistance delivery{officerName ? " for your assigned workspace" : " across the municipal office"}.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <button
              type="button"
              className="print:hidden inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white px-5 text-sm font-bold text-[#0b4599] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#fff9df] focus:outline-none focus:ring-4 focus:ring-[#ffd21f]/40"
              onClick={() => setTypeModalOpen(true)}
              aria-label="Select Type of Assistance"
            >
              <ClipboardList className="h-5 w-5" />
              {assistanceType === "ALL" ? "All Types of Assistance" : ASSISTANCE_TYPE_LABELS[assistanceType as keyof typeof ASSISTANCE_TYPE_LABELS]}
            </button>
            <button type="button" onClick={() => window.print()} className="print:hidden inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-white/20">
              <FileDown className="h-4 w-4" /> Print / Save PDF
            </button>
          </div>
        </div>
        <Dialog open={typeModalOpen} onOpenChange={setTypeModalOpen}>
          <Dialog.Title>Choose assistance type</Dialog.Title>
          <p className="-mt-2 max-w-sm text-sm leading-5 text-slate-500">Select one category to update the report summary, charts, and totals.</p>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              aria-pressed={assistanceType === "ALL"}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${assistanceType === "ALL" ? "border-[#0b4599] bg-[#0b4599] text-white shadow-md" : "border-slate-200 bg-white text-[#0b1a3e] hover:border-[#0b68c5] hover:bg-blue-50"}`}
              onClick={() => { setAssistanceType("ALL"); setTypeModalOpen(false); }}
            >
              <span className="block">All types of assistance</span>
              <span className={`mt-1 block text-xs font-medium ${assistanceType === "ALL" ? "text-blue-100" : "text-slate-500"}`}>Include every assistance category</span>
            </button>
            {assistanceTypes.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={assistanceType === value}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${assistanceType === value ? "border-[#0b4599] bg-[#0b4599] text-white shadow-md" : "border-slate-200 bg-white text-[#0b1a3e] hover:border-[#0b68c5] hover:bg-blue-50"}`}
                onClick={() => { setAssistanceType(value); setTypeModalOpen(false); }}
              >
                <span className="block">{ASSISTANCE_TYPE_LABELS[value]}</span>
                <span className={`mt-1 block text-xs font-medium ${assistanceType === value ? "text-blue-100" : "text-slate-500"}`}>Filter this report by this service</span>
              </button>
            ))}
          </div>
        </Dialog>
        <div className="relative mt-7 grid gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:grid-cols-3"><span className="inline-flex items-center gap-2"><CalendarRange className="h-4 w-4 text-[#A88724]" /> {dateRange.startDate} – {dateRange.endDate}</span><span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#A88724]" /> {selectedTypeLabel}</span><span className="inline-flex items-center gap-2 sm:justify-end"><ArrowUpRight className="h-4 w-4 text-[#A88724]" /> Live database report</span></div>
      </header>

      <form method="get" className="print:hidden flex flex-wrap items-end gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(9,44,92,0.7)]">
        <div className="w-full border-b border-slate-100 pb-3"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b4599]">Report controls</p><p className="mt-1 text-sm text-slate-500">Choose a reporting window and the time grouping used in the charts.</p></div>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">From</span>
          <input className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-[#0b68c5] focus:bg-white focus:ring-4 focus:ring-blue-100" type="date" name="startDate" defaultValue={dateRange.startDate} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">To</span>
          <input className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-[#0b68c5] focus:bg-white focus:ring-4 focus:ring-blue-100" type="date" name="endDate" defaultValue={dateRange.endDate} />
        </label>
        <button type="submit" className="h-11 rounded-xl bg-[#0b4599] px-5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#083875]">
          Apply dates
        </button>
        <label className="ml-auto grid gap-1 text-sm font-medium text-slate-700">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Group by</span>
          <select
            className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none focus:border-[#0b68c5] focus:ring-4 focus:ring-blue-100"
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

      <section className="print:hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(9,44,92,0.7)]" aria-label="Report filters">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b4599]">Explore the data</p><h2 className="mt-1 text-lg font-bold text-[#0b1a3e]">{reportMode === "programs" ? "Filter programs and services" : reportMode === "staff" ? "Filter staff activity" : "Filter assistance records"}</h2></div><span className="rounded-full bg-[#eef6ff] px-3 py-1.5 text-xs font-bold text-[#0b4599]">{reportMode === "programs" ? filteredBeneficiaries.length : filteredAssistance.length} matching records</span></div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(240px,1.5fr)_minmax(170px,0.7fr)_minmax(170px,0.7fr)]">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Search reports<input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder={reportMode === "programs" ? "Beneficiary, ID, category, barangay..." : "Beneficiary, staff, reference, provider..."} className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#0B68C5] focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.currentTarget.value)} className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#0B68C5] focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="ALL">All categories</option>{reportCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Staff<select value={staffFilter} onChange={(event) => setStaffFilter(event.currentTarget.value)} className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#0B68C5] focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="ALL">All staff</option>{reportStaff.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select></label>
          <div className="ml-auto flex flex-wrap gap-2 text-sm"><span className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800">{filteredAssistance.length} transactions</span><span className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-800">₱{selectedAssistanceTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })} total amount</span></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
        <ReportKpi icon={<ClipboardList />} label="Assistance records" value={filteredAssistance.length.toLocaleString()} note={selectedTypeLabel} tone="blue" />
        <ReportKpi icon={<UsersRound />} label="Beneficiaries served" value={uniqueBeneficiaryCount.toLocaleString()} note="Unique clients in view" tone="violet" />
        <ReportKpi icon={<WalletCards />} label="Financial assistance" value={`₱${selectedAssistanceTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} note="Recorded monetary amount" tone="gold" />
        <ReportKpi icon={<ArrowUpRight />} label="Provided" value={providedCount.toLocaleString()} note="Successful assistance outcomes" tone="green" />
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(9,44,92,0.65)] sm:p-6" aria-label="Assistance type summary">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-base font-bold text-[#0B1A3E]">{selectedTypeLabel} summary</h2><p className="mt-1 text-xs text-slate-500">Reporting period: {dateRange.startDate} to {dateRange.endDate}</p></div>
            <div className="text-sm font-semibold text-[#173B70]">{(assistanceType === "MEDICAL_ASSISTANCE" || assistanceType === "ALL") && <p>Medicine quantity recorded: {medicineQuantityTotal.toLocaleString()}</p>}{(assistanceType !== "MEDICAL_ASSISTANCE") && <p>Items / goods quantity recorded: {itemQuantityTotal.toLocaleString()}</p>}</div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-2 pr-4">Medicine / item / service description</th><th className="py-2 pr-4 text-right">Transactions</th><th className="py-2 text-right">Quantity</th></tr></thead>
            <tbody>{assistanceBreakdown.length ? assistanceBreakdown.map(([description, totals]) => <tr key={description} className="border-b border-slate-100 last:border-0"><td className="py-2 pr-4">{description}</td><td className="py-2 pr-4 text-right">{totals.transactions}</td><td className="py-2 text-right">{totals.quantity || "—"}</td></tr>) : <tr><td className="py-4 text-center text-slate-500" colSpan={3}>No assistance records for this selection.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className="print:hidden grid gap-5 xl:grid-cols-[1.45fr_0.95fr]" aria-label="Report analytics">
        <div className="dashboard-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_50px_-35px_rgba(9,44,92,0.7)] sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B4599]">Activity trend</p><h2 className="mt-1 text-xl font-bold text-[#0B1A3E]">Assistance delivery over time</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Grouped by {periodLabels[period]}</span></div><div className="mt-5 h-[265px] min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={periodAnalytics} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E8EEF7" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6480A9" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6480A9" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #DCE7F5", boxShadow: "0 18px 35px rgba(9,44,92,.14)" }} /><Bar dataKey="records" name="Assistance records" fill="#0B68C5" radius={[8, 8, 2, 2]} barSize={28} /></BarChart></ResponsiveContainer></div></div>
        <div className="dashboard-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_50px_-35px_rgba(9,44,92,0.7)] sm:p-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B4599]">Service mix</p><h2 className="mt-1 text-xl font-bold text-[#0B1A3E]">Records by assistance type</h2></div><div className="mt-5 h-[265px] min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={typeAnalytics} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#E8EEF7" /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="label" width={105} tick={{ fontSize: 10, fill: "#405B80" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #DCE7F5" }} /><Bar dataKey="count" name="Records" radius={[0, 8, 8, 0]} barSize={20}>{typeAnalytics.map((entry, index) => <Cell key={entry.type} fill={index % 2 ? "#C9A93F" : "#0B68C5"} />)}</Bar></BarChart></ResponsiveContainer></div></div>
      </section>

      <div className="report-print-document space-y-10">
        <div className="hidden print:block">
          <h1 className="text-2xl font-bold">Mahayag MSWD Reports{qualifier}</h1>
          <p className="mt-1 text-sm">Reporting period: {dateRange.startDate} to {dateRange.endDate}</p>
          <p className="text-sm">Assistance type: {selectedTypeLabel} · {uniqueBeneficiaryCount} unique beneficiaries · {filteredAssistance.length} transactions · ₱{selectedAssistanceTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })} recorded financial assistance</p>
          <p className="text-sm">Generated: {generatedAt}</p>
        </div>

        <section aria-labelledby="membership-report-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="membership-report-heading" className="text-xl font-bold text-slate-900">Beneficiary membership report</h2>
              <p className="text-sm text-slate-600">{reportBeneficiaries.length.toLocaleString()} beneficiaries in the selected category and date range</p>
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
                {reportBeneficiaries.length ? reportBeneficiaries.map((row) => (
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
            <div className="print:hidden flex flex-wrap gap-2">
              <button type="button" onClick={exportAssistance} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Export assistance CSV
              </button>
              <button type="button" onClick={exportAssistanceExcel} className="rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                Export assistance Excel
              </button>
            </div>
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
                  <th className="px-4 py-3">Reference</th><th className="px-4 py-3">Date visited / provided</th>
                  <th className="px-4 py-3">Assistance type</th><th className="px-4 py-3">Beneficiary / category</th>
                  <th className="px-4 py-3">Assigned staff</th><th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Amount</th><th className="px-4 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssistance.length ? filteredAssistance.map((row) => (
                  <tr key={row.referenceNumber} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.referenceNumber}</td><td className="px-4 py-3">{displayDate(row.providedAt || row.visitDate)}</td>
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
  return <article className={`dashboard-3d-card relative overflow-hidden rounded-[1.5rem] border p-5 shadow-[0_22px_42px_-32px_rgba(9,44,92,0.7)] transition hover:-translate-y-1 hover:shadow-[0_28px_52px_-30px_rgba(9,44,92,0.55)] ${tones[tone]}`}><div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-current opacity-[0.1] blur-xl" /><div className="relative flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 shadow-sm [&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">Live</span></div><p className="relative mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="relative mt-1 text-3xl font-black tracking-tight text-[#0B1A3E]">{value}</p><p className="relative mt-1 text-xs font-medium text-slate-500">{note}</p></article>;
}
