"use client";

import Link from "next/link";
import { useActionState } from "react";
import { setupAction } from "@/app/actions/auth";

const initialState = { ok: true, error: "" };

export default function SetupPage() {
  const [state, formAction, pending] = useActionState(setupAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-700">
            MS
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Initial setup</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Create administrator</h1>
        </div>

        <form action={formAction} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input id="name" name="name" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input id="email" name="email" type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input id="password" name="password" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
          </div>

          <div>
            <label htmlFor="setupKey" className="mb-2 block text-sm font-medium text-slate-700">
              Setup key
            </label>
            <input id="setupKey" name="setupKey" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
          </div>

          {!state.ok && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Setting up..." : "Create administrator"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already set up? {" "}
          <Link href="/login" className="font-semibold text-emerald-700">
            Go to login
          </Link>
        </div>
      </div>
    </main>
  );
}
