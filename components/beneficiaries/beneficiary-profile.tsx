"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { Save, UserCircle2 } from "lucide-react";
import { updateBeneficiaryAction, type BeneficiaryActionState } from "@/app/actions/mswd";
import { MAHAYAG_BARANGAYS } from "@/lib/locations";
import { VawcIntakeProfile } from "@/components/beneficiaries/vawc-intake-profile";

const initialState: BeneficiaryActionState = { ok: true, message: "" };
const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100";

function fullName(beneficiary: { firstName: string; middleName: string | null; lastName: string; suffix: string | null }) {
  return [beneficiary.firstName, beneficiary.middleName, beneficiary.lastName, beneficiary.suffix].filter(Boolean).join(" ");
}

export function BeneficiaryProfile({
  beneficiary,
  canEdit,
  backHref,
}: {
  beneficiary: {
    id: string;
    beneficiaryNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffix: string | null;
    sex: string;
    dateOfBirth: string | null;
    age: number | null;
    civilStatus: string | null;
    contactNumber: string | null;
    email: string | null;
    address: string;
    barangay: string | null;
    municipality: string | null;
    province: string | null;
    categoryId: string;
    categoryName: string;
    assignedOfficerName: string | null;
    status: string;
    remarks: string | null;
    assistanceCount: number;
    hasPhoto: boolean;
    generalIntakeData: Record<string, unknown> | null;
    soloParentData: Record<string, unknown> | null;
  };
  canEdit: boolean;
  backHref: string;
}) {
  const [state, formAction, pending] = useActionState(updateBeneficiaryAction, initialState);
  const name = fullName(beneficiary);
  const dateOfBirth = beneficiary.dateOfBirth ? beneficiary.dateOfBirth.slice(0, 10) : "";
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href={backHref} className="text-sm font-semibold text-sky-700 hover:text-sky-900">← Back to beneficiaries</Link>
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {beneficiary.hasPhoto ? <Image src={`/api/beneficiaries/${beneficiary.id}/photo`} alt={`${name} profile photo`} fill unoptimized className="object-cover" /> : <UserCircle2 className="h-12 w-12 text-slate-300" />}
        </div>
        <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Client ID {beneficiary.beneficiaryNumber}</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{name}</h1><p className="mt-1 text-sm text-slate-600">{beneficiary.categoryName} · {beneficiary.status}</p></div>
      </header>
      {beneficiary.generalIntakeData && (beneficiary.categoryName.toLowerCase().includes("vawc") || (beneficiary.categoryName.toLowerCase().includes("special protection") && !beneficiary.categoryName.toLowerCase().includes("children in need of special protection"))) && <VawcIntakeProfile data={beneficiary.generalIntakeData} />}
      {canEdit ? (
        <form action={formAction} encType="multipart/form-data" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <input type="hidden" name="beneficiaryId" value={beneficiary.id} /><input type="hidden" name="categoryId" value={beneficiary.categoryId} />
          {(beneficiary.generalIntakeData || beneficiary.soloParentData) && <SavedFormDataEditor data={beneficiary.soloParentData ?? beneficiary.generalIntakeData ?? {}} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">First name<input name="firstName" required defaultValue={beneficiary.firstName} className={`${inputClass} mt-1.5`} /></label>
            <label className="text-sm font-medium text-slate-700">Middle name<input name="middleName" defaultValue={beneficiary.middleName ?? ""} className={`${inputClass} mt-1.5`} /></label>
            <label className="text-sm font-medium text-slate-700">Last name<input name="lastName" required defaultValue={beneficiary.lastName} className={`${inputClass} mt-1.5`} /></label>
            <label className="text-sm font-medium text-slate-700">Suffix<input name="suffix" defaultValue={beneficiary.suffix ?? ""} className={`${inputClass} mt-1.5`} /></label>
            <label className="text-sm font-medium text-slate-700">Sex<select name="sex" defaultValue={beneficiary.sex} className={`${inputClass} mt-1.5`}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label>
            <label className="text-sm font-medium text-slate-700">Date of birth<input name="dateOfBirth" type="date" defaultValue={dateOfBirth} className={`${inputClass} mt-1.5`} /></label>
            <label className="text-sm font-medium text-slate-700">Civil status<select name="civilStatus" defaultValue={beneficiary.civilStatus ?? ""} className={`${inputClass} mt-1.5`}><option value="">Select</option><option value="SINGLE">Single</option><option value="MARRIED">Married</option><option value="WIDOWED">Widowed</option><option value="SEPARATED">Separated</option><option value="DIVORCED">Divorced</option><option value="OTHERS">Others</option></select></label>
            <label className="text-sm font-medium text-slate-700">Contact number<input name="contactNumber" defaultValue={beneficiary.contactNumber ?? ""} className={`${inputClass} mt-1.5`} /></label>
            <label className="text-sm font-medium text-slate-700">Email<input name="email" type="email" defaultValue={beneficiary.email ?? ""} className={`${inputClass} mt-1.5`} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Address<input name="address" required defaultValue={beneficiary.address} className={`${inputClass} mt-1.5`} /></label>
            <label className="text-sm font-medium text-slate-700">Barangay<select name="barangay" required defaultValue={beneficiary.barangay ?? ""} className={`${inputClass} mt-1.5`}><option value="">Select barangay</option>{MAHAYAG_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Province<input name="province" defaultValue={beneficiary.province ?? ""} className={`${inputClass} mt-1.5`} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Profile photo<input name="profileImage" type="file" accept="image/jpeg,image/png,image/webp" className={`${inputClass} mt-1.5 h-auto py-2 text-xs`} /><span className="mt-1 block text-xs font-normal text-slate-500">Upload a new photo to replace the current one. Maximum 1 MB.</span></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Remarks<textarea name="remarks" defaultValue={beneficiary.remarks ?? ""} className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" /></label>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4"><button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"><Save className="h-4 w-4" />{pending ? "Saving..." : "Save changes"}</button>{state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>{state.message}</p>}</div>
        </form>
      ) : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Only the administrator or the officer assigned to this beneficiary can edit this profile.</p>}
      {!canEdit && (beneficiary.generalIntakeData || beneficiary.soloParentData) && <SavedFormDataReadOnly data={beneficiary.soloParentData ?? beneficiary.generalIntakeData ?? {}} />}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info label="Age" value={beneficiary.age === null ? "Not recorded" : String(beneficiary.age)} /><Info label="Municipality" value={beneficiary.municipality ?? "Not recorded"} /><Info label="Assigned officer" value={beneficiary.assignedOfficerName ?? "Unassigned"} /><Info label="Assistance records" value={String(beneficiary.assistanceCount)} /></section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div>; }

function displayFormValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function SavedFormDataEditor({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([key]) => !["firstName", "middleName", "lastName", "sex", "dateOfBirth", "address"].includes(key));
  if (!entries.length) return null;
  return <section className="mb-6 rounded-xl border border-sky-200 bg-sky-50/40 p-4"><h2 className="text-base font-semibold text-slate-900">Saved category form</h2><p className="mt-1 text-xs text-slate-600">Update the saved form responses below. Changes are saved with the beneficiary profile.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{entries.map(([key, value]) => <label key={key} className="text-sm font-medium text-slate-700"><span>{key.replace(/^vawc/, "").replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase())}</span><textarea name={`formField_${key}`} defaultValue={displayFormValue(value)} rows={Array.isArray(value) || displayFormValue(value).length > 100 ? 3 : 1} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" /></label>)}</div></section>;
}

function SavedFormDataReadOnly({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([key, value]) => value !== "" && !["firstName", "middleName", "lastName", "sex", "dateOfBirth", "address"].includes(key));
  if (!entries.length) return null;
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold text-slate-900">Saved category form</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2">{entries.map(([key, value]) => <div key={key}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key.replace(/^vawc/, "").replace(/([A-Z])/g, " $1")}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{displayFormValue(value)}</dd></div>)}</dl></section>;
}
