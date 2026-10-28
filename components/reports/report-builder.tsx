"use client";

import { useMemo, useState } from "react";
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
  beneficiaryNumber: string;
  beneficiaryName: string;
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
  const membershipSummary = useMemo(
    () => groupBeneficiaries(beneficiaries, period),
    [beneficiaries, period],
  );
  const assistanceSummary = useMemo(
    () => groupAssistance(assistance, period),
    [assistance, period],
  );
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
      ["Reference", "Visit date", "Assistance type", "Other type", "Beneficiary ID", "Beneficiary", "Outcome"],
      ...assistance.map((row) => [
        row.referenceNumber,
        row.visitDate,
        ASSISTANCE_TYPE_LABELS[row.type],
        row.otherType,
        row.beneficiaryNumber,
        row.beneficiaryName,
        ASSISTANCE_OUTCOME_LABELS[row.outcome],
      ]),
    ]);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="mt-2 text-slate-600">
            Beneficiary memberships and assistance activity{officerName ? " assigned to your account" : " across the system"}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden inline-flex h-10 items-center justify-center rounded-lg bg-[#0B1A3E] px-4 text-sm font-semibold text-white hover:bg-[#172B4D]"
        >
          Print / Save as PDF
        </button>
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
              <p className="text-sm text-slate-600">{assistance.length.toLocaleString()} assistance applications/records in selected date range</p>
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
                  <th className="px-4 py-3">Assistance type</th><th className="px-4 py-3">Beneficiary</th>
                  <th className="px-4 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {assistance.length ? assistance.map((row) => (
                  <tr key={row.referenceNumber} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.referenceNumber}</td><td className="px-4 py-3">{displayDate(row.visitDate)}</td>
                    <td className="px-4 py-3">{row.type === "OTHER" && row.otherType ? row.otherType : ASSISTANCE_TYPE_LABELS[row.type]}</td>
                    <td className="px-4 py-3">{row.beneficiaryName} ({row.beneficiaryNumber})</td>
                    <td className="px-4 py-3">{ASSISTANCE_OUTCOME_LABELS[row.outcome]}</td>
                  </tr>
                )) : <EmptyRow columns={5} />}
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
