import Link from "next/link";
import Image from "next/image";
import { OfficerRegistrationForm } from "@/components/auth/officer-registration-form";

export default function OfficerRegistrationPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071329] px-4 py-8 sm:px-6 lg:px-8">
      <Image
        src="/images/background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#06152f]/90 via-[#0b3478]/75 to-[#071329]/90" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#FFD21F]/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/30 bg-white/95 shadow-[0_32px_100px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl lg:min-h-[680px] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#073783] p-10 text-white lg:flex xl:p-14">
          <Image
            src="/images/background.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 45vw, 0px"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#073783]/95 via-[#073783]/80 to-[#06152f]/95" />
          <div className="absolute -right-20 top-32 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-[10.5rem] h-44 w-44 rounded-full border border-[#FFD21F]/20" />

          <div className="relative z-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-xl shadow-black/10">
              <Image src="/images/logo.png" width={400} height={400} alt="Mahayag MSWD logo" className="h-full w-full object-contain" />
            </div>
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.28em] text-[#FFD21F]">Mahayag • Zamboanga del Sur</p>
            <h1 className="mt-4 max-w-md text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Serving our community, together.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-blue-100">
              Create your officer account to support the delivery of social welfare services in Mahayag.
            </p>
          </div>

          <div className="relative z-10">
            <div className="mb-4 flex h-1 overflow-hidden rounded-full" aria-hidden="true">
              <span className="w-1/3 bg-[#FFD21F]" />
              <span className="w-1/3 bg-[#E31837]" />
              <span className="w-1/3 bg-white" />
            </div>
            <p className="text-xs text-blue-100/80">Department of Social Welfare and Development</p>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-10 lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-16">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md ring-1 ring-slate-200">
              <Image src="/images/logo.png" width={400} height={400} alt="Mahayag MSWD logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0B4599]">Mahayag MSWD</p>
              <p className="text-xs text-slate-500">Zamboanga del Sur</p>
            </div>
          </div>

          <div className="mb-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#073783]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#073783]">
              <span className="h-2 w-2 rounded-full bg-[#FFD21F]" />
              Officer account registration
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Join our team</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Create your account to get started. An administrator will review your registration before you can sign in.
            </p>
          </div>

          <OfficerRegistrationForm />

          <p className="mt-7 text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-[#0B4599] underline-offset-4 hover:underline">
              Go to login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
