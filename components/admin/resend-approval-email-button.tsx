"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { resendApprovalEmailAction } from "@/app/actions/auth";

const initialState = { ok: true, message: "" };

export function ResendApprovalEmailButton({ officerId }: { officerId: string }) {
  const [state, formAction, pending] = useActionState(resendApprovalEmailAction, initialState);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Approval email</p>
          <p className="mt-0.5 text-sm text-slate-500">
            {state.message || "The account is active, but delivery of the approval email is not yet recorded."}
          </p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="officerId" value={officerId} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MailCheck className="h-4 w-4" aria-hidden="true" />
            {pending ? "Sending..." : "Resend approval email"}
          </button>
        </form>
      </div>
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={`mt-2 text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}
