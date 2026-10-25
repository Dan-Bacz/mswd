"use client";

import { useActionState, useState } from "react";
import { registerOfficerAction } from "@/app/actions/auth";

const initialState = { ok: true, message: "" };

export function OfficerRegistrationForm() {
  const [state, formAction, pending] = useActionState(registerOfficerAction, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsDoNotMatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (password !== confirmPassword) {
          event.preventDefault();
        }
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          placeholder="Enter your full name"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0B4599] focus:bg-white focus:ring-4 focus:ring-[#0B4599]/10"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0B4599] focus:bg-white focus:ring-4 focus:ring-[#0B4599]/10"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0B4599] focus:bg-white focus:ring-4 focus:ring-[#0B4599]/10"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            aria-invalid={passwordsDoNotMatch}
            aria-describedby={passwordsDoNotMatch ? "password-mismatch" : undefined}
            className={`w-full rounded-xl border bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
              passwordsDoNotMatch
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200 focus:border-[#0B4599] focus:ring-[#0B4599]/10"
            }`}
          />
        </div>
      </div>
      <p
        id="password-mismatch"
        aria-live="polite"
        className={`text-xs ${passwordsDoNotMatch ? "text-rose-600" : "text-slate-500"}`}
      >
        {passwordsDoNotMatch ? "Passwords do not match yet." : "Use at least 8 characters for your password."}
      </p>

      {state.message && (
        <div
          role={state.ok ? "status" : "alert"}
          className={`rounded-xl border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || passwordsDoNotMatch || password.length === 0 || confirmPassword.length === 0}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#073783] px-4 py-3.5 font-semibold text-white shadow-lg shadow-[#073783]/15 transition hover:-translate-y-0.5 hover:bg-[#0B4599] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
      >
        {pending ? "Submitting registration..." : "Submit registration"}
        {!pending && <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>}
      </button>
    </form>
  );
}
