"use client";

import { useActionState } from "react";
import { registerOfficerAction } from "@/app/actions/auth";

const initialState = { ok: true, message: "" };

export function OfficerRegistrationForm() {
  const [state, formAction, pending] = useActionState(registerOfficerAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10"
        />
        <p className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>
      </div>

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
        disabled={pending}
        className="w-full rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit registration"}
      </button>
    </form>
  );
}
