"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Save, UserCircle2 } from "lucide-react";
import { updateOfficerProfileAction } from "@/app/actions/auth";
import { MAHAYAG_BARANGAYS, MAHAYAG_MUNICIPALITY } from "@/lib/locations";

const initialState = { ok: true, message: "" };
const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100";

export function OfficerProfileForm({
  profile,
  hasPhoto,
}: {
  profile: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    position: string | null;
    email: string;
    employeeId: string | null;
    contactNumber: string | null;
    address: string | null;
    barangay: string | null;
    municipality: string | null;
    province: string | null;
  };
  hasPhoto: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateOfficerProfileAction, initialState);
  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <div className="relative mx-auto flex aspect-square w-44 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            {hasPhoto ? <Image src="/api/profile/photo" alt="Officer profile photo" fill unoptimized className="object-cover" /> : <UserCircle2 className="h-20 w-20 text-slate-300" />}
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Profile photo
            <input name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" className={`${inputClass} mt-2 h-auto py-2 text-xs`} />
          </label>
          <p className="text-xs text-slate-500">JPEG, PNG, or WebP up to 2 MB.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">First name<input name="firstName" required defaultValue={profile.firstName ?? ""} className={`${inputClass} mt-1.5`} /></label>
          <label className="text-sm font-medium text-slate-700">Middle name<input name="middleName" defaultValue={profile.middleName ?? ""} className={`${inputClass} mt-1.5`} /></label>
          <label className="text-sm font-medium text-slate-700">Last name<input name="lastName" required defaultValue={profile.lastName ?? ""} className={`${inputClass} mt-1.5`} /></label>
          <label className="text-sm font-medium text-slate-700">Position / designation<input name="position" required defaultValue={profile.position ?? ""} className={`${inputClass} mt-1.5`} /></label>
          <label className="text-sm font-medium text-slate-700">Email<input value={profile.email} readOnly className={`${inputClass} mt-1.5 bg-slate-50`} /></label>
          <label className="text-sm font-medium text-slate-700">Employee ID<input value={profile.employeeId ?? ""} readOnly className={`${inputClass} mt-1.5 bg-slate-50`} /></label>
          <label className="text-sm font-medium text-slate-700">Contact number<input name="contactNumber" defaultValue={profile.contactNumber ?? ""} className={`${inputClass} mt-1.5`} /></label>
          <label className="text-sm font-medium text-slate-700">Province<input name="province" defaultValue={profile.province ?? ""} className={`${inputClass} mt-1.5`} /></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Address<input name="address" defaultValue={profile.address ?? ""} className={`${inputClass} mt-1.5`} /></label>
          <label className="text-sm font-medium text-slate-700">Barangay<select name="barangay" defaultValue={profile.barangay ?? ""} className={`${inputClass} mt-1.5`}><option value="">Select barangay</option>{MAHAYAG_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Municipality<input name="municipality" defaultValue={profile.municipality ?? MAHAYAG_MUNICIPALITY} className={`${inputClass} mt-1.5`} /></label>
        </div>
      </div>
      {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>{state.message}</p>}
      <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"><Save className="h-4 w-4" />{pending ? "Saving..." : "Save profile"}</button>
    </form>
  );
}
