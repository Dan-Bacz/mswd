"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { createOfficerAction } from "@/app/actions/auth";

type CategoryOption = {
  id: string;
  name: string;
};

const initialState = {
  ok: true,
  message: "",
  saved: false,
  resetKey: 0,
};

function SaveOfficerButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#0B1A3E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172B4D] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating..." : "Create officer"}
    </button>
  );
}

export function CreateOfficerDialog({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction] = useActionState(createOfficerAction, initialState);
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
        className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#FFD21F] px-5 text-sm font-bold text-[#073783] shadow-sm transition hover:bg-[#ffe05a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A93F]/30 sm:self-auto"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add officer
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="create-officer-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-[#F7F9FC] p-0 shadow-2xl backdrop:bg-[#071329]/65 sm:w-[calc(100%-2rem)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#E4EAF3] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A88724]">Officer management</p>
            <h2 id="create-officer-title" className="mt-1 text-xl font-bold text-[#0B1A3E]">Add officer</h2>
            <p className="mt-1 text-sm text-[#7184A0]">Create an account and assign the categories the officer may access.</p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close add officer form"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#0B1A3E]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form key={state.resetKey} action={formAction} className="space-y-4 p-5 sm:p-6">
          {!state.ok && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.message}
            </p>
          )}
          {state.saved && (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {state.message}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="officer-first-name" className="mb-1.5 block text-sm font-medium text-slate-700">First name</label>
              <input
                id="officer-first-name"
                name="firstName"
                autoComplete="given-name"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15"
              />
            </div>
            <div>
              <label htmlFor="officer-middle-name" className="mb-1.5 block text-sm font-medium text-slate-700">Middle name <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                id="officer-middle-name"
                name="middleName"
                autoComplete="additional-name"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="officer-last-name" className="mb-1.5 block text-sm font-medium text-slate-700">Last name</label>
              <input
                id="officer-last-name"
                name="lastName"
                autoComplete="family-name"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15"
              />
            </div>
            <div>
              <label htmlFor="officer-position" className="mb-1.5 block text-sm font-medium text-slate-700">Position</label>
              <input
                id="officer-position"
                name="position"
                autoComplete="organization-title"
                required
                placeholder="e.g., Social Welfare Officer"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15"
              />
            </div>
          </div>
          <div>
            <label htmlFor="officer-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="officer-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15"
            />
          </div>
          <div>
            <label htmlFor="officer-password" className="mb-1.5 block text-sm font-medium text-slate-700">Temporary password</label>
            <input
              id="officer-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15"
            />
            <p className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>
          </div>
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-slate-700">Assigned categories</legend>
            {categories.length > 0 ? (
              <>
                <select
                  name="categoryIds"
                  multiple
                  size={Math.min(Math.max(categories.length, 3), 7)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C9A93F] focus:ring-4 focus:ring-[#C9A93F]/15"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">Hold Ctrl (Windows) or Command (Mac) to select multiple categories.</p>
              </>
            ) : (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                Add a category before creating an officer account.
              </p>
            )}
          </fieldset>

          <footer className="flex flex-col-reverse gap-2 border-t border-[#E4EAF3] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <SaveOfficerButton />
          </footer>
        </form>
      </dialog>
    </>
  );
}
