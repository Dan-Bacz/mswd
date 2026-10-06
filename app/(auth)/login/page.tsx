"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";

const initialState = { ok: true, error: "", redirectTo: undefined as string | undefined };

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-2xl font-bold text-sky-700">
            MS
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600">Municipal Social Welfare</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Sign in</h1>
        </div>

        <form action={formAction} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none"
              placeholder="officer@mswd.gov"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-sky-500 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {!state.ok && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Need the initial admin setup? {" "}
          <Link href="/setup" className="font-semibold text-sky-700">
            Create administrator
          </Link>
        </div>
      </div>
    </main>
  );
}
