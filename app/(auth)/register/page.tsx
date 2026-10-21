import Link from "next/link";
import { OfficerRegistrationForm } from "@/components/auth/officer-registration-form";

export default function OfficerRegistrationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-2xl font-bold text-sky-700">
            MS
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Officer account</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Create an account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account must be approved by an administrator before you can sign in.
          </p>
        </div>

        <OfficerRegistrationForm />

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-sky-700 hover:underline">
            Go to login
          </Link>
        </p>
      </div>
    </main>
  );
}
