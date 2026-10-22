"use client";

import { useActionState, useState, type FormHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, HandHeart, LoaderCircle } from "lucide-react";
import { createAssistanceAction, type AssistanceActionState } from "@/app/actions/assistance";
import { ASSISTANCE_TYPE_OPTIONS } from "@/lib/assistance";

type BeneficiaryOption = {
  id: string;
  firstName: string;
  lastName: string;
  beneficiaryNumber: string;
  category: { name: string };
};

const initialState: AssistanceActionState = { ok: false, message: "", resetKey: 0 };

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs font-medium text-red-600">{message}</p> : null;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1A3E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#142b5e] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
      {pending ? "Saving assistance..." : "Save assistance record"}
    </button>
  );
}

function AssistanceFields({
  beneficiaries,
  action,
  errors,
}: {
  beneficiaries: BeneficiaryOption[];
  action: NonNullable<FormHTMLAttributes<HTMLFormElement>["action"]>;
  errors?: Record<string, string>;
}) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="assistance-beneficiary" className="mb-1.5 block text-sm font-medium text-slate-700">
          Beneficiary <span className="text-red-600">*</span>
        </label>
        <select
          id="assistance-beneficiary"
          name="beneficiaryId"
          required
          aria-invalid={Boolean(errors?.beneficiaryId)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0B1A3E] focus:ring-4 focus:ring-blue-900/10"
          defaultValue=""
        >
          <option value="" disabled>Select beneficiary</option>
          {beneficiaries.map((beneficiary) => (
            <option key={beneficiary.id} value={beneficiary.id}>
              {beneficiary.lastName}, {beneficiary.firstName} · {beneficiary.beneficiaryNumber} · {beneficiary.category.name}
            </option>
          ))}
        </select>
        <FieldError message={errors?.beneficiaryId} />
      </div>

      <div>
        <fieldset aria-invalid={Boolean(errors?.types)}>
          <legend className="mb-1.5 block text-sm font-medium text-slate-700">
            Assistance offered <span className="text-red-600">*</span>
          </legend>
          <p className="mb-3 text-xs text-slate-500">Select all assistance types provided.</p>
          <div className="space-y-2">
            {ASSISTANCE_TYPE_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="types"
                  value={value}
                  required
                  checked={selectedTypes.includes(value)}
                  onChange={(event) => {
                    setSelectedTypes((current) =>
                      event.target.checked
                        ? [...current, value]
                        : current.filter((type) => type !== value),
                    );
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-[#0B1A3E] focus:ring-[#0B1A3E]"
                />
                {value === "OTHER" ? `${label}:` : label}
              </label>
            ))}
          </div>
          <FieldError message={errors?.types} />
        </fieldset>
      </div>

      {selectedTypes.includes("OTHER") && (
        <div>
          <label htmlFor="other-assistance-type" className="mb-1.5 block text-sm font-medium text-slate-700">
            Describe the assistance <span className="text-red-600">*</span>
          </label>
          <input
            id="other-assistance-type"
            name="otherType"
            required
            maxLength={100}
            aria-invalid={Boolean(errors?.otherType)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0B1A3E] focus:ring-4 focus:ring-blue-900/10"
          />
          <FieldError message={errors?.otherType} />
        </div>
      )}

      <div>
        <label htmlFor="assistance-date" className="mb-1.5 block text-sm font-medium text-slate-700">
          Date provided <span className="text-red-600">*</span>
        </label>
        <input
          id="assistance-date"
          name="providedAt"
          type="date"
          required
          defaultValue={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })}
          aria-invalid={Boolean(errors?.providedAt)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0B1A3E] focus:ring-4 focus:ring-blue-900/10"
        />
        <FieldError message={errors?.providedAt} />
      </div>

      <div>
        <label htmlFor="assistance-notes" className="mb-1.5 block text-sm font-medium text-slate-700">
          Notes <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="assistance-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          aria-invalid={Boolean(errors?.notes)}
          className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0B1A3E] focus:ring-4 focus:ring-blue-900/10"
        />
        <FieldError message={errors?.notes} />
      </div>

      <SubmitButton />
    </form>
  );
}

export function AssistanceForm({ beneficiaries }: { beneficiaries: BeneficiaryOption[] }) {
  const [state, formAction] = useActionState(createAssistanceAction, initialState);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0B1A3E]">
          <HandHeart className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Record assistance provided</h2>
          <p className="mt-1 text-sm text-slate-500">Log a service the beneficiary has already received.</p>
        </div>
      </div>

      {state.message && (
        <div
          role={state.ok ? "status" : "alert"}
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
        >
          {state.ok && <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />}
          {state.message}
        </div>
      )}

      {beneficiaries.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No beneficiaries are available in your assigned categories.
        </p>
      ) : (
        <AssistanceFields
          key={state.resetKey}
          beneficiaries={beneficiaries}
          action={formAction}
          errors={state.fieldErrors}
        />
      )}
    </section>
  );
}
