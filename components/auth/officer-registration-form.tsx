"use client";

import { useActionState, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { registerOfficerAction } from "@/app/actions/auth";
import { NationalIdCapture } from "@/components/auth/national-id-capture";

const initialState = { ok: true, message: "" };
const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0B4599] focus:bg-white focus:ring-4 focus:ring-[#0B4599]/10";

export function OfficerRegistrationForm() {
  const [state, formAction, pending] = useActionState(registerOfficerAction, initialState);
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [idFilesReady, setIdFilesReady] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);
  const profileCaptureRef = useRef<HTMLInputElement>(null);
  const profileUploadRef = useRef<HTMLInputElement>(null);
  const passwordsDoNotMatch = confirmPassword.length > 0 && password !== confirmPassword;

  function choosePhoto(kind: "capture" | "upload", file: File | undefined) {
    setPhotoSelected(Boolean(file));
    if (file && kind === "capture" && profileUploadRef.current) profileUploadRef.current.value = "";
    if (file && kind === "upload" && profileCaptureRef.current) profileCaptureRef.current.value = "";
  }

  return (
    <form action={formAction} encType="multipart/form-data" onSubmit={(event) => { if (password !== confirmPassword || !idFilesReady || !photoSelected) event.preventDefault(); }} className="space-y-5">
      <ol className="grid gap-2 sm:grid-cols-3" aria-label="Registration steps">
        {["Personal and ID", "Login information", "Profile image"].map((label, index) => {
          const number = index + 1;
          return <li key={label} className={`rounded-xl border px-3 py-2 text-center text-xs font-bold ${step === number ? "border-[#0B4599] bg-blue-50 text-[#073783]" : step > number ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}>Step {number}<span className="mt-0.5 block font-medium">{label}</span></li>;
        })}
      </ol>

      <div className={step === 1 ? "space-y-5" : "hidden"}>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Step 1: Personal information and National ID</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">Capture or upload both sides of the National ID. Readable identity information will be used to pre-fill the name fields for review.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">First name<input name="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required placeholder="First name" className={`${inputClass} mt-2`} /></label>
            <label className="text-sm font-semibold text-slate-700">Middle name <span className="font-normal text-slate-400">(optional)</span><input name="middleName" value={middleName} onChange={(event) => setMiddleName(event.target.value)} autoComplete="additional-name" placeholder="Middle name" className={`${inputClass} mt-2`} /></label>
            <label className="text-sm font-semibold text-slate-700">Last name<input name="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required placeholder="Last name" className={`${inputClass} mt-2`} /></label>
            <label className="text-sm font-semibold text-slate-700">Employee ID<input name="employeeId" required placeholder="MSWD employee ID" className={`${inputClass} mt-2`} /></label>
          </div>
        </section>

        <NationalIdCapture onFilesReady={setIdFilesReady} onIdentityFieldsChange={(fields) => { const parts = fields.name.trim().replace(/\s+/g, " ").split(" "); setFirstName(parts[0] ?? ""); setMiddleName(parts.length > 2 ? parts.slice(1, -1).join(" ") : ""); setLastName(parts.length > 1 ? parts[parts.length - 1] : ""); }} />
      </div>

      <div className={step === 2 ? "space-y-5" : "hidden"}>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Step 2: Login information</h2>
          <p className="mt-1 text-xs text-slate-600">Use an email address you can access. The account remains pending until administrator approval.</p>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={`${inputClass} mt-2`} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className={`${inputClass} pr-11`} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-[#0B4599]"><span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>{showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}</button></div></label>
              <label className="text-sm font-semibold text-slate-700">Confirm password<div className="relative mt-2"><input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" aria-invalid={passwordsDoNotMatch} className={`${inputClass} pr-11 ${passwordsDoNotMatch ? "border-rose-300" : ""}`} /><button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-[#0B4599]"><span className="sr-only">{showConfirmPassword ? "Hide confirm password" : "Show confirm password"}</span>{showConfirmPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}</button></div></label>
            </div>
            <p className={`text-xs ${passwordsDoNotMatch ? "text-rose-600" : "text-slate-500"}`}>{passwordsDoNotMatch ? "Passwords do not match yet." : "Use at least 8 characters for your password."}</p>
          </div>
        </section>
      </div>

      <div className={step === 3 ? "space-y-5" : "hidden"}>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Step 3: Profile image</h2>
          <p className="mt-1 text-xs text-slate-600">Capture a current face photo with your camera or upload one. It will appear in your officer profile and account menu after registration.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Capture profile image<input ref={profileCaptureRef} name="profilePhotoCapture" type="file" accept="image/jpeg,image/png,image/webp" capture="user" required={!photoSelected} onChange={(event) => choosePhoto("capture", event.currentTarget.files?.[0])} className={`${inputClass} mt-2 h-auto py-2 text-xs`} /></label>
            <label className="text-sm font-semibold text-slate-700">Upload profile image<input ref={profileUploadRef} name="profilePhotoUpload" type="file" accept="image/jpeg,image/png,image/webp" required={!photoSelected} onChange={(event) => choosePhoto("upload", event.currentTarget.files?.[0])} className={`${inputClass} mt-2 h-auto py-2 text-xs`} /></label>
          </div>
          <p className="mt-3 text-xs text-slate-500">Choose one image only. JPEG, PNG, or WebP up to 2 MB.</p>
        </section>
      </div>

      {state.message && <div role={state.ok ? "status" : "alert"} className={`rounded-xl border px-3 py-2 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{state.message}</div>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1 || pending} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Back</button>
        {step < 3 ? <button type="button" onClick={() => setStep((current) => current + 1)} disabled={pending || (step === 1 && !idFilesReady) || (step === 2 && (password.length < 8 || passwordsDoNotMatch))} className="rounded-xl bg-[#073783] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B4599] disabled:cursor-not-allowed disabled:opacity-50">Continue</button> : <button type="submit" disabled={pending || !idFilesReady || !photoSelected || passwordsDoNotMatch || password.length < 8} className="rounded-xl bg-[#073783] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B4599] disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Submitting registration..." : "Submit registration for manual review"}</button>}
      </div>
    </form>
  );
}
