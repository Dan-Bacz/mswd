"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createCategoryAction } from "@/app/actions/auth";

const initialState: { ok: boolean; message: string; saved?: boolean } = {
  ok: true,
  message: "",
};

function SaveCategoryButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save category"}
    </button>
  );
}

export function CreateCategoryDialog() {
  const [state, formAction] = useActionState(createCategoryAction, initialState);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (state.saved) {
      dialogRef.current?.close();
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
      >
        Add new
      </button>
      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-950/50"
      >
        <form action={formAction} className="space-y-4 p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Add category</h2>
            <p className="mt-1 text-sm text-slate-600">Add a program category for beneficiaries and officers.</p>
          </div>

          {!state.ok && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.message}
            </p>
          )}

          <div>
            <label htmlFor="category-name" className="mb-2 block text-sm font-medium text-slate-700">
              Category name
            </label>
            <input
              id="category-name"
              name="name"
              minLength={2}
              maxLength={255}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              required
            />
          </div>
          <div>
            <label htmlFor="category-description" className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="category-description"
              name="description"
              rows={4}
              maxLength={255}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <SaveCategoryButton />
          </div>
        </form>
      </dialog>
    </>
  );
}
