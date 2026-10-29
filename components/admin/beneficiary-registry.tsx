"use client";

import Link from "next/link";
import Image from "next/image";
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
  initialSearch = "",
}: {
  categories: RegistryCategory[];
  filterCategories: RegistryCategory[];
  officers: RegistryOfficer[];
  beneficiaries: RegistryBeneficiary[];
  selectedCategoryId?: string;
  officerMode?: boolean;
  initialSearch?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
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
            Beneficiaries
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
  const [step, setStep] = useState(1);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const imagePreviewsRef = useRef<Record<string, string>>({});
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

  useEffect(
    () => () => {
      Object.values(imagePreviewsRef.current).forEach((preview) => URL.revokeObjectURL(preview));
    },
    [],
  );

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
      const fieldErrors = Object.keys(state.fieldErrors ?? {});
      setStep(fieldErrors.includes("profileImage") ? 2 : 1);
    }
  }, [state, onSaved]);

  function captureFormValues(form: HTMLFormElement) {
    submittedValuesRef.current = Object.fromEntries(
      Array.from(new FormData(form).entries())
        .filter(([, value]) => typeof value === "string")
        .map(([name, value]) => [name, String(value)]),
    );
  }

  function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>,
    field: string,
    alternativeField?: string,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const nextErrors = { ...uploadErrors };
    delete nextErrors[field];
    if (alternativeField) {
      delete nextErrors.profileImage;
      const alternative = formRef.current?.elements.namedItem(alternativeField);
      if (alternative instanceof HTMLInputElement) {
        alternative.value = "";
      }
      clearImagePreview(alternativeField);
    }

    if (file && file.size > 1024 * 1024) {
      nextErrors[field] = "Each image must be 1 MB or smaller.";
      input.value = "";
      setSelectedFiles((current) => ({ ...current, [field]: "" }));
      clearImagePreview(field);
    } else if (file && file.type && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      nextErrors[field] = "Use a JPEG, PNG, or WebP image.";
      input.value = "";
      setSelectedFiles((current) => ({ ...current, [field]: "" }));
      clearImagePreview(field);
    } else {
      if (file) setImagePreview(field, file);
      else clearImagePreview(field);
      setSelectedFiles((current) => ({
        ...current,
        [field]: file?.name ?? "",
        ...(alternativeField ? { [alternativeField]: "" } : {}),
      }));
    }

    setUploadErrors(nextErrors);
    setDirty(true);
  }

  function setImagePreview(field: string, file: File) {
    const currentPreview = imagePreviewsRef.current[field];
    if (currentPreview) URL.revokeObjectURL(currentPreview);
    const preview = URL.createObjectURL(file);
    imagePreviewsRef.current[field] = preview;
    setImagePreviews((current) => ({ ...current, [field]: preview }));
  }

  function clearImagePreview(field: string) {
    const currentPreview = imagePreviewsRef.current[field];
    if (currentPreview) URL.revokeObjectURL(currentPreview);
    delete imagePreviewsRef.current[field];
    setImagePreviews((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function goToNextStep() {
    if (step === 1) {
      const controls = formRef.current?.querySelectorAll<HTMLElement>(
        '[data-wizard-step="1"] input, [data-wizard-step="1"] select, [data-wizard-step="1"] textarea',
      );
      const invalidControl = Array.from(controls ?? []).find(
        (control): control is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
          (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) &&
          !control.checkValidity(),
      );
      if (invalidControl) {
        invalidControl.reportValidity();
        invalidControl.focus();
        return;
      }
    }

    setStep((current) => Math.min(current + 1, 2));
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
        className="beneficiary-modal-panel flex max-h-[calc(100dvh-1rem)] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-white/80 bg-[#F7F9FC] shadow-[0_28px_90px_rgba(7,19,41,0.28)] sm:max-h-[calc(100dvh-2.5rem)]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E4EAF3] bg-white px-4 py-4 sm:px-7 sm:py-5">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#0645AD] sm:h-12 sm:w-12">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A88724]">Beneficiary registry</p>
              <h2 id="add-beneficiary-title" className="mt-0.5 text-lg font-bold text-[#0B1A3E] sm:text-xl">Add New Beneficiary</h2>
              <p id="add-beneficiary-description" className="mt-1 text-xs text-[#6480A9] sm:text-sm">
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#0B1A3E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A93F] disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="shrink-0 border-b border-[#E4EAF3] bg-white px-4 pb-4 sm:px-7">
          <div className="grid grid-cols-2 gap-2" aria-label={`Step ${step} of 2`}>
            {[
              { number: 1, label: "Details" },
              { number: 2, label: "Profile photo" },
            ].map(({ number, label }) => (
              <div key={number} aria-current={step === number ? "step" : undefined}>
                <div className={`mb-2 h-1 rounded-full ${step >= number ? "bg-[#0645AD]" : "bg-[#E8EDF4]"}`} />
                <p className={`text-[10px] font-semibold sm:text-xs ${step === number ? "text-[#0645AD]" : step > number ? "text-[#405B80]" : "text-[#91A0B5]"}`}>
                  <span className="mr-1">{String(number).padStart(2, "0")}</span>{label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <form
          ref={formRef}
          action={formAction}
          onChange={() => setDirty(true)}
          onSubmit={(event) => captureFormValues(event.currentTarget)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-5 sm:px-7 sm:py-6">
            {!state.ok && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
                <p>{state.message}</p>
                {state.duplicateClient && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2.5">
                    <p className="font-semibold text-slate-900">{state.duplicateClient.name}</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Client ID: {state.duplicateClient.beneficiaryNumber} · {state.duplicateClient.categoryName}
                    </p>
                    <Link
                      href={`${officerMode ? "/officer/beneficiaries" : "/admin/beneficiaries"}?q=${encodeURIComponent(state.duplicateClient.beneficiaryNumber)}`}
                      className="mt-2 inline-flex text-xs font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800"
                    >
                      View existing client record
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div data-wizard-step="1" hidden={step !== 1} className="space-y-6">
            <section aria-labelledby="personal-info-heading" className="rounded-xl border border-[#E4EAF3] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 border-b border-[#E8EDF4] pb-3">
                <h3 id="personal-info-heading" className="text-sm font-bold text-[#0B1A3E] sm:text-base">Personal information</h3>
                <p className="mt-1 text-xs text-[#7184A0]">Enter the beneficiary&apos;s identity and classification.</p>
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

            <section aria-labelledby="classification-heading" className="rounded-xl border border-[#E4EAF3] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 border-b border-[#E8EDF4] pb-3">
                <h3 id="classification-heading" className="text-sm font-bold text-[#0B1A3E] sm:text-base">Classification</h3>
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

            <section aria-labelledby="contact-heading" className="rounded-xl border border-[#E4EAF3] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 border-b border-[#E8EDF4] pb-3">
                <h3 id="contact-heading" className="text-sm font-bold text-[#0B1A3E] sm:text-base">Contact &amp; address</h3>
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

            <section aria-labelledby="assignment-heading" className="rounded-xl border border-[#E4EAF3] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 border-b border-[#E8EDF4] pb-3">
                <h3 id="assignment-heading" className="text-sm font-bold text-[#0B1A3E] sm:text-base">Assignment</h3>
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
              </div>
            </section>
            </div>

            <section data-wizard-step="2" hidden={step !== 2} aria-labelledby="profile-image-heading" className="rounded-xl border border-[#E4EAF3] bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 border-b border-[#E8EDF4] pb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A88724]">Optional</p>
                <h3 id="profile-image-heading" className="mt-1 text-base font-bold text-[#0B1A3E] sm:text-lg">Profile photo</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#7184A0] sm:text-sm">Take a photo with your device camera or upload one. You can skip this step.</p>
              </div>
              <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-4">
                <FormField id="profileImageCapture" label="Take a profile photo" error={uploadErrors.profileImage ?? state.fieldErrors?.profileImage}>
                  <input
                    id="profileImageCapture"
                    name="profileImageCapture"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="user"
                    aria-invalid={Boolean(uploadErrors.profileImage ?? state.fieldErrors?.profileImage)}
                    onChange={(event) => handleImageSelection(event, "profileImageCapture", "profileImageUpload")}
                    className={inputClass}
                  />
                </FormField>
                <FormField id="profileImageUpload" label="Upload from device">
                  <input
                    id="profileImageUpload"
                    name="profileImageUpload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-invalid={Boolean(uploadErrors.profileImage ?? state.fieldErrors?.profileImage)}
                    onChange={(event) => handleImageSelection(event, "profileImageUpload", "profileImageCapture")}
                    className={inputClass}
                  />
                </FormField>
                {uploadErrors.profileImage ?? state.fieldErrors?.profileImage ? (
                  <p id="profileImage-error" className="text-xs text-rose-700">
                    {uploadErrors.profileImage ?? state.fieldErrors?.profileImage}
                  </p>
                ) : null}
                </div>
                <div className="sm:sticky sm:top-2">
                  <p className="mb-2 text-xs font-semibold text-[#405B80]">Photo preview</p>
                  <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl border border-[#E4EAF3] bg-[#F3F6FA]">
                    {imagePreviews.profileImageCapture || imagePreviews.profileImageUpload ? (
                      <Image
                        src={imagePreviews.profileImageCapture || imagePreviews.profileImageUpload}
                        alt="Preview of beneficiary profile photo"
                        width={440}
                        height={440}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-[#91A0B5]">
                        <UserPlus className="h-8 w-8 text-[#B7C4D7]" aria-hidden="true" />
                        Profile photo preview
                      </div>
                    )}
                  </div>
                  {(selectedFiles.profileImageCapture || selectedFiles.profileImageUpload) && (
                    <p className="mt-2 truncate text-center text-xs text-[#6480A9]">
                      {selectedFiles.profileImageCapture || selectedFiles.profileImageUpload}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#DCE3EE] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((current) => current - 1)}
                  disabled={pending}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] transition hover:bg-[#F4F7FB] disabled:opacity-50"
                >
                  Back
                </button>
              )}
            <button
              type="button"
              onClick={requestClose}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] transition hover:bg-[#F4F7FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/20 disabled:opacity-50"
            >
              Cancel
            </button>
            </div>
            {step < 2 ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={pending}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white transition hover:bg-[#172B4D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={pending || categories.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white transition hover:bg-[#172B4D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                {pending ? "Saving..." : "Save Beneficiary"}
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
