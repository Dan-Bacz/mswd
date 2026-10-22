"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type DashboardChartCategory = {
  name: string;
  beneficiaries: number;
  color: string;
};

export function BeneficiaryDistributionChart({
  categories,
}: {
  categories: DashboardChartCategory[];
}) {
  const total = categories.reduce((sum, category) => sum + category.beneficiaries, 0);
  const data = categories.filter((category) => category.beneficiaries > 0);

  return (
    <div className="grid items-center gap-5 md:grid-cols-[minmax(180px,0.85fr)_minmax(0,1.15fr)]">
      <div
        role="img"
        aria-label={`Beneficiary distribution across ${data.length} categories, ${total} beneficiaries total`}
        className="h-[220px] min-w-0"
      >
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="beneficiaries"
                nameKey="name"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="white"
                strokeWidth={2}
              >
                {data.map((category) => (
                  <Cell key={category.name} fill={category.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [Number(value).toLocaleString(), String(name)]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-full border-8 border-slate-100 text-sm text-slate-500">
            No beneficiary records yet
          </div>
        )}
        {total > 0 && (
          <div className="pointer-events-none -mt-[140px] text-center">
            <p className="text-2xl font-bold text-[#063B91]">{total.toLocaleString()}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6480A9]">Beneficiaries</p>
          </div>
        )}
      </div>

      <div className="max-h-[250px] space-y-2 overflow-y-auto pr-1">
        {categories.map((category) => {
          const percentage = total > 0 ? Math.round((category.beneficiaries / total) * 100) : 0;
          return (
            <div key={category.name} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-[#F4F7FC]">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: category.color }} />
                <span className="truncate text-xs font-medium text-slate-700">{category.name}</span>
              </div>
              <span className="shrink-0 text-xs text-[#6480A9]">
                {category.beneficiaries.toLocaleString()} <span className="ml-1 font-semibold text-[#173B70]">{percentage}%</span>
              </span>
            </div>
          );
        })}
        {categories.length === 0 && <p className="text-sm text-slate-500">No categories have been configured.</p>}
      </div>
    </div>
  );
}
