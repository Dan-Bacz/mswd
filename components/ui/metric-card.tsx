import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent?: "blue" | "green" | "amber" | "violet";
}) {
  const accents = {
    blue: {
      icon: "bg-blue-50 text-blue-700 ring-blue-100",
      value: "text-[#123b68]",
      glow: "bg-blue-100/70",
      edge: "hover:border-blue-200",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      value: "text-emerald-800",
      glow: "bg-emerald-100/70",
      edge: "hover:border-emerald-200",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700 ring-amber-100",
      value: "text-amber-800",
      glow: "bg-amber-100/70",
      edge: "hover:border-amber-200",
    },
    violet: {
      icon: "bg-violet-50 text-violet-700 ring-violet-100",
      value: "text-violet-800",
      glow: "bg-violet-100/70",
      edge: "hover:border-violet-200",
    },
  } as const;
  const selectedAccent = accent ? accents[accent] : undefined;

  return (
    <div className={selectedAccent
      ? `group relative isolate h-full min-h-[158px] overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_-22px_rgba(15,35,65,0.5),0_4px_9px_-6px_rgba(15,35,65,0.2)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_38px_-22px_rgba(15,35,65,0.42),0_7px_14px_-8px_rgba(15,35,65,0.18)] ${selectedAccent.edge}`
      : "rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-25px_rgba(15,23,42,0.35)]"}>
      {selectedAccent && (
        <>
          <span className={`pointer-events-none absolute -right-8 -top-10 -z-10 h-28 w-28 rounded-full ${selectedAccent.glow}`} />
          <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
        </>
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className={`text-3xl font-bold tracking-tight ${selectedAccent?.value ?? "text-slate-900"}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_10px_-6px_currentColor] ring-1 ${selectedAccent?.icon ?? "bg-sky-100 text-sky-700 ring-sky-200"}`}>
          {icon}
        </div>
      </div>
      <p className="relative mt-4 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
