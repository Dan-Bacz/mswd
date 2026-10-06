export function StatusBadge({ label, tone }: { label: string; tone: "blue" | "green" | "amber" | "red" | "slate" }) {
  const colors = {
    blue: "bg-sky-100 text-sky-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    slate: "bg-slate-200 text-slate-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>
      {label}
    </span>
  );
}
