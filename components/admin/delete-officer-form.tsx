"use client";

import { useActionState } from "react";
import { deleteOfficerAction, permanentlyDeleteOfficerAction } from "@/app/actions/auth";

const initialState = { ok: true, message: "" };

export function DeleteOfficerForm({
  officerId,
  officerName,
  isActive,
}: {
  officerId: string;
  officerName: string;
  isActive: boolean;
}) {
  const [state, formAction, pending] = useActionState(deleteOfficerAction, initialState);
  const [permanentState, permanentFormAction, permanentPending] = useActionState(permanentlyDeleteOfficerAction, initialState);

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <h2 className="text-lg font-semibold text-rose-950">
        {isActive ? "Remove officer access" : "Officer access is already revoked"}
      </h2>
      <p className="mt-1 text-sm text-rose-900">
        {isActive
          ? `Deactivating ${officerName} will revoke category access and prevent login. Existing records will be preserved.`
          : `${officerName} cannot log in because this account is already inactive. Permanent deletion will retain linked history and transfer assistance records to the administrator.`}
      </p>
      {isActive && (
        <>
          <form
            action={formAction}
            className="mt-4"
            onSubmit={(event) => {
              if (!window.confirm(`Deactivate ${officerName}'s account and revoke access?`)) event.preventDefault();
            }}
          >
            <input type="hidden" name="officerId" value={officerId} />
            <button type="submit" disabled={pending} className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60">
              {pending ? "Removing access..." : "Deactivate officer account"}
            </button>
          </form>
          {state.message && <p role={state.ok ? "status" : "alert"} className={`mt-3 text-sm ${state.ok ? "text-emerald-800" : "text-rose-700"}`}>{state.message}</p>}
        </>
      )}
      <div className="mt-5 border-t border-rose-200 pt-4">
        <p className="text-xs text-rose-800">The system will transfer assistance, uploaded documents, assignments, and audit history to the administrator before deleting this account. Beneficiary profiles are preserved.</p>
        <form action={permanentFormAction} className="mt-3" onSubmit={(event) => { if (!window.confirm(`Permanently delete ${officerName}'s account and transfer its records to the administrator? This cannot be undone.`)) event.preventDefault(); }}>
          <input type="hidden" name="officerId" value={officerId} />
          <button type="submit" disabled={permanentPending} className="rounded-xl border border-rose-700 bg-white px-4 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60">
            {permanentPending ? "Deleting account..." : "Permanently delete account"}
          </button>
        </form>
        {permanentState.message && <p role={permanentState.ok ? "status" : "alert"} className={`mt-3 text-sm ${permanentState.ok ? "text-emerald-800" : "text-rose-700"}`}>{permanentState.message}</p>}
      </div>
    </div>
  );
}
