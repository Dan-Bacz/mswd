"use client";

import { useActionState } from "react";
import { approveOfficerAction } from "@/app/actions/auth";

const initialState = { ok: true, message: "" };

export function ApproveOfficerForm({ officerId }: { officerId: string }) {
  const [state, formAction, pending] = useActionState(approveOfficerAction, initialState);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-lg font-semibold text-amber-950">Registration awaiting approval</h2>
      <p className="mt-1 text-sm text-amber-900">
        Approving activates this account and sends an approval email to the officer.
      </p>
      <form action={formAction} className="mt-4">
        <input type="hidden" name="officerId" value={officerId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending approval..." : "Approve and notify officer"}
        </button>
      </form>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`mt-3 text-sm ${state.ok ? "text-emerald-800" : "text-rose-700"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
