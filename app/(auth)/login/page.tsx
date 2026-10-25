"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  Eye,
  EyeOff,
  HeartHandshake,
  Landmark,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { loginAction } from "@/app/actions/auth";

const initialState = { ok: true, error: "" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="grid min-h-screen gap-px bg-[#071329] px-3 py-3 text-[#142d4e] sm:px-5 sm:py-5 lg:grid-cols-[1.08fr_0.92fr] lg:p-8">
      <section
        aria-label="MSWD information"
        className="relative isolate flex min-h-[300px] flex-col justify-between overflow-hidden rounded-t-[1.75rem] bg-[#0b2e59] bg-cover bg-center px-6 py-7 text-white sm:min-h-[350px] sm:px-10 sm:py-9 lg:min-h-[calc(100vh-4rem)] lg:rounded-l-[1.75rem] lg:rounded-tr-none lg:px-14 lg:py-12"
        style={{
          backgroundImage:
            "linear-gradient(125deg, rgba(7,31,67,0.96) 0%, rgba(7,56,131,0.86) 52%, rgba(5,105,179,0.78) 100%), url('/images/background.png')",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#FFD21F] via-white/80 to-[#E31837]" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 -z-10 h-[420px] w-[420px] rounded-full border border-white/15" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 -z-10 h-[310px] w-[310px] rounded-full border border-white/15" />

        <div className="flex items-center gap-4">
          <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white p-1.5 shadow-xl shadow-[#09264a]/35 sm:h-[88px] sm:w-[88px]">
            <Image
              src="/images/logo.png"
              width={400}
              height={400}
              alt="DSWD logo"
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-sm">DSWD</p>
            <p className="mt-1 max-w-xs text-sm font-medium leading-snug text-white sm:text-base">
              Department of Social Welfare and Development
            </p>
          </div>
        </div>

        <div className="max-w-xl py-7 sm:py-10 lg:py-16">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-white backdrop-blur-sm">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFE58A]">
            <span className="h-px w-7 bg-[#FFD21F]" />
            Mahayag Municipal Government
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Compassion in service. <span className="text-[#FFD21F]">Stronger</span> communities.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
            Your trusted workspace for delivering responsive social welfare services in Mahayag.
          </p>
        </div>

        <ul className="grid max-w-2xl grid-cols-2 gap-x-4 gap-y-3 border-t border-white/20 pt-5 text-xs font-medium text-white/90 sm:gap-x-7 sm:gap-y-4 sm:text-sm lg:grid-cols-2 xl:grid-cols-4">
          <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-[#FFD21F]" />Social Protection</li>
          <li className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 shrink-0 text-[#FFD21F]" />Empowerment</li>
          <li className="flex items-center gap-2"><UsersRound className="h-4 w-4 shrink-0 text-[#FFD21F]" />Community Development</li>
          <li className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 shrink-0 text-[#FFD21F]" />Inclusive Society</li>
        </ul>
      </section>

      <section className="flex min-h-[560px] items-center justify-center rounded-b-[1.75rem] bg-gradient-to-br from-[#f5f9ff] via-white to-[#fffaf0] px-5 py-10 sm:px-10 lg:min-h-[calc(100vh-4rem)] lg:rounded-b-none lg:rounded-r-[1.75rem] lg:px-8 xl:px-12">
        <div className="w-full max-w-[470px] rounded-3xl border border-white bg-white/90 p-6 shadow-[0_24px_70px_-32px_rgba(7,31,67,0.28)] ring-1 ring-[#0b4599]/[0.04] sm:p-9">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[#d6e5f5] bg-white p-0.5">
              <Image src="/images/logo.png" width={400} height={400} alt="DSWD logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0569b3]">DSWD</p>
              <p className="text-sm font-semibold text-[#142d4e]">Mahayag MSWD</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#073783]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#073783]">
              <span className="h-2 w-2 rounded-full bg-[#FFD21F]" />
              Secure staff access
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#142d4e]">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-[#7186a6]">Sign in to continue your work supporting the Mahayag community.</p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#142d4e]">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7186a6]" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="h-[54px] w-full rounded-xl border border-[#d6e5f5] bg-[#fbfdff] pl-12 pr-4 text-sm text-[#142d4e] outline-none transition placeholder:text-[#9aabc1] hover:border-[#a9c8e8] focus:border-[#0569b3] focus:bg-white focus:ring-4 focus:ring-[#0569b3]/10"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#142d4e]">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7186a6]" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-[54px] w-full rounded-xl border border-[#d6e5f5] bg-[#fbfdff] pl-12 pr-12 text-sm text-[#142d4e] outline-none transition placeholder:text-[#9aabc1] hover:border-[#a9c8e8] focus:border-[#0569b3] focus:bg-white focus:ring-4 focus:ring-[#0569b3]/10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#7186a6] transition hover:bg-[#e8f4ff] hover:text-[#0569b3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0569b3]/15"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {!state.ok && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="group mt-2 inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#073783] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(7,55,131,0.7)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0B4599] hover:shadow-[0_12px_24px_-8px_rgba(7,55,131,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0569b3]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {pending ? "Signing in..." : "Sign in to your account"}
              {!pending && <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>}
            </button>
          </form>

          <div className="mt-7 border-t border-[#e7eff8] pt-5 text-center text-sm text-[#7186a6]">
            Need an officer account?{" "}
            <Link href="/register" className="font-semibold text-[#0569b3] underline-offset-4 hover:text-[#0756b8] hover:underline">
              Register here
            </Link>
          </div>

          <div className="mt-7 flex items-center justify-center gap-2 text-center text-[11px] text-[#8ca0ba]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0B4599]" aria-hidden="true" />
            <span>Authorized staff access <span aria-hidden="true">·</span> MSWD Mahayag</span>
          </div>
        </div>
      </section>
    </main>
  );
}
