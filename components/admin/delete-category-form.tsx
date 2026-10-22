"use client";

import { useActionState } from "react";
import { deleteCategoryAction } from "@/app/actions/auth";

const initialState = { ok: true, message: "" };

export function DeleteCategoryForm({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const [state, formAction, pending] = useActionState(deleteCategoryAction, initialState);

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`Delete "${categoryName}"? This cannot be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="categoryId" value={categoryId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Deleting..." : "Delete"}
        </button>
      </form>
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={`mt-2 max-w-xs text-xs ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}
