import { CalendarDays, ClipboardList, HandHeart } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { AssistanceForm } from "@/components/assistance/assistance-form";
import { ASSISTANCE_TYPE_LABELS } from "@/lib/assistance";

type BeneficiaryOption = Prisma.BeneficiaryGetPayload<{
  include: { category: true };
}>;

type AssistanceRecord = Prisma.BeneficiaryAssistanceGetPayload<{
  include: {
    beneficiary: { include: { category: true } };
    providedBy: { select: { name: true } };
  };
}>;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function AssistanceManagement({
  beneficiaries,
  records,
  subtitle,
}: {
  beneficiaries: BeneficiaryOption[];
  records: AssistanceRecord[];
  subtitle: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0B1A3E]">
          <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
          Assistance management
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Assistance</h1>
        <p className="mt-2 text-slate-600">{subtitle}</p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <AssistanceForm beneficiaries={beneficiaries} />

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <ClipboardList className="h-5 w-5 text-[#0B1A3E]" aria-hidden="true" />
                Assistance records
              </h2>
              <p className="mt-1 text-sm text-slate-500">Services recorded as already provided.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {records.length}
            </span>
          </div>

          {records.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <CalendarDays className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-slate-900">No assistance recorded yet</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Assistance entries will appear here after a provided service is recorded.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Assistance</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Recorded by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id} className="align-top hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatDate(record.providedAt)}</td>
                      <td className="min-w-48 px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {record.beneficiary.lastName}, {record.beneficiary.firstName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{record.beneficiary.beneficiaryNumber}</p>
                      </td>
                      <td className="min-w-36 px-4 py-3 text-sm text-slate-600">{record.beneficiary.category.name}</td>
                      <td className="min-w-40 px-4 py-3 text-sm font-medium text-slate-800">
                        {record.type === "OTHER"
                          ? record.otherType
                          : ASSISTANCE_TYPE_LABELS[record.type]}
                      </td>
                      <td className="max-w-56 px-4 py-3 text-sm text-slate-600">{record.notes || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{record.providedBy.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
