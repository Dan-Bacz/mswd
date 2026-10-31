"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { Prisma } from "@prisma/client";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileText,
  HandHeart,
  History,
  LoaderCircle,
  Pencil,
  Plus,
  Printer,
  Search,
  Users,
  X,
} from "lucide-react";
import { saveAssistanceAction, type AssistanceActionState } from "@/app/actions/assistance";
import {
  ASSISTANCE_OUTCOME_LABELS,
  ASSISTANCE_OUTCOME_VALUES,
  ASSISTANCE_TYPE_LABELS,
  ASSISTANCE_TYPE_OPTIONS,
  formatPeso,
  supportsFinancialAmount,
  type AssistanceType,
} from "@/lib/assistance";

type BeneficiaryOption = Prisma.BeneficiaryGetPayload<{
  include: { category: true };
}>;

type AssistanceRecord = Prisma.BeneficiaryAssistanceGetPayload<{
  include: {
    beneficiary: { include: { category: true } };
    providedBy: { select: { name: true } };
  };
}>;

type OfficerOption = { id: string; name: string };
type Outcome = (typeof ASSISTANCE_OUTCOME_VALUES)[number];

const initialState: AssistanceActionState = {
  ok: false,
  message: "",
  resetKey: 0,
};

const inputClass =
  "w-full rounded-lg border border-[#DCE3EE] bg-white px-3 py-2.5 text-sm text-[#172B4D] outline-none transition placeholder:text-slate-400 focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15";

function dateInputValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function todayInputValue() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(date?: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function fullName(beneficiary: BeneficiaryOption | AssistanceRecord["beneficiary"]) {
  return [beneficiary.firstName, beneficiary.middleName, beneficiary.lastName, beneficiary.suffix]
    .filter(Boolean)
    .join(" ");
}

function assistanceTypeLabel(record: AssistanceRecord) {
  return record.type === "OTHER"
    ? `Other: ${record.otherType ?? "Unspecified"}`
    : ASSISTANCE_TYPE_LABELS[record.type];
}

function outcomeClass(outcome: Outcome) {
  switch (outcome) {
    case "PROVIDED":
      return "bg-emerald-50 text-emerald-800";
    case "REFERRED":
      return "bg-sky-50 text-sky-800";
    case "FOLLOW_UP":
      return "bg-amber-50 text-amber-800";
    case "NOT_PROVIDED":
      return "bg-rose-50 text-rose-800";
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs font-medium text-rose-700">{message}</p> : null;
}

export function AssistanceManagement({
  beneficiaries,
  records,
  officers,
  isAdmin,
  subtitle,
}: {
  beneficiaries: BeneficiaryOption[];
  records: AssistanceRecord[];
  officers: OfficerOption[];
  isAdmin: boolean;
  subtitle: string;
}) {
  const [state, formAction, pending] = useActionState(saveAssistanceAction, initialState);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("");
  const [clientId, setClientId] = useState("");
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [assistanceType, setAssistanceType] = useState("");
  const [outcome, setOutcome] = useState<Outcome>("PROVIDED");
  const [tableSearch, setTableSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [officerFilter, setOfficerFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AssistanceRecord | null>(null);
  const [proofRecord, setProofRecord] = useState<AssistanceRecord | null>(null);
  const [notice, setNotice] = useState("");
  const processedSaveKey = useRef(0);

  const filteredRecords = useMemo(() => {
    const search = tableSearch.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const name = `${record.beneficiary.firstName} ${record.beneficiary.middleName ?? ""} ${record.beneficiary.lastName} ${record.beneficiary.suffix ?? ""}`.toLocaleLowerCase();
      const searchable = `${record.referenceNumber} ${name} ${record.beneficiary.beneficiaryNumber}`.toLocaleLowerCase();
      const visitDay = dateInputValue(record.visitDate);
      return (
        (!search || searchable.includes(search)) &&
        (!typeFilter || record.type === typeFilter) &&
        (!outcomeFilter || record.outcome === outcomeFilter) &&
        (!categoryFilter || record.beneficiary.categoryId === categoryFilter) &&
        (!officerFilter || record.providedById === officerFilter) &&
        (!dateFrom || visitDay >= dateFrom) &&
        (!dateTo || visitDay <= dateTo)
      );
    });
  }, [records, tableSearch, typeFilter, outcomeFilter, categoryFilter, officerFilter, dateFrom, dateTo]);

  const today = todayInputValue();
  const recordsToday = records.filter((record) => dateInputValue(record.visitDate) === today).length;
  const providedCount = records.filter((record) => record.outcome === "PROVIDED").length;
  const beneficiariesAssisted = new Set(
    records.filter((record) => record.outcome === "PROVIDED").map((record) => record.beneficiaryId),
  ).size;
  const followUpCount = records.filter((record) => record.outcome === "FOLLOW_UP").length;

  useEffect(() => {
    if (!state.ok || !state.savedId || processedSaveKey.current === state.resetKey) return;
    const savedRecord = records.find((record) => record.id === state.savedId);
    if (!savedRecord) return;
    processedSaveKey.current = state.resetKey;
    window.setTimeout(() => {
      setFormOpen(false);
      setNotice(state.message);
      if (state.printProof) {
        setProofRecord(savedRecord);
        window.setTimeout(() => window.print(), 250);
      }
    }, 0);
  }, [state, records]);

  function openCreateForm() {
    setEditId(null);
    setSelectedBeneficiaryId("");
    setClientId("");
    setBeneficiarySearch("");
    setAssistanceType("");
    setOutcome("PROVIDED");
    setFormOpen(true);
  }

  function openEditForm(record: AssistanceRecord) {
    setEditId(record.id);
    setSelectedBeneficiaryId(record.beneficiaryId);
    setClientId(record.beneficiary.beneficiaryNumber);
    setBeneficiarySearch(fullName(record.beneficiary));
    setAssistanceType(record.type);
    setOutcome(record.outcome);
    setSelectedRecord(null);
    setFormOpen(true);
  }

  function openDetails(record: AssistanceRecord) {
    setSelectedRecord(record);
  }

  function printRecord(record: AssistanceRecord) {
    setSelectedRecord(null);
    setProofRecord(record);
    window.setTimeout(() => window.print(), 150);
  }

  function exportReport() {
    const headings = [
      "Reference Number",
      "Beneficiary Name",
      "Beneficiary ID",
      "Category",
      "Assistance Type",
      "Date of Visit",
      "Outcome",
      "Date Provided",
      "Recording Officer",
    ];
    const rows = filteredRecords.map((record) => [
      record.referenceNumber,
      fullName(record.beneficiary),
      record.beneficiary.beneficiaryNumber,
      record.beneficiary.category.name,
      assistanceTypeLabel(record),
      dateInputValue(record.visitDate),
      ASSISTANCE_OUTCOME_LABELS[record.outcome],
      dateInputValue(record.providedAt),
      record.providedBy.name,
    ]);
    const escapeCell = (value: string) => {
      const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replaceAll('"', '""')}"`;
    };
    const csv = [headings, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mswd-assistance-${dateFrom || "all"}-${dateTo || "dates"}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const editingRecord = editId ? records.find((record) => record.id === editId) : undefined;
  const selectedBeneficiary = beneficiaries.find((beneficiary) => beneficiary.id === selectedBeneficiaryId);
  const showFinancialAmount = assistanceType ? supportsFinancialAmount(assistanceType as AssistanceType) : false;
  const showMedicalFields = assistanceType === "MEDICAL_ASSISTANCE";
  const beneficiaryMatches = beneficiaries
    .filter((beneficiary) => {
      const query = beneficiarySearch.trim().toLocaleLowerCase();
      if (!query) return true;
      return `${fullName(beneficiary)} ${beneficiary.beneficiaryNumber} ${beneficiary.category.name}`
        .toLocaleLowerCase()
        .includes(query);
    })
    .slice(0, 8);

  const categories = Array.from(
    new Map(beneficiaries.map((beneficiary) => [beneficiary.categoryId, beneficiary.category])).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0B1A3E]">
            <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
            Assistance management
          </p>
          <h1 className="text-3xl font-bold text-[#0B1A3E]">Beneficiary Assistance</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#6480A9]">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#FFD21F] px-5 text-sm font-bold text-[#073783] shadow-sm transition hover:bg-[#ffe05a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/30 sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Record Assistance
        </button>
      </header>

      {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span><CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice"><X className="h-4 w-4" /></button>
        </div>
      )}

      <section aria-label="Assistance summary" className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
        {[
          { label: "Total Assistance Records", value: records.length, icon: ClipboardList, tint: "bg-[#EEF4FF] text-[#0645AD]" },
          { label: "Assistance Recorded Today", value: recordsToday, icon: CalendarDays, tint: "bg-amber-50 text-amber-700" },
          { label: "Assistance Provided", value: providedCount, icon: BadgeCheck, tint: "bg-emerald-50 text-emerald-700" },
          { label: "Total Beneficiaries Assisted", value: beneficiariesAssisted, icon: Users, tint: "bg-violet-50 text-violet-700" },
          ...(isAdmin ? [{ label: "For Follow-up", value: followUpCount, icon: History, tint: "bg-orange-50 text-orange-700" }] : []),
        ].map(({ label, value, icon: Icon, tint }) => (
          <article key={label} className="rounded-2xl border border-[#E1E8F1] bg-white p-5 shadow-[0_2px_10px_rgba(11,26,62,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#6480A9]">{label}</p>
                <p className="mt-2 text-2xl font-bold text-[#0B1A3E]">{value.toLocaleString()}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E1E8F1] bg-white shadow-[0_2px_10px_rgba(11,26,62,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#E8EDF4] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#0B1A3E]">
              <ClipboardList className="h-5 w-5 text-[#0645AD]" aria-hidden="true" />
              Assistance records
            </h2>
            <p className="mt-1 text-xs text-[#7184A0]">Office visits and recorded outcomes, saved in the shared assistance registry.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={exportReport}
                disabled={filteredRecords.length === 0}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DCE3EE] px-3 text-sm font-semibold text-[#405B80] hover:bg-[#F4F7FB] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Export report
              </button>
            )}
            <span className="rounded-full bg-[#F1F5FA] px-3 py-1.5 text-xs font-semibold text-[#405B80]">
              {filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 border-b border-[#E8EDF4] bg-[#FAFBFD] p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="relative block xl:col-span-2">
            <span className="sr-only">Search beneficiary or reference</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8293AA]" aria-hidden="true" />
            <input
              value={tableSearch}
              onChange={(event) => setTableSearch(event.currentTarget.value)}
              placeholder="Beneficiary name, ID, reference"
              className={`${inputClass} pl-9`}
            />
          </label>
          {isAdmin && (
            <select aria-label="Filter by beneficiary category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.currentTarget.value)} className={inputClass}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          )}
          <select aria-label="Filter by assistance type" value={typeFilter} onChange={(event) => setTypeFilter(event.currentTarget.value)} className={inputClass}>
            <option value="">All assistance types</option>
            {ASSISTANCE_TYPE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Filter by outcome" value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.currentTarget.value)} className={inputClass}>
            <option value="">All outcomes</option>
            {ASSISTANCE_OUTCOME_VALUES.map((value) => <option key={value} value={value}>{ASSISTANCE_OUTCOME_LABELS[value]}</option>)}
          </select>
          {isAdmin && (
            <select aria-label="Filter by recording officer" value={officerFilter} onChange={(event) => setOfficerFilter(event.currentTarget.value)} className={inputClass}>
              <option value="">All officers</option>
              {officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.name}</option>)}
            </select>
          )}
          <label>
            <span className="sr-only">Visit date from</span>
            <input aria-label="Visit date from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.currentTarget.value)} className={inputClass} />
          </label>
          <label>
            <span className="sr-only">Visit date to</span>
            <input aria-label="Visit date to" type="date" value={dateTo} onChange={(event) => setDateTo(event.currentTarget.value)} className={inputClass} />
          </label>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F6FA] text-[#8293AA]">
              <FileText className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="font-semibold text-[#0B1A3E]">{records.length === 0 ? "No assistance records yet" : "No matching assistance records"}</h3>
            <p className="mt-1 max-w-md text-sm text-[#7184A0]">
              {records.length === 0
                ? "Record an in-person beneficiary visit to create the first assistance transaction."
                : "Try adjusting your search or filters to find a saved assistance transaction."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] divide-y divide-[#E8EDF4] text-left">
              <thead className="bg-[#F8FAFD]">
                <tr>
                  {[
                    "Reference Number",
                    "Beneficiary",
                    ...(isAdmin ? ["Category"] : []),
                    "Assistance Type",
                    "Date of Visit",
                    "Outcome",
                    "Date Provided",
                    "Recording Officer",
                    "Actions",
                  ].map((label) => <th key={label} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7184A0]">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1F5]">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="align-middle hover:bg-[#FAFBFD]">
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#173B70]">{record.referenceNumber}</td>
                    <td className="min-w-48 px-4 py-3">
                      <p className="text-sm font-semibold text-[#0B1A3E]">{fullName(record.beneficiary)}</p>
                      <p className="mt-0.5 text-xs text-[#7184A0]">{record.beneficiary.beneficiaryNumber}</p>
                    </td>
                    {isAdmin && <td className="px-4 py-3 text-sm text-[#405B80]">{record.beneficiary.category.name}</td>}
                    <td className="min-w-40 px-4 py-3 text-sm text-[#405B80]">{assistanceTypeLabel(record)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#405B80]">{formatDate(record.visitDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${outcomeClass(record.outcome)}`}>
                        {ASSISTANCE_OUTCOME_LABELS[record.outcome]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#405B80]">{formatDate(record.providedAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#405B80]">{record.providedBy.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openDetails(record)} title="View details" aria-label={`View details for ${record.referenceNumber}`} className="rounded-lg p-2 text-[#405B80] hover:bg-[#EEF4FF] hover:text-[#0645AD]"><Eye className="h-4 w-4" aria-hidden="true" /></button>
                        <button type="button" onClick={() => openEditForm(record)} title="Edit record" aria-label={`Edit ${record.referenceNumber}`} className="rounded-lg p-2 text-[#405B80] hover:bg-amber-50 hover:text-amber-700"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                        <button type="button" onClick={() => printRecord(record)} title="Print proof" aria-label={`Print ${record.referenceNumber}`} className="rounded-lg p-2 text-[#405B80] hover:bg-slate-100"><Printer className="h-4 w-4" aria-hidden="true" /></button>
                        <button type="button" onClick={() => setSelectedRecord(record)} title="View details and history" aria-label={`View history for ${record.referenceNumber}`} className="rounded-lg p-2 text-[#405B80] hover:bg-violet-50 hover:text-violet-700"><History className="h-4 w-4" aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#071329]/65 p-0 backdrop-blur-[2px] sm:p-5">
          <section role="dialog" aria-modal="true" aria-labelledby="assistance-form-title" className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-[#F7F9FC] shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-2xl">
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E4EAF3] bg-white px-5 py-4 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A88724]">In-person office transaction</p>
                <h2 id="assistance-form-title" className="mt-1 text-xl font-bold text-[#0B1A3E]">{editingRecord ? "Edit Assistance Record" : "Record Assistance"}</h2>
                <p className="mt-1 text-xs text-[#7184A0]">Select the beneficiary&apos;s existing registry record. This is not an online application.</p>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} disabled={pending} aria-label="Close form" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
            </header>

            <form key={`${state.resetKey}-${editId ?? "new"}`} action={formAction} className="flex min-h-0 flex-1 flex-col">
              <input type="hidden" name="recordId" value={editId ?? ""} />
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
                {state.message && !state.ok && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{state.message}</div>}

                <section className="rounded-xl border border-[#E4EAF3] bg-white p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-[#0B1A3E]">1. Client identification</h3>
                    <p className="mt-1 text-xs text-[#7184A0]">Enter the Client ID before reviewing the client&apos;s personal information. Only existing clients can be selected.</p>
                  </div>
                  <input type="hidden" name="beneficiaryId" value={selectedBeneficiaryId} />
                  <label htmlFor="assistance-client-id" className="mb-1.5 block text-xs font-semibold text-[#405B80]">Client ID <span className="text-rose-600">*</span></label>
                  <input
                    id="assistance-client-id"
                    name="clientId"
                    required
                    value={clientId}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setClientId(value);
                      const match = beneficiaries.find(
                        (beneficiary) => beneficiary.beneficiaryNumber.toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
                      );
                      if (match) {
                        setSelectedBeneficiaryId(match.id);
                        setBeneficiarySearch(fullName(match));
                      } else {
                        setSelectedBeneficiaryId("");
                      }
                    }}
                    autoComplete="off"
                    placeholder="e.g., BEN-20261029-123456-ABCDE"
                    aria-invalid={Boolean(state.fieldErrors?.clientId)}
                    className={`${inputClass} font-mono`}
                  />
                  <FieldError message={state.fieldErrors?.clientId} />
                  <label htmlFor="assistance-beneficiary-search" className="mb-1.5 mt-4 block text-xs font-semibold text-[#405B80]">Search beneficiaries</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8293AA]" aria-hidden="true" />
                    <input
                      id="assistance-beneficiary-search"
                      value={beneficiarySearch}
                      onChange={(event) => {
                        setBeneficiarySearch(event.currentTarget.value);
                        setSelectedBeneficiaryId("");
                        setClientId("");
                      }}
                      autoComplete="off"
                      placeholder="Type a beneficiary name, ID, or category"
                      aria-invalid={Boolean(state.fieldErrors?.beneficiaryId)}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                  <FieldError message={state.fieldErrors?.beneficiaryId} />
                  {!selectedBeneficiaryId && (
                    beneficiaryMatches.length ? (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-[#E4EAF3] bg-white">
                        {beneficiaryMatches.map((beneficiary) => (
                          <button
                            type="button"
                            key={beneficiary.id}
                            onClick={() => {
                              setSelectedBeneficiaryId(beneficiary.id);
                              setClientId(beneficiary.beneficiaryNumber);
                              setBeneficiarySearch(fullName(beneficiary));
                            }}
                            className="block w-full border-b border-[#EEF1F5] px-3 py-2.5 text-left last:border-0 hover:bg-[#F4F7FB]"
                          >
                            <span className="block text-sm font-semibold text-[#0B1A3E]">{fullName(beneficiary)}</span>
                            <span className="mt-0.5 block text-xs text-[#7184A0]">{beneficiary.beneficiaryNumber} · {beneficiary.category.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
                        No registered beneficiary matched. The beneficiary must first have a record in the registry; this form will not create one.
                        {" "}
                        <Link href={isAdmin ? "/admin/beneficiaries" : "/officer/beneficiaries"} className="font-bold underline">Open beneficiary registry</Link>
                      </p>
                    )
                  )}
                  {selectedBeneficiary && (
                    <div className="mt-3 rounded-xl border border-[#DCE8F8] bg-[#F5F8FD] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#0B1A3E]">{fullName(selectedBeneficiary)}</p>
                          <p className="mt-1 text-xs text-[#405B80]">Beneficiary ID: {selectedBeneficiary.beneficiaryNumber}</p>
                          <p className="mt-1 text-xs text-[#405B80]">Category: {selectedBeneficiary.category.name}</p>
                          <p className="mt-1 text-xs text-[#6480A9]">
                            {[selectedBeneficiary.barangay, selectedBeneficiary.municipality].filter(Boolean).join(", ") || "Address not recorded"}
                            {selectedBeneficiary.contactNumber ? ` · ${selectedBeneficiary.contactNumber}` : ""}
                          </p>
                        </div>
                        <button type="button" onClick={() => { setSelectedBeneficiaryId(""); setBeneficiarySearch(""); }} className="rounded-lg p-2 text-[#6480A9] hover:bg-white" aria-label="Change beneficiary"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-[#E4EAF3] bg-white p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-[#0B1A3E]">2. Assistance details</h3>
                    <p className="mt-1 text-xs text-[#7184A0]">Record the beneficiary&apos;s office visit and requested service.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-[#405B80]">
                      Date of visit <span className="text-rose-600">*</span>
                      <input name="visitDate" type="date" required defaultValue={dateInputValue(editingRecord?.visitDate) || todayInputValue()} aria-invalid={Boolean(state.fieldErrors?.visitDate)} className={`${inputClass} mt-1.5`} />
                      <FieldError message={state.fieldErrors?.visitDate} />
                    </label>
                    <label className="block text-xs font-semibold text-[#405B80]">
                      Assistance type <span className="text-rose-600">*</span>
                      <select
                        name="type"
                        required
                        value={assistanceType}
                        onChange={(event) => setAssistanceType(event.currentTarget.value)}
                        aria-invalid={Boolean(state.fieldErrors?.type)}
                        className={`${inputClass} mt-1.5`}
                      >
                        <option value="" disabled>Select assistance type</option>
                        {ASSISTANCE_TYPE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <FieldError message={state.fieldErrors?.type} />
                    </label>
                    {assistanceType === "OTHER" && (
                      <label className="block text-xs font-semibold text-[#405B80] sm:col-span-2">
                        Specify other assistance <span className="text-rose-600">*</span>
                        <input name="otherType" maxLength={100} required defaultValue={editingRecord?.otherType ?? ""} aria-invalid={Boolean(state.fieldErrors?.otherType)} className={`${inputClass} mt-1.5`} />
                        <FieldError message={state.fieldErrors?.otherType} />
                      </label>
                    )}
                    <label className="block text-xs font-semibold text-[#405B80] sm:col-span-2">
                      Purpose or reason for assistance <span className="text-rose-600">*</span>
                      <textarea name="purpose" rows={2} maxLength={1000} required defaultValue={editingRecord?.purpose ?? ""} aria-invalid={Boolean(state.fieldErrors?.purpose)} className={`${inputClass} mt-1.5 resize-y`} />
                      <FieldError message={state.fieldErrors?.purpose} />
                    </label>
                    <label className="block text-xs font-semibold text-[#405B80] sm:col-span-2">
                      Description of requested assistance <span className="text-rose-600">*</span>
                      <textarea name="requestedDescription" rows={2} maxLength={2000} required defaultValue={editingRecord?.requestedDescription ?? ""} aria-invalid={Boolean(state.fieldErrors?.requestedDescription)} className={`${inputClass} mt-1.5 resize-y`} />
                      <FieldError message={state.fieldErrors?.requestedDescription} />
                    </label>
                  </div>
                </section>

                <section className="rounded-xl border border-[#E4EAF3] bg-white p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-[#0B1A3E]">3. Assistance outcome</h3>
                    <p className="mt-1 text-xs text-[#7184A0]">Visit date and delivery date are stored separately.</p>
                  </div>
                  <label className="block text-xs font-semibold text-[#405B80]">
                    Outcome <span className="text-rose-600">*</span>
                    <select
                      name="outcome"
                      required
                      value={outcome}
                      onChange={(event) => setOutcome(event.currentTarget.value as Outcome)}
                      className={`${inputClass} mt-1.5`}
                    >
                      {ASSISTANCE_OUTCOME_VALUES.map((value) => <option key={value} value={value}>{ASSISTANCE_OUTCOME_LABELS[value]}</option>)}
                    </select>
                  </label>

                  {outcome === "PROVIDED" && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="block text-xs font-semibold text-[#405B80]">
                        Actual date assistance was provided <span className="text-rose-600">*</span>
                        <input name="providedAt" type="date" required defaultValue={dateInputValue(editingRecord?.providedAt) || todayInputValue()} aria-invalid={Boolean(state.fieldErrors?.providedAt)} className={`${inputClass} mt-1.5`} />
                        <FieldError message={state.fieldErrors?.providedAt} />
                      </label>
                      <label className="block text-xs font-semibold text-[#405B80] sm:col-span-2">
                        Assistance provided or service delivered <span className="text-rose-600">*</span>
                        <textarea name="providedDescription" rows={2} maxLength={2000} required defaultValue={editingRecord?.providedDescription ?? ""} aria-invalid={Boolean(state.fieldErrors?.providedDescription)} className={`${inputClass} mt-1.5 resize-y`} />
                        <FieldError message={state.fieldErrors?.providedDescription} />
                      </label>
                      <label className="block text-xs font-semibold text-[#405B80]">Number of medicines provided
                        <input name="medicineCount" type="number" min="0" step="1" defaultValue={editingRecord?.medicineCount ?? ""} className={`${inputClass} mt-1.5`} />
                      </label>
                      <label className="block text-xs font-semibold text-[#405B80]">Doctor / pharmacist
                        <input name="providerName" defaultValue={editingRecord?.providerName ?? ""} className={`${inputClass} mt-1.5`} />
                      </label>
                      <label className="block text-xs font-semibold text-[#405B80]">Financial amount
                        <input name="financialAmount" type="number" min="0" step="0.01" defaultValue={editingRecord?.financialAmount?.toString() ?? ""} className={`${inputClass} mt-1.5`} />
                      </label>
                      <label className="block text-xs font-semibold text-[#405B80]">Financial assistance type
                        <select name="financialType" defaultValue={editingRecord?.financialType ?? ""} className={`${inputClass} mt-1.5`}><option value="">Not applicable</option><option value="Cash grant">Cash grant</option><option value="Medical expense">Medical expense</option><option value="Burial expense">Burial expense</option><option value="Transportation">Transportation</option><option value="Other">Other</option></select>
                      </label>
                      <label className="block text-xs font-semibold text-[#405B80] sm:col-span-2">Transaction details
                        <input name="transactionDetails" defaultValue={editingRecord?.transactionDetails ?? ""} placeholder="Reference, receipt, or release details" className={`${inputClass} mt-1.5`} />
                      </label>
                    </div>
                  )}

                  {outcome === "NOT_PROVIDED" && (
                    <label className="mt-4 block text-xs font-semibold text-[#405B80]">
                      Reason assistance was not provided <span className="text-rose-600">*</span>
                      <textarea name="notProvidedReason" rows={3} maxLength={1000} required defaultValue={editingRecord?.notProvidedReason ?? ""} aria-invalid={Boolean(state.fieldErrors?.notProvidedReason)} className={`${inputClass} mt-1.5 resize-y`} />
                      <FieldError message={state.fieldErrors?.notProvidedReason} />
                    </label>
                  )}

                  {outcome === "REFERRED" && (
                    <label className="mt-4 block text-xs font-semibold text-[#405B80]">
                      Referral details <span className="text-rose-600">*</span>
                      <textarea name="referralDetails" rows={3} maxLength={1000} required defaultValue={editingRecord?.referralDetails ?? ""} aria-invalid={Boolean(state.fieldErrors?.referralDetails)} className={`${inputClass} mt-1.5 resize-y`} />
                      <FieldError message={state.fieldErrors?.referralDetails} />
                    </label>
                  )}

                  {outcome === "FOLLOW_UP" && (
                    <div className="mt-4 grid gap-4">
                      <label className="block text-xs font-semibold text-[#405B80]">
                        Reason follow-up is needed <span className="text-rose-600">*</span>
                        <textarea name="followUpReason" rows={2} maxLength={1000} required defaultValue={editingRecord?.followUpReason ?? ""} aria-invalid={Boolean(state.fieldErrors?.followUpReason)} className={`${inputClass} mt-1.5 resize-y`} />
                        <FieldError message={state.fieldErrors?.followUpReason} />
                      </label>
                      <label className="block text-xs font-semibold text-[#405B80]">
                        Follow-up details or next steps <span className="text-rose-600">*</span>
                        <textarea name="followUpNotes" rows={2} maxLength={1000} required defaultValue={editingRecord?.followUpNotes ?? ""} aria-invalid={Boolean(state.fieldErrors?.followUpNotes)} className={`${inputClass} mt-1.5 resize-y`} />
                        <FieldError message={state.fieldErrors?.followUpNotes} />
                      </label>
                    </div>
                  )}

                  <label className="mt-4 block text-xs font-semibold text-[#405B80]">
                    Internal remarks <span className="font-normal text-[#8293AA]">(optional)</span>
                    <textarea name="internalRemarks" rows={2} maxLength={2000} defaultValue={editingRecord?.internalRemarks ?? ""} className={`${inputClass} mt-1.5 resize-y`} />
                  </label>
                </section>
              </div>
              <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#DCE3EE] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button type="button" onClick={() => setFormOpen(false)} disabled={pending} className="inline-flex h-11 items-center justify-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] hover:bg-[#F4F7FB] disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#173B70] hover:bg-[#F4F7FB] disabled:opacity-50">
                  {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save Record
                </button>
                <button type="submit" name="printProof" value="true" disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white hover:bg-[#172B4D] disabled:opacity-50">
                  {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  {pending ? "Saving record..." : "Save and Print Proof"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#071329]/65 p-4 backdrop-blur-[2px]">
          <section role="dialog" aria-modal="true" aria-labelledby="assistance-detail-title" className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-[#E4EAF3] bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A88724]">{selectedRecord.referenceNumber}</p>
                <h2 id="assistance-detail-title" className="mt-1 text-xl font-bold text-[#0B1A3E]">Assistance record details</h2>
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} aria-label="Close record details" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </header>
            <div className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Beneficiary" value={fullName(selectedRecord.beneficiary)} />
                <Detail label="Beneficiary ID" value={selectedRecord.beneficiary.beneficiaryNumber} />
                <Detail label="Category" value={selectedRecord.beneficiary.category.name} />
                <Detail label="Assistance type" value={assistanceTypeLabel(selectedRecord)} />
                <Detail label="Date of visit" value={formatDate(selectedRecord.visitDate)} />
                <Detail label="Outcome" value={ASSISTANCE_OUTCOME_LABELS[selectedRecord.outcome]} />
                <Detail label="Date provided" value={formatDate(selectedRecord.providedAt)} />
                <Detail label="Recording officer" value={selectedRecord.providedBy.name} />
                <Detail label="Purpose or reason" value={selectedRecord.purpose} />
                <Detail label="Requested assistance" value={selectedRecord.requestedDescription} />
                {selectedRecord.outcome === "PROVIDED" && <Detail label="Service delivered" value={selectedRecord.providedDescription ?? "—"} />}
                {selectedRecord.notProvidedReason && <Detail label="Reason not provided" value={selectedRecord.notProvidedReason} />}
                {selectedRecord.referralDetails && <Detail label="Referral details" value={selectedRecord.referralDetails} />}
                {selectedRecord.followUpReason && <Detail label="Follow-up reason" value={selectedRecord.followUpReason} />}
                {selectedRecord.followUpNotes && <Detail label="Follow-up details" value={selectedRecord.followUpNotes} />}
                {selectedRecord.internalRemarks && <Detail label="Internal remarks" value={selectedRecord.internalRemarks} />}
              </div>
              <div className="border-t border-[#E8EDF4] pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0B1A3E]"><History className="h-4 w-4" /> Beneficiary assistance history</h3>
                <div className="space-y-2">
                  {records.filter((record) => record.beneficiaryId === selectedRecord.beneficiaryId).map((record) => (
                    <button key={record.id} type="button" onClick={() => setSelectedRecord(record)} className="flex w-full flex-col gap-1 rounded-lg border border-[#E8EDF4] px-3 py-2 text-left hover:bg-[#F8FAFD] sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-semibold text-[#173B70]">{record.referenceNumber} · {assistanceTypeLabel(record)}</span>
                      <span className="text-xs text-[#7184A0]">{formatDate(record.visitDate)} · {ASSISTANCE_OUTCOME_LABELS[record.outcome]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <footer className="flex flex-wrap justify-end gap-2 border-t border-[#E4EAF3] bg-[#FAFBFD] px-5 py-4">
              <button type="button" onClick={() => printRecord(selectedRecord)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DCE3EE] px-4 text-sm font-semibold text-[#405B80] hover:bg-white"><Printer className="h-4 w-4" />Print proof</button>
              <button type="button" onClick={() => openEditForm(selectedRecord)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0B1A3E] px-4 text-sm font-semibold text-white hover:bg-[#172B4D]"><Pencil className="h-4 w-4" />Edit record</button>
            </footer>
          </section>
        </div>
      )}

      {proofRecord && <AssistanceProof record={proofRecord} />}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8293AA]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#172B4D]">{value}</p>
    </div>
  );
}

function AssistanceProof({ record }: { record: AssistanceRecord }) {
  const provided = record.outcome === "PROVIDED";

  return (
    <article className="assistance-print-document" aria-label="Printable beneficiary assistance proof">
      <header className="border-b-2 border-slate-800 pb-4 text-center">
        <h1 className="text-sm font-bold uppercase tracking-wide">Municipal Social Welfare and Development Office</h1>
        <p className="mt-1 text-xs font-medium uppercase">Municipality of Mahayag, Zamboanga del Sur</p>
        <h2 className="mt-6 text-xl font-bold uppercase tracking-wide">
          {provided ? "Acknowledgment of Assistance Provided" : "Beneficiary Assistance Visit Record"}
        </h2>
        <p className="mt-2 text-xs uppercase tracking-widest">Reference No. {record.referenceNumber}</p>
      </header>
      <section className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <PrintDetail label="Beneficiary full name" value={fullName(record.beneficiary)} />
        <PrintDetail label="Beneficiary ID" value={record.beneficiary.beneficiaryNumber} />
        <PrintDetail label="Beneficiary category" value={record.beneficiary.category.name} />
        <PrintDetail label="Assistance type" value={assistanceTypeLabel(record)} />
        <PrintDetail label="Date of visit" value={formatDate(record.visitDate)} />
        <PrintDetail label="Outcome" value={ASSISTANCE_OUTCOME_LABELS[record.outcome]} />
        <PrintDetail label="Purpose or reason" value={record.purpose} />
        {provided && <PrintDetail label="Assistance or service delivered" value={record.providedDescription ?? "No delivery details were recorded for this legacy entry."} />}
        {provided && <PrintDetail label="Date assistance was provided" value={formatDate(record.providedAt)} />}
        {record.notProvidedReason && <PrintDetail label="Reason assistance was not provided" value={record.notProvidedReason} />}
        {record.referralDetails && <PrintDetail label="Referral details" value={record.referralDetails} />}
        {record.followUpReason && <PrintDetail label="Follow-up reason" value={record.followUpReason} />}
        {record.followUpNotes && <PrintDetail label="Follow-up details" value={record.followUpNotes} />}
        <PrintDetail label="Recording officer" value={record.providedBy.name} />
        {record.internalRemarks && <PrintDetail label="Remarks" value={record.internalRemarks} />}
      </section>
      <p className="mt-8 border-t border-slate-300 pt-4 text-xs leading-relaxed text-slate-700">
        {provided
          ? "This document records assistance or a service delivered by the Municipal Social Welfare and Development Office."
          : "This document records the beneficiary's office visit and its outcome. It does not certify that assistance was delivered."}
      </p>
      <footer className="mt-20 grid grid-cols-2 gap-12 text-center text-xs">
        <div className="border-t border-slate-700 pt-2">
          <p className="font-semibold">{record.providedBy.name}</p>
          <p className="mt-1">Recording Officer</p>
        </div>
        <div className="border-t border-slate-700 pt-2">
          <p className="font-semibold">{fullName(record.beneficiary)}</p>
          <p className="mt-1">Beneficiary / Authorized Representative</p>
        </div>
      </footer>
    </article>
  );
}

function PrintDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="break-inside-avoid">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{value}</p>
    </div>
  );
}
