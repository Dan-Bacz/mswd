"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { createBeneficiaryAction, type BeneficiaryActionState } from "@/app/actions/mswd";
import type { RegistryCategory, RegistryOfficer } from "@/components/admin/beneficiary-registry";
import { MAHAYAG_BARANGAYS } from "@/lib/locations";

const initialState: BeneficiaryActionState = { ok: true, message: "" };
const inputClass = "h-full w-full border-0 border-b border-black/70 bg-white/30 px-1 text-[10px] leading-none text-black outline-none focus:border-blue-700 focus:bg-white/70";

type OverlayFieldProps = { name: string; label?: string; type?: string; required?: boolean; left: string; top: string; width: string; height?: string; className?: string };

function OverlayField({ name, label, type = "text", required, left, top, width, height = "2.4%", className = "" }: OverlayFieldProps) {
  return <label className={`absolute z-10 ${className}`} style={{ left, top, width, height }}><span className="sr-only">{label ?? name}</span><input name={name} type={type} required={required} className={inputClass} /></label>;
}

function OverlayArea({ name, label, left, top, width, height, required = false }: Omit<OverlayFieldProps, "type" | "height"> & { height: string }) {
  return <label className="absolute z-10" style={{ left, top, width, height }}><span className="sr-only">{label ?? name}</span><textarea name={name} required={required} className="h-full w-full resize-none border border-black/60 bg-white/20 px-1 text-[10px] text-black outline-none focus:bg-white/70" /></label>;
}

function OverlayCheck({ name, value, left, top, label }: { name: string; value: string; left: string; top: string; label?: string }) {
  return <label className="absolute z-20 flex items-center gap-1 text-[9px] leading-none text-black" style={{ left, top }}><input type="checkbox" name={name} value={value} className="h-3 w-3 accent-black" /><span className="sr-only">{label ?? value}</span></label>;
}

function OfficialPage({ number, children }: { number: number; children: React.ReactNode }) {
  return <section data-vawc-step={number} className="relative mx-auto aspect-[1191/1684] w-full max-w-[900px] overflow-hidden bg-white shadow-sm"><img src={`/forms/annex-d-vawc/page-${number}.png`} alt={`Annex D VAW Intake Form page ${number}`} className="absolute inset-0 h-full w-full select-none" draggable={false} />{children}</section>;
}

function PageOne() {
  return <OfficialPage number={1}>
    <OverlayField name="vawcIntakeDate" label="Date of intake" type="date" required left="57%" top="13.5%" width="35%" />
    <OverlayField name="vawcInterviewedBy" label="Interviewed by" required left="12%" top="16.8%" width="37%" />
    <OverlayField name="vawcInterviewerPosition" label="Position" left="57%" top="16.8%" width="35%" />
    <OverlayField name="vawcHandlingOrganization" label="Handling organization" required left="12%" top="20.1%" width="37%" />
    <OverlayField name="vawcOfficeAddress" label="Office address" left="57%" top="20.1%" width="35%" />
    <OverlayField name="vawcReportingType" label="Type of reporting" left="12%" top="23.8%" width="37%" />
    <OverlayField name="vawcInformantName" label="Informant name" left="57%" top="23.8%" width="35%" />
    <OverlayField name="vawcInformantRelationship" label="Informant relationship" left="12%" top="27.2%" width="37%" />
    <OverlayField name="vawcInformantContact" label="Informant contact" left="57%" top="27.2%" width="35%" />
    <OverlayField name="lastName" label="Victim last name" required left="15%" top="37.6%" width="23%" />
    <OverlayField name="firstName" label="Victim first name" required left="40%" top="37.6%" width="23%" />
    <OverlayField name="middleName" label="Victim middle name" left="65%" top="37.6%" width="25%" />
    <OverlayField name="vawcVictimExtension" label="Name extension" left="15%" top="40.5%" width="23%" />
    <OverlayField name="sex" label="Sex" required left="40%" top="40.5%" width="18%" />
    <OverlayField name="dateOfBirth" label="Birthdate" type="date" required left="64%" top="40.5%" width="26%" />
    <OverlayField name="vawcVictimPlaceOfBirth" label="Place of birth" left="15%" top="43.6%" width="38%" />
    <OverlayField name="address" label="Address" required left="55%" top="43.6%" width="35%" />
    <OverlayField name="vawcVictimNationality" label="Nationality" left="15%" top="46.6%" width="23%" />
    <OverlayField name="vawcVictimCivilStatus" label="Civil status" left="40%" top="46.6%" width="23%" />
    <OverlayField name="vawcVictimReligion" label="Religion" left="65%" top="46.6%" width="25%" />
    <OverlayField name="contactNumber" label="Contact number" type="tel" left="15%" top="49.8%" width="38%" />
    <OverlayField name="vawcVictimAge" label="Age" type="number" left="55%" top="49.8%" width="35%" />
  </OfficialPage>;
}

function PageTwo() {
  return <OfficialPage number={2}>
    <OverlayField name="vawcVictimEthnicity" label="Ethnicity" left="15%" top="12.8%" width="30%" />
    <OverlayField name="vawcVictimOccupation" label="Occupation" left="47%" top="12.8%" width="38%" />
    <OverlayField name="vawcVictimMonthlyIncome" label="Monthly income" type="number" left="15%" top="17.3%" width="30%" />
    <OverlayField name="vawcVictimEmployment" label="Employment" left="47%" top="17.3%" width="38%" />
    <OverlayField name="vawcVictimMigratoryStatus" label="Migratory status" left="15%" top="21.8%" width="30%" />
    <OverlayField name="vawcVictimReligionDetails" label="Religion details" left="47%" top="21.8%" width="38%" />
    <OverlayArea name="vawcVictimCurrentAddress" label="Current address" required left="15%" top="27%" width="70%" height="7%" />
    <OverlayField name="vawcShelterDetails" label="Shelter details" left="15%" top="37.2%" width="70%" />
    <OverlayCheck name="vawcInShelter" value="Yes" label="Staying in shelter yes" left="15%" top="41.4%" />
    <OverlayCheck name="vawcInShelter" value="No" label="Staying in shelter no" left="30%" top="41.4%" />
    <OverlayCheck name="vawcIsPwd" value="Yes" label="PWD yes" left="15%" top="48%" />
    <OverlayCheck name="vawcIsPwd" value="No" label="PWD no" left="30%" top="48%" />
    {['Orthopedic', 'Visual', 'Psychosocial', 'Speech', 'Hearing', 'Learning', 'Mental', 'Other'].map((value, index) => <OverlayCheck key={value} name="vawcDisabilityType" value={value} label={value} left={`${55 + (index % 2) * 18}%`} top={`${48 + Math.floor(index / 2) * 2.6}%`} />)}
  </OfficialPage>;
}

function PageThree() {
  const incidentTypes = ["Physical", "Sexual", "Psychological", "Economic", "Rape", "Trafficking in persons", "Sexual harassment", "Child abuse, exploitation, and discrimination", "Gender-based streets and public spaces sexual harassment", "Others, specify"];
  return <OfficialPage number={3}>{incidentTypes.map((value, index) => <OverlayCheck key={value} name="vawcIncidentType" value={value} label={value} left={`${15 + (index % 2) * 38}%`} top={`${12 + Math.floor(index / 2) * 4.2}%`} />)}<OverlayField name="vawcIncidentOtherCategory" label="Other category" left="15%" top="37%" width="70%" /><OverlayField name="vawcIncidentSubcategory" label="Subcategory" left="15%" top="42%" width="70%" /><OverlayArea name="vawcIncidentNotes" label="Incident notes" left="15%" top="49%" width="70%" height="18%" /></OfficialPage>;
}

function PageFour() {
  return <OfficialPage number={4}><OverlayArea name="vawcIncidentDescription" label="Description of incident" required left="12%" top="14%" width="76%" height="37%" /><OverlayField name="vawcIncidentDate" label="Incident date" type="date" required left="15%" top="55%" width="30%" /><OverlayField name="vawcIncidentTime" label="Incident time" type="time" left="52%" top="55%" width="33%" /><OverlayField name="vawcIncidentLocation" label="Geographic location" required left="15%" top="60%" width="70%" /><OverlayField name="vawcIncidentPlaceType" label="Type of place" left="15%" top="65%" width="70%" /><OverlayCheck name="vawcElectronicMeans" value="Yes" label="Electronic means yes" left="15%" top="71%" /><OverlayCheck name="vawcElectronicMeans" value="No" label="Electronic means no" left="30%" top="71%" /><OverlayField name="vawcElectronicMedium" label="Electronic medium" left="15%" top="75%" width="70%" /></OfficialPage>;
}

function PageFive({ officerMode, officers }: { officerMode: boolean; officers: RegistryOfficer[] }) {
  return <OfficialPage number={5}><OverlayField name="vawcPerpetratorLastName" label="Perpetrator last name" required left="15%" top="13.2%" width="23%" /><OverlayField name="vawcPerpetratorFirstName" label="Perpetrator first name" required left="40%" top="13.2%" width="23%" /><OverlayField name="vawcPerpetratorMiddleName" label="Perpetrator middle name" left="65%" top="13.2%" width="25%" /><OverlayField name="vawcPerpetratorSex" label="Perpetrator sex" left="15%" top="17.5%" width="22%" /><OverlayField name="vawcPerpetratorBirthdate" label="Perpetrator birthdate" type="date" left="40%" top="17.5%" width="23%" /><OverlayField name="vawcPerpetratorAge" label="Perpetrator age" type="number" left="65%" top="17.5%" width="25%" /><OverlayField name="vawcPerpetratorGuardian" label="Parent or guardian" left="15%" top="22%" width="70%" /><OverlayField name="vawcPerpetratorNationality" label="Nationality" left="15%" top="26.5%" width="30%" /><OverlayField name="vawcPerpetratorOccupation" label="Occupation" left="47%" top="26.5%" width="38%" /><OverlayField name="vawcPerpetratorReligion" label="Religion" left="15%" top="31%" width="30%" /><OverlayField name="vawcPerpetratorAddress" label="Current address" required left="47%" top="31%" width="38%" />{['Current/former spouse or partner', 'Parent', 'Child', 'Relative', 'Employer', 'Teacher', 'Stranger', 'Friend', 'Others, specify'].map((value, index) => <OverlayCheck key={value} name="vawcPerpetratorRelationship" value={value} label={value} left={`${15 + (index % 3) * 25}%`} top={`${37 + Math.floor(index / 3) * 4}%`} />)}<div className="absolute left-[8%] top-[64%] z-10 w-[84%] rounded border border-dashed border-blue-400 bg-white/90 p-2 text-[10px] text-slate-700"><p className="font-semibold">System fields required to save this beneficiary</p><div className="mt-1 grid gap-2 sm:grid-cols-2"><label>Barangay<select name="barangay" required className="mt-1 h-7 w-full border border-slate-400 bg-white px-1 text-[10px]"><option value="">Select barangay</option>{MAHAYAG_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}</select></label>{!officerMode && <label>Assigned officer<select name="assignedOfficerId" defaultValue="" className="mt-1 h-7 w-full border border-slate-400 bg-white px-1 text-[10px]"><option value="">Unassigned</option>{officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.name}</option>)}</select></label>}</div><div className="mt-2 grid gap-2 sm:grid-cols-2"><label>Optional profile photo<input name="profileImageCapture" type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="mt-1 block w-full text-[9px]" /></label><label>Upload profile photo<input name="profileImageUpload" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[9px]" /></label></div></div></OfficialPage>;
}

export function VawcIntakePageForm({ category, officers, officerMode, backHref }: { category: RegistryCategory; officers: RegistryOfficer[]; officerMode: boolean; backHref: string }) {
  const [state, formAction, pending] = useActionState(createBeneficiaryAction, initialState);
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.saved) window.location.assign(backHref); }, [backHref, state.saved]);
  function nextStep() {
    const controls = formRef.current?.querySelectorAll<HTMLElement>(`[data-vawc-step="${step}"] input, [data-vawc-step="${step}"] select, [data-vawc-step="${step}"] textarea`);
    const invalid = Array.from(controls ?? []).find((control): control is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) && !control.checkValidity());
    if (invalid) { invalid.reportValidity(); invalid.focus(); return; }
    setStep((current) => Math.min(current + 1, 5));
  }
  return <div className="mx-auto max-w-6xl space-y-5"><Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[#405B80] hover:text-[#0645AD]"><ArrowLeft className="h-4 w-4" />Back to beneficiaries</Link><header className="rounded-2xl border border-[#D9E5F5] bg-white p-5 shadow-sm sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B4599]">Official Annex D form</p><h1 className="mt-2 text-2xl font-bold text-[#12335F] sm:text-3xl">{category.name} beneficiary intake</h1><p className="mt-2 text-sm text-[#6480A9]">The original five-page government document is shown below unchanged. Complete each page and select Next.</p></header><div className="rounded-2xl border border-[#D9E5F5] bg-white p-3 shadow-sm sm:p-6"><div className="mb-5 grid grid-cols-5 gap-1" aria-label={`Page ${step} of 5`}>{[1, 2, 3, 4, 5].map((page) => <div key={page}><div className={`mb-2 h-1 rounded-full ${step >= page ? "bg-[#0645AD]" : "bg-[#E8EDF4]"}`} /><p className={`text-center text-[10px] font-semibold ${step === page ? "text-[#0645AD]" : "text-[#91A0B5]"}`}>Page {page}</p></div>)}</div><form ref={formRef} action={formAction} encType="multipart/form-data" noValidate><input type="hidden" name="categoryId" value={category.id} />{!state.ok && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{state.message}</div>}<div hidden={step !== 1}><PageOne /></div><div hidden={step !== 2}><PageTwo /></div><div hidden={step !== 3}><PageThree /></div><div hidden={step !== 4}><PageFour /></div><div hidden={step !== 5}><PageFive officerMode={officerMode} officers={officers} /></div><footer className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#E8EDF4] pt-5"><Link href={backHref} className="inline-flex h-11 items-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] hover:bg-[#F4F7FB]">Cancel</Link><div className="flex gap-3">{step > 1 && <button type="button" onClick={() => setStep((current) => current - 1)} disabled={pending} className="inline-flex h-11 items-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] disabled:opacity-50">Back</button>}{step < 5 ? <button type="button" onClick={nextStep} disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white disabled:opacity-50">Next</button> : <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white disabled:opacity-50">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{pending ? "Saving..." : "Save beneficiary"}</button>}</div></footer></form></div></div>;
}
