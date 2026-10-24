"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  LoaderCircle,
  Plus,
  Search,
  Save,
  UserPlus,
  X,
} from "lucide-react";
import {
  createBeneficiaryAction,
  type BeneficiaryActionState,
} from "@/app/actions/mswd";
import { MAHAYAG_BARANGAYS, MAHAYAG_MUNICIPALITY } from "@/lib/locations";
import { calculateAge } from "@/lib/age";

type RegistryCategory = { id: string; name: string };
type RegistryOfficer = { id: string; name: string; categoryIds: string[] };
type RegistryBeneficiary = {
  id: string;
  beneficiaryNumber: string;
  fullName: string;
  categoryId: string;
  categoryName: string;
  barangay: string | null;
  officerName: string | null;
  status: string;
};

const initialActionState: BeneficiaryActionState = { ok: true, message: "" };
const inputClass =
  "h-11 w-full rounded-lg border border-[#DCE3EE] bg-white px-3 text-sm text-[#172B4D] outline-none transition placeholder:text-slate-400 focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15";

function FormField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#172B4D]">
        {label}
        {required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function BeneficiaryRegistry({
  categories,
  filterCategories,
  officers,
  beneficiaries,
  selectedCategoryId,
  officerMode = false,
}: {
  categories: RegistryCategory[];
  filterCategories: RegistryCategory[];
  officers: RegistryOfficer[];
  beneficiaries: RegistryBeneficiary[];
  selectedCategoryId?: string;
  officerMode?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const modalTriggerRef = useRef<HTMLButtonElement>(null);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const categoryFilterButtonRef = useRef<HTMLButtonElement>(null);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const activeCount = beneficiaries.filter((beneficiary) => beneficiary.status === "ACTIVE").length;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredBeneficiaries = beneficiaries.filter((beneficiary) => {
    const searchable = `${beneficiary.fullName} ${beneficiary.beneficiaryNumber}`.toLowerCase();
    return searchable.includes(normalizedSearch);
  });

  function closeModal() {
    setModalOpen(false);
  }

  const handleSaved = useCallback(() => {
    setModalOpen(false);
    setToastVisible(true);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!toastVisible) return;
    const timeoutId = window.setTimeout(() => setToastVisible(false), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [toastVisible]);

  useEffect(() => {
    if (!categoryFilterOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !categoryFilterRef.current?.contains(event.target)) {
        setCategoryFilterOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCategoryFilterOpen(false);
        categoryFilterButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [categoryFilterOpen]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1A3E]">
            {officerMode ? "My beneficiaries" : "Beneficiaries"}
          </h1>
          <p className="mt-1.5 text-sm text-[#6480A9]">
            {officerMode
              ? "Register beneficiaries in your assigned category."
              : "Manage and register MSWD beneficiaries."}
          </p>
        </div>
        <button
          ref={modalTriggerRef}
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#0B1A3E] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172B4D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/30 sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Beneficiary
        </button>
      </header>

      <section aria-label="Beneficiary summary" className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#DCE3EE] border-t-2 border-t-[#0645AD] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6480A9]">Total beneficiaries</p>
          <p className="mt-2 text-2xl font-bold text-[#0B1A3E]">{beneficiaries.length.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#DCE3EE] border-t-2 border-t-[#168653] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6480A9]">Active beneficiaries</p>
          <p className="mt-2 text-2xl font-bold text-[#0B1A3E]">{activeCount.toLocaleString()}</p>
        </div>
      </section>

      <section className="rounded-xl border border-[#DCE3EE] bg-white shadow-sm">
        <div className="border-b border-[#DCE3EE] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#0B1A3E]">
              {selectedCategoryId
                ? `${categories.find((category) => category.id === selectedCategoryId)?.name ?? "Program"} Beneficiaries`
                : "Beneficiary Registry"}
            </h2>
            <p className="shrink-0 text-xs text-[#6480A9]">
              {filteredBeneficiaries.length} {filteredBeneficiaries.length === 1 ? "record" : "records"}
            </p>
          </div>
          <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            {!officerMode && <div ref={categoryFilterRef} className="relative w-full shrink-0 sm:w-auto">
              <button
                ref={categoryFilterButtonRef}
                type="button"
                aria-expanded={categoryFilterOpen}
                aria-controls="beneficiary-category-filter-options"
                onClick={() => setCategoryFilterOpen((open) => !open)}
                className="flex h-11 w-full items-center justify-between gap-4 rounded-lg border border-[#DCE3EE] bg-white px-3 text-left text-sm text-[#405B80] transition hover:border-[#C9A93F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/15 sm:min-w-56"
              >
                <span className="min-w-0">
                  <span className="mr-2 text-xs text-[#6480A9]">Filter by</span>
                  <span className="font-medium text-[#0B1A3E]">{selectedCategory?.name ?? "All beneficiaries"}</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[#6480A9] transition-transform ${categoryFilterOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {categoryFilterOpen && (
                <nav
                  id="beneficiary-category-filter-options"
                  aria-label="Filter beneficiaries by category"
                  className="absolute left-0 top-full z-20 mt-2 max-h-[min(60vh,24rem)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-[#DCE3EE] bg-white p-1.5 shadow-xl"
                >
                  <Link
                    href="/admin/beneficiaries"
                    aria-current={!selectedCategoryId ? "page" : undefined}
                    onClick={() => setCategoryFilterOpen(false)}
                    className={`block rounded-md px-3 py-2.5 text-sm transition ${
                      !selectedCategoryId
                        ? "bg-[#F8F4E8] font-semibold text-[#0B1A3E]"
                        : "text-[#405B80] hover:bg-[#F4F7FB] hover:text-[#0B1A3E]"
                    }`}
                  >
                    All beneficiaries
                  </Link>
                  {filterCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/admin/beneficiaries?categoryId=${encodeURIComponent(category.id)}`}
                      aria-current={selectedCategoryId === category.id ? "page" : undefined}
                      onClick={() => setCategoryFilterOpen(false)}
                      className={`block whitespace-normal break-words rounded-md px-3 py-2.5 text-sm transition ${
                        selectedCategoryId === category.id
                          ? "bg-[#F8F4E8] font-semibold text-[#0B1A3E]"
                          : "text-[#405B80] hover:bg-[#F4F7FB] hover:text-[#0B1A3E]"
                      }`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </nav>
              )}
            </div>}
            <label className="relative block w-full min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6480A9]" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or beneficiary ID"
                aria-label="Search beneficiaries by name or beneficiary ID"
                className={`${inputClass} pl-9`}
              />
            </label>
          </div>
        </div>

        {filteredBeneficiaries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#F4F7FB]">
                <tr className="text-[10px] uppercase tracking-wide text-[#6480A9]">
                  <th className="px-4 py-3 font-semibold">Beneficiary ID</th>
                  <th className="px-4 py-3 font-semibold">Beneficiary</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Barangay</th>
                  <th className="px-4 py-3 font-semibold">Assigned officer</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF4]">
                {filteredBeneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id} className="hover:bg-[#FAFBFD]">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#405B80]">{beneficiary.beneficiaryNumber}</td>
                    <td className="px-4 py-3 font-semibold text-[#172B4D]">{beneficiary.fullName}</td>
                    <td className="px-4 py-3 text-[#405B80]">{beneficiary.categoryName}</td>
                    <td className="px-4 py-3 text-[#405B80]">{beneficiary.barangay ?? "—"}</td>
                    <td className="px-4 py-3 text-[#405B80]">{beneficiary.officerName ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${beneficiary.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {beneficiary.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FB] text-[#6480A9]">
              <Search className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-[#172B4D]">
              {normalizedSearch ? "No matching beneficiaries" : "No beneficiaries found"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#6480A9]">
              {normalizedSearch
                ? "Try another name or beneficiary ID."
                : "There are no records for this view yet. Add a beneficiary to get started."}
            </p>
            {!normalizedSearch && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0B1A3E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172B4D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/30"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Beneficiary
              </button>
            )}
          </div>
        )}
      </section>

      {modalOpen && (
        <BeneficiaryModal
          key="new-beneficiary"
          categories={categories}
          officers={officers}
          selectedCategoryId={selectedCategoryId}
          officerMode={officerMode}
          onClose={closeModal}
          onSaved={handleSaved}
          triggerRef={modalTriggerRef}
        />
      )}

      {toastVisible && (
        <div role="status" className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
          <Check className="h-4 w-4" aria-hidden="true" />
          Beneficiary saved successfully.
          <button type="button" onClick={() => setToastVisible(false)} aria-label="Dismiss notification" className="ml-2 rounded p-1 hover:bg-emerald-50">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function BeneficiaryModal({
  categories,
  officers,
  selectedCategoryId,
  officerMode,
  onClose,
  onSaved,
  triggerRef,
}: {
  categories: RegistryCategory[];
  officers: RegistryOfficer[];
  selectedCategoryId?: string;
  officerMode: boolean;
  onClose: () => void;
  onSaved: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [state, formAction, pending] = useActionState(createBeneficiaryAction, initialActionState);
  const [dirty, setDirty] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const submittedValuesRef = useRef<Record<string, string>>({});

  const requestClose = useCallback(() => {
    if (pending) return;
    if (dirty && !window.confirm("Discard the beneficiary information you entered?")) return;
    onClose();
  }, [dirty, onClose, pending]);

  useEffect(() => {
    const triggerElement = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      triggerElement?.focus();
    };
  }, [triggerRef]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      }
      if (event.key === "Tab") {
        const dialog = document.getElementById("add-beneficiary-dialog");
        const focusable = dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [requestClose]);

  useEffect(() => {
    if (state.saved) {
      onSaved();
      return;
    }
    if (!state.ok && formRef.current) {
      const controls = formRef.current.elements;
      for (const [name, value] of Object.entries(submittedValuesRef.current)) {
        const control = controls.namedItem(name);
        if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
          control.value = value;
        }
      }
      setAge(calculateAge(submittedValuesRef.current.dateOfBirth ?? ""));
    }
  }, [state, onSaved]);

  function captureFormValues(form: HTMLFormElement) {
    submittedValuesRef.current = Object.fromEntries(
      Array.from(new FormData(form).entries()).map(([name, value]) => [name, String(value)]),
    );
  }

  function handleDateOfBirthChange(value: string) {
    setAge(value ? calculateAge(value) : null);
    setDirty(true);
  }

  function fieldProps(id: string) {
    const error = state.fieldErrors?.[id];
    return {
      id,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `${id}-error` : undefined,
      className: `${inputClass} ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10" : ""}`,
    } as const;
  }

  return (
    <div
      className="beneficiary-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-[#071329]/65 p-0 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        id="add-beneficiary-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-beneficiary-title"
        aria-describedby="add-beneficiary-description"
        className="beneficiary-modal-panel flex max-h-[100dvh] w-full max-w-[750px] flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-xl sm:border sm:border-[#DCE3EE]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#DCE3EE] px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F8F4E8] text-[#A88724]">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="add-beneficiary-title" className="text-lg font-bold text-[#0B1A3E]">Add New Beneficiary</h2>
              <p id="add-beneficiary-description" className="mt-1 text-xs text-[#6480A9]">
                Register an individual in the MSWD beneficiary registry.
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            disabled={pending}
            aria-label="Close add beneficiary dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0B1A3E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A93F] disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form
          ref={formRef}
          action={formAction}
          onChange={() => setDirty(true)}
          onSubmit={(event) => captureFormValues(event.currentTarget)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {!state.ok && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
                {state.message}
              </div>
            )}

            <section aria-labelledby="personal-info-heading">
              <div className="mb-3 border-b border-[#E8EDF4] pb-2">
                <h3 id="personal-info-heading" className="text-sm font-semibold text-[#0B1A3E]">Personal Information</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="firstName" label="First name" required error={state.fieldErrors?.firstName}>
                  <input {...fieldProps("firstName")} name="firstName" autoComplete="given-name" required />
                </FormField>
                <FormField id="lastName" label="Last name" required error={state.fieldErrors?.lastName}>
                  <input {...fieldProps("lastName")} name="lastName" autoComplete="family-name" required />
                </FormField>
                <FormField id="middleName" label="Middle name" error={state.fieldErrors?.middleName}>
                  <input {...fieldProps("middleName")} name="middleName" autoComplete="additional-name" />
                </FormField>
                <FormField id="suffix" label="Suffix" error={state.fieldErrors?.suffix}>
                  <input {...fieldProps("suffix")} name="suffix" placeholder="Jr., Sr., etc." />
                </FormField>
                <FormField id="sex" label="Sex" required error={state.fieldErrors?.sex}>
                  <span className="relative block">
                    <select {...fieldProps("sex")} name="sex" required defaultValue="MALE">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6480A9]" aria-hidden="true" />
                  </span>
                </FormField>
                <FormField id="dateOfBirth" label="Date of birth" error={state.fieldErrors?.dateOfBirth}>
                  <input
                    {...fieldProps("dateOfBirth")}
                    name="dateOfBirth"
                    type="date"
                    autoComplete="bday"
                    onChange={(event) => handleDateOfBirthChange(event.currentTarget.value)}
                  />
                </FormField>
                <FormField id="age" label="Age" error={state.fieldErrors?.age}>
                  <input
                    {...fieldProps("age")}
                    value={age ?? ""}
                    readOnly
                    placeholder="Enter date of birth"
                    className={`${inputClass} bg-slate-50`}
                  />
                </FormField>
              </div>
            </section>

            <section aria-labelledby="classification-heading">
              <div className="mb-3 border-b border-[#E8EDF4] pb-2">
                <h3 id="classification-heading" className="text-sm font-semibold text-[#0B1A3E]">Classification</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="categoryId" label="Beneficiary category" required error={state.fieldErrors?.categoryId}>
                  {officerMode && selectedCategoryId ? (
                    <>
                      <input
                        {...fieldProps("categoryId")}
                        name="categoryName"
                        value={categories.find((category) => category.id === selectedCategoryId)?.name ?? ""}
                        readOnly
                        className={`${inputClass} bg-slate-50`}
                      />
                      <input type="hidden" name="categoryId" value={selectedCategoryId ?? ""} />
                    </>
                  ) : <span className="relative block">
                    <select
                      {...fieldProps("categoryId")}
                      name="categoryId"
                      required
                      defaultValue={selectedCategoryId ?? ""}
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6480A9]" aria-hidden="true" />
                  </span>}
                </FormField>
                <FormField id="civilStatus" label="Civil status" error={state.fieldErrors?.civilStatus}>
                  <span className="relative block">
                    <select {...fieldProps("civilStatus")} name="civilStatus" defaultValue="">
                      <option value="">Select</option>
                      <option value="SINGLE">Single</option>
                      <option value="MARRIED">Married</option>
                      <option value="WIDOWED">Widowed</option>
                      <option value="SEPARATED">Separated</option>
                      <option value="DIVORCED">Divorced</option>
                      <option value="OTHERS">Others</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6480A9]" aria-hidden="true" />
                  </span>
                </FormField>
              </div>
            </section>

            <section aria-labelledby="contact-heading">
              <div className="mb-3 border-b border-[#E8EDF4] pb-2">
                <h3 id="contact-heading" className="text-sm font-semibold text-[#0B1A3E]">Contact &amp; Address</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="contactNumber" label="Contact number" error={state.fieldErrors?.contactNumber}>
                  <input {...fieldProps("contactNumber")} name="contactNumber" type="tel" autoComplete="tel" />
                </FormField>
                <FormField id="email" label="Email" error={state.fieldErrors?.email}>
                  <input {...fieldProps("email")} name="email" type="email" autoComplete="email" />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField id="address" label="Address" required error={state.fieldErrors?.address}>
                    <input {...fieldProps("address")} name="address" autoComplete="street-address" required />
                  </FormField>
                </div>
                <FormField id="barangay" label="Barangay" required error={state.fieldErrors?.barangay}>
                  <span className="relative block">
                    <select {...fieldProps("barangay")} name="barangay" required defaultValue="">
                      <option value="" disabled>Select a barangay</option>
                      {MAHAYAG_BARANGAYS.map((barangay) => (
                        <option key={barangay} value={barangay}>{barangay}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6480A9]" aria-hidden="true" />
                  </span>
                </FormField>
                <FormField id="municipality" label="Municipality">
                  <input
                    {...fieldProps("municipality")}
                    name="municipality"
                    value={MAHAYAG_MUNICIPALITY}
                    readOnly
                    autoComplete="address-level2"
                    className={`${inputClass} bg-slate-50`}
                  />
                </FormField>
                <FormField id="province" label="Province" error={state.fieldErrors?.province}>
                  <input {...fieldProps("province")} name="province" autoComplete="address-level1" />
                </FormField>
              </div>
            </section>

            <section aria-labelledby="assignment-heading">
              <div className="mb-3 border-b border-[#E8EDF4] pb-2">
                <h3 id="assignment-heading" className="text-sm font-semibold text-[#0B1A3E]">Assignment &amp; Notes</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {!officerMode && <FormField id="assignedOfficerId" label="Assigned officer" error={state.fieldErrors?.assignedOfficerId}>
                  <span className="relative block">
                    <select {...fieldProps("assignedOfficerId")} name="assignedOfficerId" defaultValue="">
                      <option value="">Unassigned</option>
                      {officers.map((officer) => (
                        <option key={officer.id} value={officer.id}>{officer.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6480A9]" aria-hidden="true" />
                  </span>
                </FormField>}
                <FormField id="subcategory" label="Subcategory" error={state.fieldErrors?.subcategory}>
                  <input {...fieldProps("subcategory")} name="subcategory" />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField id="remarks" label="Remarks" error={state.fieldErrors?.remarks}>
                    <textarea
                      id="remarks"
                      name="remarks"
                      rows={3}
                      aria-invalid={Boolean(state.fieldErrors?.remarks)}
                      aria-describedby={state.fieldErrors?.remarks ? "remarks-error" : undefined}
                      className={`w-full rounded-lg border border-[#DCE3EE] bg-white px-3 py-2.5 text-sm text-[#172B4D] outline-none transition placeholder:text-slate-400 focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15 ${state.fieldErrors?.remarks ? "border-rose-400" : ""}`}
                    />
                  </FormField>
                </div>
              </div>
            </section>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#DCE3EE] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={requestClose}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] transition hover:bg-[#F4F7FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/20 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || categories.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white transition hover:bg-[#172B4D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              {pending ? "Saving..." : "Save Beneficiary"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
