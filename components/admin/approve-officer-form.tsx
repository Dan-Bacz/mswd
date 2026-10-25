"use client";

import { useActionState } from "react";
import { approveOfficerAction, rejectOfficerAction } from "@/app/actions/auth";

const initialState = { ok: true, message: "" };

export function ApproveOfficerForm({ officerId }: { officerId: string }) {
  const [approvalState, approveAction, approving] = useActionState(approveOfficerAction, initialState);
  const [rejectionState, rejectAction, rejecting] = useActionState(rejectOfficerAction, initialState);
  const state = rejectionState.message ? rejectionState : approvalState;
  const pending = approving || rejecting;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-lg font-semibold text-amber-950">Registration awaiting approval</h2>
      <p className="mt-1 text-sm text-amber-900">Choose whether to approve or reject this registration. The officer will be notified by email.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <form action={approveAction}>
          <input type="hidden" name="officerId" value={officerId} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {approving ? "Sending approval..." : "Approve and notify officer"}
          </button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="officerId" value={officerId} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {rejecting ? "Sending rejection..." : "Reject and notify officer"}
          </button>
        </form>
      </div>
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
