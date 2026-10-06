import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [beneficiaries, cases, notifications] = await Promise.all([
    db.beneficiary.count({ where: { assignedOfficerId: user.id } }),
    db.case.count({ where: { assignedOfficerId: user.id } }),
    db.notification.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Officer reports</h1>
        <p className="mt-2 text-slate-600">Authorized activity snapshot only.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-sky-50 p-5">
          <p className="text-sm text-sky-700">My beneficiaries</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{beneficiaries}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-5">
          <p className="text-sm text-amber-700">My cases</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{cases}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">Notifications</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{notifications}</p>
        </div>
      </div>
    </div>
  );
}
