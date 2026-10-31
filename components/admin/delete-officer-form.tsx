"use client";

import { useActionState } from "react";
import { deleteOfficerAction } from "@/app/actions/auth";

const initialState = { ok: true, message: "" };

export function DeleteOfficerForm({ officerId, officerName }: { officerId: string; officerName: string }) {
  const [state, formAction, pending] = useActionState(deleteOfficerAction, initialState);

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <h2 className="text-lg font-semibold text-rose-950">Remove officer access</h2>
      <p className="mt-1 text-sm text-rose-900">
        Deactivating {officerName} will revoke category access and prevent login. Existing records will be preserved.
      </p>
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
    </div>
  );
}
