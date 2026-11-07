"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { createBeneficiaryAction, type BeneficiaryActionState } from "@/app/actions/mswd";
import { SoloParentApplicationFields, type RegistryCategory, type RegistryOfficer } from "@/components/admin/beneficiary-registry";

const initialState: BeneficiaryActionState = { ok: true, message: "" };

export function SoloParentPageForm({
  category,
  officers,
  officerMode,
  backHref,
}: {
  category: RegistryCategory;
  officers: RegistryOfficer[];
  officerMode: boolean;
  backHref: string;
}) {
  const [state, formAction, pending] = useActionState(createBeneficiaryAction, initialState);
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.saved) window.location.assign(backHref);
  }, [backHref, state.saved]);

  function nextStep() {
    const controls = formRef.current?.querySelectorAll<HTMLElement>(
      '[data-solo-step="1"] input, [data-solo-step="1"] select, [data-solo-step="1"] textarea',
    );
    const invalid = Array.from(controls ?? []).find(
      (control): control is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
        control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement
          ? !control.checkValidity()
          : false,
    );
    if (invalid) {
      invalid.reportValidity();
      invalid.focus();
      return;
    }
    setStep(2);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[#405B80] hover:text-[#0645AD]"><ArrowLeft className="h-4 w-4" />Back to beneficiaries</Link>
      <header className="rounded-2xl border border-[#D9E5F5] bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B4599]">Beneficiary registry</p>
        <h1 className="mt-2 text-2xl font-bold text-[#12335F] sm:text-3xl">New Solo Parent beneficiary</h1>
        <p className="mt-2 text-sm text-[#6480A9]">Complete the official Solo Parent application form. This page is dedicated to the Solo Parent program.</p>
      </header>

      <div className="rounded-2xl border border-[#D9E5F5] bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 grid grid-cols-2 gap-3" aria-label={`Step ${step} of 2`}>
          {[{ number: 1, label: "Application form" }, { number: 2, label: "Profile photo" }].map((item) => (
            <div key={item.number} aria-current={step === item.number ? "step" : undefined}>
              <div className={`mb-2 h-1 rounded-full ${step >= item.number ? "bg-[#0645AD]" : "bg-[#E8EDF4]"}`} />
              <p className={`text-xs font-semibold ${step === item.number ? "text-[#0645AD]" : "text-[#91A0B5]"}`}>{String(item.number).padStart(2, "0")} {item.label}</p>
            </div>
          ))}
        </div>

        <form ref={formRef} action={formAction} encType="multipart/form-data">
          {!state.ok && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{state.message}</div>}
          <div data-solo-step="1" hidden={step !== 1}>
            <SoloParentApplicationFields
              categories={[category]}
              officers={officers}
              officerMode={officerMode}
              categoryId={category.id}
              onCategoryChange={() => undefined}
              fieldErrors={state.fieldErrors}
            />
          </div>
          <section hidden={step !== 2} className="rounded-xl border border-[#E4EAF3] bg-[#F8FAFE] p-5 sm:p-7">
            <h2 className="text-lg font-bold text-[#0B1A3E]">Profile photo</h2>
            <p className="mt-1 text-sm text-[#7184A0]">Optional. Capture a photo with the device camera or upload an image.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[#172B4D]">Capture profile photo<input name="profileImageCapture" type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="mt-1.5 h-11 w-full rounded-lg border border-[#DCE3EE] bg-white px-3 py-2 text-xs" /></label>
              <label className="text-sm font-medium text-[#172B4D]">Upload profile photo<input name="profileImageUpload" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1.5 h-11 w-full rounded-lg border border-[#DCE3EE] bg-white px-3 py-2 text-xs" /></label>
            </div>
          </section>
          <footer className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#E8EDF4] pt-5">
            <Link href={backHref} className="inline-flex h-11 items-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] hover:bg-[#F4F7FB]">Cancel</Link>
            <div className="flex gap-3">
              {step === 2 && <button type="button" onClick={() => setStep(1)} disabled={pending} className="inline-flex h-11 items-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] disabled:opacity-50">Back</button>}
              {step === 1 ? <button type="button" onClick={nextStep} disabled={pending} className="inline-flex h-11 items-center rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white disabled:opacity-50">Next</button> : <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white disabled:opacity-50">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{pending ? "Saving..." : "Save beneficiary"}</button>}
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
