"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { createBeneficiaryAction, type BeneficiaryActionState } from "@/app/actions/mswd";
import type { RegistryCategory, RegistryOfficer } from "@/components/admin/beneficiary-registry";

const initialState: BeneficiaryActionState = { ok: true, message: "" };
const lineInput = "min-w-0 w-full border-0 border-b border-[#111827] bg-transparent px-1 py-0.5 text-[10px] leading-tight text-[#111827] outline-none focus:border-[#0645AD] focus:ring-0";
const errorText = "mt-0.5 block text-[9px] text-red-700";

function LineField({ label, name, type = "text", required = false, error, className = "" }: { label: string; name: string; type?: string; required?: boolean; error?: string; className?: string }) {
  return (
    <label className={`flex min-w-0 items-end gap-1 text-[9px] leading-tight text-[#111827] ${className}`}>
      <span className="shrink-0">{label}{required ? "*" : ""}</span>
      <span className="min-w-0 flex-1"><input name={name} type={type} required={required} className={lineInput} />{error && <span className={errorText}>{error}</span>}</span>
    </label>
  );
}

function LineArea({ name, label = "", rows = 2, error }: { name: string; label?: string; rows?: number; error?: string }) {
  return <label className="block text-[9px] leading-tight text-[#111827]"><span className="font-semibold">{label}</span><textarea name={name} rows={rows} className="mt-0.5 block w-full resize-none border-0 border-b border-[#111827] bg-transparent px-1 py-0.5 text-[10px] leading-tight outline-none focus:border-[#0645AD] focus:ring-0" />{error && <span className={errorText}>{error}</span>}</label>;
}

function CheckField({ name, label }: { name: string; label: string }) {
  return <label className="flex items-center gap-1 text-[8px] leading-tight"><input type="checkbox" name={name} value={label} className="h-3 w-3 rounded-none border border-[#111827] accent-[#111827]" />{label}</label>;
}

export function GeneralIntakeOfficialFields({ category, officers, officerMode, fieldErrors }: { category: RegistryCategory; officers: RegistryOfficer[]; officerMode: boolean; fieldErrors?: Record<string, string> }) {
  const error = (field: string) => fieldErrors?.[field];
  return (
    <>
      <input type="hidden" name="categoryId" value={category.id} />
      <div className="mx-auto w-full max-w-[920px] border border-[#111827] bg-white p-3 text-[#111827] shadow-sm sm:p-6">
        <header className="grid grid-cols-[58px_1fr_58px] items-center border-b-2 border-[#111827] pb-2 sm:grid-cols-[78px_1fr_78px]">
          <Image src="/images/municipal-seal.png" alt="Municipality of Mahayag seal" width={78} height={78} className="h-14 w-14 object-contain sm:h-[72px] sm:w-[72px]" />
          <div className="text-center text-[8px] leading-[1.15] sm:text-[10px]"><p className="font-semibold">Republic of the Philippines</p><p>Municipality of Mahayag</p><p className="font-bold uppercase">Municipal Social Welfare and Development</p><p>MAHAYAG, ZAMBOANGA DEL SUR</p></div>
          <div className="border border-[#111827] text-center text-[12px] font-bold sm:text-[15px]">GENERAL<br />INTAKE SHEET</div>
        </header>
        <div className="mt-1 grid grid-cols-[1fr_155px] border border-[#111827] text-[8px]"><div className="p-1 font-bold uppercase">I. Client&apos;s identifying information:</div><div className="grid grid-cols-3 text-center"><span className="border-l border-[#111827] p-1">MONTH</span><span className="border-l border-[#111827] p-1">DAY</span><span className="border-l border-[#111827] p-1">YEAR</span></div></div>

        <section className="border-x border-b border-[#111827] p-2 text-[9px]">
          <div className="grid gap-1 sm:grid-cols-[1fr_1fr_1fr_1fr]"><LineField label="PCN" name="pcn" /><LineField label="Status:" name="clientStatus" /><span className="flex gap-3"><CheckField name="statusOption" label="Approved" /><CheckField name="statusOption" label="Disapproved" /></span><LineField label="Remarks" name="remarks" /></div>
          <div className="mt-1 grid gap-1 border-t border-[#111827] pt-1 sm:grid-cols-[1fr_1fr_1fr]"><LineField label="MOBILE NO." name="mobileNumber" type="tel" /><LineField label="Age*" name="age" type="number" /><label className="flex items-end gap-1">2. Sex*<select name="sex" defaultValue="MALE" required className={lineInput}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label></div>
          <div className="mt-1 grid gap-1 sm:grid-cols-[1.7fr_1fr]"><label className="flex min-w-0 items-end gap-1">1. Client&apos;s Name*<span className="grid min-w-0 flex-1 grid-cols-3 gap-1"><input name="lastName" placeholder="Last Name" required className={lineInput} /><input name="firstName" placeholder="First Name" required className={lineInput} /><input name="middleName" placeholder="Middle Name" className={lineInput} /></span></label><LineField label="Date of Birth*" name="dateOfBirth" type="date" required error={error("dateOfBirth")} /></div>
          <div className="mt-1"><LineField label="4. Present Address*" name="address" required error={error("address")} /></div>
          <div className="mt-1 grid gap-1 sm:grid-cols-[1.3fr_1fr_1fr]"><LineField label="5. Place of Birth" name="placeOfBirth" /><LineField label="6. Relationship to Beneficiary" name="relationshipToBeneficiary" /><LineField label="Barangay" name="barangay" /></div>
          <div className="mt-1 grid gap-1 sm:grid-cols-4"><LineField label="Civil Status" name="civilStatus" /><LineField label="8. Religion" name="religion" /><LineField label="9. Nationality" name="nationality" /><LineField label="Highest Educational Attainment" name="highestEducationalAttainment" /></div>
          <div className="mt-1 grid gap-1 sm:grid-cols-4"><LineField label="11. Skills/Occupation" name="occupation" /><LineField label="12. Estimated Monthly Income" name="monthlyIncome" type="number" /><LineField label="13. Philhealth No." name="philhealthNumber" /><LineField label="16. Contact #" name="contactNumber" type="tel" /></div>
          <div className="mt-1 grid gap-1 sm:grid-cols-3"><LineField label="14. Mode of Admission" name="modeOfAdmission" /><LineField label="15. Referring Party" name="referringParty" /><LineField label="Contact of Referring Party" name="contactPerson" /></div>
        </section>

        <section className="border-x border-b border-[#111827] p-2"><p className="text-[9px] font-bold uppercase">II. Beneficiary&apos;s family composition</p><div className="mt-1 overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-[8px]"><thead><tr>{["Last Name", "First Name", "Middle Name", "SEX", "Birthday", "Civil Status", "Relationship", "Skills/Occupation", "Est. Monthly Income"].map((heading) => <th key={heading} className="border border-[#111827] px-1 py-1 text-center">{heading}</th>)}</tr></thead><tbody>{Array.from({ length: 6 }, (_, index) => <tr key={index}>{Array.from({ length: 9 }, (_, cell) => <td key={cell} className="h-6 border border-[#111827] p-0.5"><input name="intakeFamilyMember" aria-label={`${headingLabel(cell)} ${index + 1}`} className="h-5 w-full border-0 bg-transparent px-1 text-[8px] outline-none focus:bg-blue-50" /></td>)}</tr>)}</tbody></table></div></section>

        <section className="border-x border-b border-[#111827] p-2 text-[9px]"><p className="font-bold uppercase">IV. Assessment</p><div className="mt-1 grid gap-2 sm:grid-cols-[1fr_1fr_1fr]"><LineArea name="assessmentProblemPresented" label="1. Problem Presented" rows={12} /><LineArea name="socialWorkersAssessment" label="2. Social Worker&apos;s Assessment" rows={12} /><div className="space-y-1 border-l border-[#111827] pl-2"><p className="font-bold">3. Client&apos;s Category (check only one)</p>{["Children in Need of Special Protection", "Youth in Need of Special Protection", "Person with Disability", "Senior Citizen", "Family Head and other Needy Adult"].map((label) => <CheckField key={label} name="clientCategory" label={label} />)}<LineArea name="clientSubCategory" label="4. Client Sub-Category" rows={4} /></div></div></section>

        <section className="border-x border-b border-[#111827] p-2 text-[9px]"><p className="font-bold">Financial Assistance</p><div className="mt-1 grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr]"><div className="space-y-1">{["Medical", "Burial", "Transportation", "Educational", "Food Subsidy", "Others"].map((label) => <CheckField key={label} name="financialAssistanceType" label={label} />)}<LineField label="Specify" name="financialAssistanceTypeOther" /></div><LineArea name="financialAssistanceValue" label="Value (Pesos)" rows={5} /><div className="space-y-2"><LineField label="Amount of Financial Assistance to be Extended" name="financialAssistanceAmount" type="number" /><LineField label="Mode of Financial Assistance" name="modeOfFinancialAssistance" /><LineField label="Source of Assistance" name="sourceOfAssistance" /></div></div><div className="mt-2 grid gap-2 border-t border-[#111827] pt-2 sm:grid-cols-[1fr_1fr]"><div><p className="font-bold">Material Assistance</p>{["Food Pack", "Used Clothing", "Hot Meal", "Assistive Device", "Others"].map((label) => <CheckField key={label} name="materialAssistanceType" label={label} />)}<LineField label="Specify" name="materialAssistanceSpecify" /></div><LineArea name="materialAssistanceSource" label="Source of Assistance" rows={3} /></div></section>

        <section className="border-x border-b border-[#111827] p-2 text-[9px]"><div className="grid gap-2 sm:grid-cols-3"><LineField label="Client&apos;s Signature" name="clientSignatureName" /><LineField label="Interviewed by" name="interviewedBy" /><LineField label="Date" name="intakeDate" type="date" /></div></section>
      </div>
      {!officerMode && <div className="mx-auto mt-4 max-w-[920px] rounded-lg border border-dashed border-[#9CB6DA] bg-[#F8FAFE] p-3"><p className="text-xs font-semibold text-[#173B70]">System assignment (not part of the official form)</p><label className="mt-2 block text-xs text-[#405B80]">Assigned officer<select name="assignedOfficerId" defaultValue="" className="mt-1 h-10 w-full rounded-lg border border-[#DCE3EE] bg-white px-3 text-sm"><option value="">Unassigned</option>{officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.name}</option>)}</select></label></div>}
    </>
  );
}

function headingLabel(index: number) {
  return ["Last Name", "First Name", "Middle Name", "Sex", "Birthday", "Civil Status", "Relationship", "Skills/Occupation", "Income"][index] ?? "Family member";
}

export function GeneralIntakePageForm({ category, officers, officerMode, backHref }: { category: RegistryCategory; officers: RegistryOfficer[]; officerMode: boolean; backHref: string }) {
  const [state, formAction, pending] = useActionState(createBeneficiaryAction, initialState);
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state.saved) window.location.assign(backHref); }, [backHref, state.saved]);

  function nextStep() {
    const fields = formRef.current?.querySelectorAll<HTMLElement>('[data-general-step="1"] input, [data-general-step="1"] select, [data-general-step="1"] textarea');
    const invalid = Array.from(fields ?? []).find((field): field is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) && !field.checkValidity());
    if (invalid) { invalid.reportValidity(); invalid.focus(); return; }
    setStep(2);
  }

  return <div className="mx-auto max-w-6xl space-y-5"><Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[#405B80] hover:text-[#0645AD]"><ArrowLeft className="h-4 w-4" />Back to beneficiaries</Link><header className="rounded-2xl border border-[#D9E5F5] bg-white p-5 shadow-sm sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B4599]">Beneficiary registry</p><h1 className="mt-2 text-2xl font-bold text-[#12335F] sm:text-3xl">New {category.name} beneficiary</h1><p className="mt-2 text-sm text-[#6480A9]">Complete the official General Intake Sheet. The document layout is preserved for office use.</p></header><div className="rounded-2xl border border-[#D9E5F5] bg-white p-4 shadow-sm sm:p-6"><div className="mb-5 grid grid-cols-2 gap-3">{[{ number: 1, label: "General intake sheet" }, { number: 2, label: "Profile photo" }].map((item) => <div key={item.number}><div className={`mb-2 h-1 rounded-full ${step >= item.number ? "bg-[#0645AD]" : "bg-[#E8EDF4]"}`} /><p className={`text-xs font-semibold ${step === item.number ? "text-[#0645AD]" : "text-[#91A0B5]"}`}>{String(item.number).padStart(2, "0")} {item.label}</p></div>)}</div><form ref={formRef} action={formAction} encType="multipart/form-data">{!state.ok && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{state.message}</div>}<div data-general-step="1" hidden={step !== 1}><GeneralIntakeOfficialFields category={category} officers={officers} officerMode={officerMode} fieldErrors={state.fieldErrors} /></div><section hidden={step !== 2} className="rounded-xl border border-[#E4EAF3] bg-[#F8FAFE] p-5 sm:p-7"><h2 className="text-lg font-bold text-[#0B1A3E]">Profile photo</h2><p className="mt-1 text-sm text-[#7184A0]">Optional. Capture a photo with the device camera or upload an image.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-[#172B4D]">Capture profile photo<input name="profileImageCapture" type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="mt-1.5 h-11 w-full rounded-lg border border-[#DCE3EE] bg-white px-3 py-2 text-xs" /></label><label className="text-sm font-medium text-[#172B4D]">Upload profile photo<input name="profileImageUpload" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1.5 h-11 w-full rounded-lg border border-[#DCE3EE] bg-white px-3 py-2 text-xs" /></label></div></section><footer className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#E8EDF4] pt-5"><Link href={backHref} className="inline-flex h-11 items-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] hover:bg-[#F4F7FB]">Cancel</Link><div className="flex gap-3">{step === 2 && <button type="button" onClick={() => setStep(1)} disabled={pending} className="inline-flex h-11 items-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] disabled:opacity-50">Back</button>}{step === 1 ? <button type="button" onClick={nextStep} disabled={pending} className="inline-flex h-11 items-center rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white disabled:opacity-50">Next</button> : <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white disabled:opacity-50">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{pending ? "Saving..." : "Save beneficiary"}</button>}</div></footer></form></div></div>;
}
