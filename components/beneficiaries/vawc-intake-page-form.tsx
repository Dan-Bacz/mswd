"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { createBeneficiaryAction, type BeneficiaryActionState } from "@/app/actions/mswd";
import type { RegistryCategory, RegistryOfficer } from "@/components/admin/beneficiary-registry";
import { MAHAYAG_BARANGAYS } from "@/lib/locations";

const initialState: BeneficiaryActionState = { ok: true, message: "" };
const inputClass = "h-full w-full border-0 bg-transparent px-1 text-[10px] leading-none text-black outline-none focus:bg-white/40";

type OverlayFieldProps = { name: string; label?: string; type?: string; required?: boolean; left: string; top: string; width: string; height?: string; className?: string };

function OverlayField({ name, label, type = "text", required = true, left, top, width, height = "2.4%", className = "" }: OverlayFieldProps) {
  return <label className={`absolute z-10 ${className}`} style={{ left, top, width, height }}><span className="sr-only">{label ?? name}</span><input name={name} type={type} required={required} className={inputClass} /></label>;
}

function OverlayArea({ name, label, left, top, width, height, required = true }: Omit<OverlayFieldProps, "type" | "height"> & { height: string }) {
  return <label className="absolute z-10" style={{ left, top, width, height }}><span className="sr-only">{label ?? name}</span><textarea name={name} required={required} className="h-full w-full resize-none border-0 bg-transparent px-1 text-[10px] text-black outline-none focus:bg-white/40" /></label>;
}

function OverlayCheck({ name, value, left, top, label }: { name: string; value: string; left: string; top: string; label?: string }) {
  return <label className="absolute z-20 flex items-center gap-1 text-[9px] leading-none text-black" style={{ left, top }}><input type="checkbox" name={name} value={value} className="h-3 w-3 accent-black" /><span className="sr-only">{label ?? value}</span></label>;
}

function OfficialPage({ number, children }: { number: number; children: React.ReactNode }) {
  return <section data-vawc-step={number} className="relative mx-auto aspect-[1191/1684] w-full max-w-[900px] overflow-hidden bg-white shadow-sm"><img src={`/forms/annex-d-vawc/page-${number}.png`} alt={`Annex D VAW Intake Form page ${number}`} className="absolute inset-0 h-full w-full select-none" draggable={false} />{children}</section>;
}

function PageOne() {
  return <OfficialPage number={1}>
    <OverlayField name="vawcIntakeDate" label="Date of intake" type="date" left="30%" top="31.8%" width="67%" />
    <OverlayField name="vawcInterviewedByLastName" label="Intake interviewer last name" left="30%" top="36.1%" width="15%" />
    <OverlayField name="vawcInterviewedBy" label="Intake interviewer first name" left="46%" top="36.1%" width="18%" />
    <OverlayField name="vawcInterviewerMiddleName" label="Intake interviewer middle name" left="65%" top="36.1%" width="17%" />
    <OverlayField name="vawcInterviewerExtension" label="Intake interviewer extension" required={false} left="83%" top="36.1%" width="14%" />
    <OverlayField name="vawcInterviewerPosition" label="Position" left="30%" top="40.5%" width="67%" />
    <OverlayField name="vawcHandlingOrganization" label="Handling organization" left="23%" top="45.2%" width="25%" />
    <OverlayField name="vawcOfficeAddress" label="Office address" left="61%" top="45.2%" width="36%" />
    <OverlayField name="vawcClientCode" label="Client code" left="23%" top="49.5%" width="25%" />
    <OverlayField name="vawcIncidentNumber" label="Incident number" left="61%" top="49.5%" width="36%" />
    <OverlayCheck name="vawcReportingType" value="Victim-survivor directly reported" label="Reported by victim-survivor" left="5.3%" top="52.1%" />
    <OverlayCheck name="vawcReportingType" value="Victim-survivor companion present" label="Victim-survivor companion present" left="5.3%" top="54.1%" />
    <OverlayCheck name="vawcReportingType" value="Reported by informant" label="Reported by informant" left="5.3%" top="56.2%" />
    <OverlayField name="vawcInformantName" label="Name of informant" required={false} left="31%" top="58.8%" width="66%" />
    <OverlayField name="vawcInformantRelationship" label="Relationship to victim-survivor" required={false} left="31%" top="61.8%" width="66%" />
    <OverlayField name="vawcInformantContact" label="Contact information" required={false} left="31%" top="64.9%" width="66%" />
    <OverlayField name="lastName" label="Victim last name" left="17%" top="70.8%" width="15%" />
    <OverlayField name="firstName" label="Victim first name" left="34%" top="70.8%" width="20%" />
    <OverlayField name="middleName" label="Victim middle name" left="55%" top="70.8%" width="17%" />
    <OverlayField name="vawcVictimExtension" label="Victim extension" required={false} left="73%" top="70.8%" width="11%" />
    <OverlayField name="vawcVictimAlias" label="Victim alias" required={false} left="85%" top="70.8%" width="12%" />
    <OverlayField name="sex" label="Sex assigned at birth" left="17%" top="78.3%" width="15%" />
    <OverlayField name="vawcVictimSogie" label="SOGIE" required={false} left="51%" top="78.3%" width="46%" />
    <OverlayField name="dateOfBirth" label="Birthdate" type="date" left="17%" top="84.9%" width="15%" />
    <OverlayField name="vawcVictimPlaceOfBirth" label="Place of birth" left="51%" top="84.9%" width="46%" />
    <OverlayField name="vawcVictimAge" label="Age" type="number" left="17%" top="92.2%" width="15%" />
    <OverlayField name="vawcVictimGuardian" label="Parent or guardian" required={false} left="51%" top="92.2%" width="46%" />
  </OfficialPage>;
}

function PageTwo() {
  return <OfficialPage number={2}>
    <OverlayField name="vawcVictimCivilStatus" label="Civil status" left="17%" top="15.3%" width="34%" />
    <OverlayField name="vawcVictimEducation" label="Educational attainment" left="63%" top="15.3%" width="34%" />
    <OverlayField name="vawcVictimNationality" label="Nationality" left="17%" top="23.3%" width="18%" />
    <OverlayField name="vawcVictimEthnicity" label="Ethnicity" left="44%" top="23.3%" width="23%" />
    <OverlayField name="vawcVictimOccupation" label="Occupation" left="70%" top="23.3%" width="27%" />
    <OverlayField name="vawcVictimMonthlyIncome" label="Monthly income" type="number" required={false} left="17%" top="29.5%" width="80%" />
    <OverlayField name="vawcVictimEmployment" label="Employment status" left="17%" top="36.6%" width="80%" />
    <OverlayField name="vawcVictimMigratoryStatus" label="Migratory status" left="17%" top="44.1%" width="80%" />
    <OverlayField name="vawcVictimReligionDetails" label="Religion" required={false} left="17%" top="50.6%" width="80%" />
    <OverlayArea name="vawcVictimCurrentAddress" label="Current address" required left="17%" top="55.2%" width="80%" height="5.2%" />
    <OverlayCheck name="vawcInternallyDisplaced" value="Yes" label="Internally displaced yes" left="17%" top="63.3%" />
    <OverlayCheck name="vawcInternallyDisplaced" value="No" label="Internally displaced no" left="17%" top="65.1%" />
    <OverlayCheck name="vawcIsPwd" value="No" label="PWD no" left="51%" top="65.2%" />
    <OverlayCheck name="vawcIsPwd" value="Yes" label="PWD yes" left="51%" top="67.1%" />
    {['Deaf or Hard of Hearing', 'Intellectual Disability', 'Learning Disability', 'Mental Disability', 'Orthopedic Disability', 'Physical Disability', 'Psychosocial Disability', 'Speech and Language Disability', 'Visual Disability'].map((value, index) => <OverlayCheck key={value} name="vawcDisabilityType" value={value} label={value} left={`${57 + (index > 3 ? 27 : 0)}%`} top={`${67 + (index % (index > 3 ? 5 : 4)) * 2.6}%`} />)}
    <OverlayArea name="contactNumber" label="Contact information" required={false} left="17%" top="89.8%" width="80%" height="6%" />
  </OfficialPage>;
}

function PageThree() {
  const leftPartner = ["Physical", "Sexual", "Psychological", "Economic"];
  const rape = ["Rape by sexual intercourse", "Rape by sexual assault", "Incest", "Statutory rape", "Marital rape"];
  const trafficking = ["Sexual exploitation", "Online sexual exploitation", "Forced labor", "Sale or removal of organs", "Prostitution", "Trafficking others"];
  const harassment = ["Verbal", "Physical", "Sexual undertones", "Others, specify"];
  const child = ["Child prostitution", "Sexual intercourse or lascivious conduct", "Others, specify"];
  const publicSpace = ["Catcalling/Wolf-whistling", "Misogynistic remarks", "Public masturbation", "Groping", "Offensive body gestures", "Intrusive gazing/Leering", "Stalking/Cyberstalking", "Uploading photos/videos", "Impersonating identities", "Others, specify"];
  const checks = (items: string[], left: string, top: number, step = 3.1) => items.map((value, index) => <OverlayCheck key={`${left}-${value}`} name="vawcIncidentType" value={value} label={value} left={left} top={`${top + index * step}%`} />);
  return <OfficialPage number={3}>{checks(leftPartner, "11%", 21)}{checks(rape, "52%", 21, 3.4)}{checks(trafficking, "11%", 35, 3.4)}{checks(harassment, "52%", 35, 3.4)}{checks(child, "11%", 50, 4)}{checks(publicSpace, "52%", 50, 3.4)}<OverlayField name="vawcIncidentOtherCategory" label="Other category" required={false} left="15%" top="76%" width="35%" /><OverlayField name="vawcIncidentSubcategory" label="Subcategory" required={false} left="62%" top="76%" width="35%" /></OfficialPage>;
}

function PageFour() {
  return <OfficialPage number={4}><OverlayArea name="vawcIncidentDescription" label="Description of incident" left="5%" top="21.5%" width="90%" height="29%" /><OverlayField name="vawcIncidentDate" label="Incident date" type="date" left="32%" top="54.1%" width="18%" /><OverlayField name="vawcIncidentTime" label="Incident time" required={false} type="time" left="78%" top="54.1%" width="19%" /><OverlayField name="vawcIncidentLocation" label="Geographic location" left="32%" top="58.8%" width="65%" /><OverlayCheck name="vawcIncidentPlaceType" value="Conjugal Home" label="Conjugal Home" left="32%" top="64.5%" /><OverlayCheck name="vawcIncidentPlaceType" value="School" label="School" left="52%" top="64.5%" /><OverlayCheck name="vawcIncidentPlaceType" value="Victim's Home" label="Victim's Home" left="32%" top="67.3%" /><OverlayCheck name="vawcIncidentPlaceType" value="Workplace" label="Workplace" left="52%" top="67.3%" /><OverlayCheck name="vawcIncidentPlaceType" value="Perpetrator's Home" label="Perpetrator's Home" left="32%" top="70.1%" /><OverlayCheck name="vawcIncidentPlaceType" value="Public Utility Vehicle" label="Public Utility Vehicle" left="52%" top="70.1%" /><OverlayCheck name="vawcIncidentPlaceType" value="Malls/Hotels" label="Malls or Hotels" left="32%" top="72.9%" /><OverlayCheck name="vawcIncidentPlaceType" value="Evacuation area" label="Evacuation area" left="78%" top="66%" /><OverlayField name="vawcIncidentPlaceOther" label="Other place" required={false} left="78%" top="71.3%" width="19%" /><OverlayCheck name="vawcElectronicMeans" value="No" label="Electronic means no" left="32%" top="77.7%" /><OverlayCheck name="vawcElectronicMeans" value="Yes" label="Electronic means yes" left="40%" top="77.7%" /><OverlayField name="vawcElectronicMedium" label="Electronic medium" required={false} left="60%" top="77.7%" width="37%" /><OverlayCheck name="vawcHarmfulTraditionalPractice" value="No" label="Harmful traditional practice no" left="32%" top="83.8%" /><OverlayCheck name="vawcHarmfulTraditionalPractice" value="Yes" label="Harmful traditional practice yes" left="40%" top="83.8%" /><OverlayField name="vawcHarmfulTraditionalPracticeDetails" label="Traditional practice" required={false} left="60%" top="83.8%" width="37%" /><OverlayCheck name="vawcConflictArea" value="Yes" label="Conflict area yes" left="39%" top="90.6%" /><OverlayCheck name="vawcConflictArea" value="No" label="Conflict area no" left="46%" top="90.6%" /><OverlayCheck name="vawcCalamityArea" value="Yes" label="Calamity area yes" left="85%" top="90.6%" /><OverlayCheck name="vawcCalamityArea" value="No" label="Calamity area no" left="92%" top="90.6%" /></OfficialPage>;
}

function PageFive() {
  return <OfficialPage number={5}><OverlayField name="vawcPerpetratorLastName" label="Perpetrator last name" left="18%" top="16.2%" width="14%" /><OverlayField name="vawcPerpetratorFirstName" label="Perpetrator first name" left="33%" top="16.2%" width="18%" /><OverlayField name="vawcPerpetratorMiddleName" label="Perpetrator middle name" required={false} left="52%" top="16.2%" width="16%" /><OverlayField name="vawcPerpetratorExtension" label="Perpetrator extension" required={false} left="69%" top="16.2%" width="11%" /><OverlayField name="vawcPerpetratorAlias" label="Perpetrator alias" required={false} left="81%" top="16.2%" width="16%" /><OverlayField name="vawcPerpetratorSex" label="Perpetrator sex" required={false} left="18%" top="21.2%" width="18%" /><OverlayField name="vawcPerpetratorBirthdate" label="Perpetrator birthdate" required={false} type="date" left="54%" top="21.2%" width="18%" /><OverlayField name="vawcPerpetratorPlaceOfBirth" label="Perpetrator place of birth" required={false} left="22%" top="25.8%" width="39%" /><OverlayField name="vawcPerpetratorAge" label="Perpetrator age" required={false} type="number" left="74%" top="25.8%" width="23%" /><OverlayField name="vawcPerpetratorGuardian" label="Parent or guardian" required={false} left="43%" top="31%" width="54%" /><OverlayField name="vawcPerpetratorNationality" label="Nationality" required={false} left="18%" top="36.2%" width="23%" /><OverlayField name="vawcPerpetratorOccupation" label="Occupation" required={false} left="62%" top="36.2%" width="35%" /><OverlayField name="vawcPerpetratorReligion" label="Religion" required={false} left="18%" top="42%" width="79%" /><OverlayArea name="vawcPerpetratorAddress" label="Current address" required left="18%" top="46.8%" width="79%" height="4%" />{['Current/former spouse/partner', 'Former spouse/partner', 'Current fiancé/dating relationship', 'Former fiancé/dating relationship', 'Neighbors/peers/coworkers/classmates', 'Immediate family members', 'Stepfamily members', 'Other relatives', 'Employer/manager/supervisor', 'Agent of employer', 'Teacher/instructor/professor', 'Coach/trainer', 'Religious leaders/workers', 'Community leaders/workers', 'Stranger', 'Unknown'].map((value, index) => <OverlayCheck key={value} name="vawcPerpetratorRelationship" value={value} label={value} left={`${20 + (index % 3) * 25}%`} top={`${54 + Math.floor(index / 3) * 3.8}%`} />)}</OfficialPage>;
}

function SystemFields({ officerMode, officers }: { officerMode: boolean; officers: RegistryOfficer[] }) {
  return <section className="mt-5 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4 text-sm text-slate-700"><p className="font-semibold">System fields</p><p className="mt-1 text-xs text-slate-500">These controls are outside the official Annex D document and are used to save and manage the beneficiary record.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label>Barangay<select name="barangay" required className="mt-1 h-10 w-full rounded border border-slate-300 bg-white px-2 text-sm"><option value="">Select barangay</option>{MAHAYAG_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}</select></label>{!officerMode && <label>Assigned officer<select name="assignedOfficerId" defaultValue="" className="mt-1 h-10 w-full rounded border border-slate-300 bg-white px-2 text-sm"><option value="">Unassigned</option>{officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.name}</option>)}</select></label>}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label>Optional profile photo<input name="profileImageCapture" type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="mt-1 block w-full text-xs" /></label><label>Upload optional profile photo<input name="profileImageUpload" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-xs" /></label></div></section>;
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
  return <div className="mx-auto max-w-6xl space-y-5"><Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[#405B80] hover:text-[#0645AD]"><ArrowLeft className="h-4 w-4" />Back to beneficiaries</Link><header className="rounded-2xl border border-[#D9E5F5] bg-white p-5 shadow-sm sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B4599]">Official Annex D form</p><h1 className="mt-2 text-2xl font-bold text-[#12335F] sm:text-3xl">{category.name} beneficiary intake</h1><p className="mt-2 text-sm text-[#6480A9]">The original five-page government document is shown below unchanged. Complete each page and select Next.</p></header><div className="rounded-2xl border border-[#D9E5F5] bg-white p-3 shadow-sm sm:p-6"><div className="mb-5 grid grid-cols-5 gap-1" aria-label={`Page ${step} of 5`}>{[1, 2, 3, 4, 5].map((page) => <div key={page}><div className={`mb-2 h-1 rounded-full ${step >= page ? "bg-[#0645AD]" : "bg-[#E8EDF4]"}`} /><p className={`text-center text-[10px] font-semibold ${step === page ? "text-[#0645AD]" : "text-[#91A0B5]"}`}>Page {page}</p></div>)}</div><form ref={formRef} action={formAction} encType="multipart/form-data" noValidate><input type="hidden" name="categoryId" value={category.id} />{!state.ok && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{state.message}</div>}<div hidden={step !== 1}><PageOne /></div><div hidden={step !== 2}><PageTwo /></div><div hidden={step !== 3}><PageThree /></div><div hidden={step !== 4}><PageFour /></div><div hidden={step !== 5}><PageFive /></div><div hidden={step !== 5}><SystemFields officerMode={officerMode} officers={officers} /></div><footer className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#E8EDF4] pt-5"><Link href={backHref} className="inline-flex h-11 items-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] hover:bg-[#F4F7FB]">Cancel</Link><div className="flex gap-3">{step > 1 && <button type="button" onClick={() => setStep((current) => current - 1)} disabled={pending} className="inline-flex h-11 items-center rounded-lg border border-[#DCE3EE] px-5 text-sm font-semibold text-[#405B80] disabled:opacity-50">Back</button>}{step < 5 ? <button type="button" onClick={nextStep} disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white disabled:opacity-50">Next</button> : <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B1A3E] px-5 text-sm font-semibold text-white disabled:opacity-50">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{pending ? "Saving..." : "Save beneficiary"}</button>}</div></footer></form></div></div>;
}
