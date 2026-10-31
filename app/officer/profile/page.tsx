import { OfficerProfileForm } from "@/components/officer/officer-profile-form";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerProfilePage() {
  const user = await requireRole("OFFICER");
  const account = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      firstName: true, middleName: true, lastName: true, position: true,
      email: true, employeeId: true,
      profile: { select: { contactNumber: true, address: true, barangay: true, municipality: true, province: true, photoContent: true } },
    },
  });

  return <div className="mx-auto max-w-5xl space-y-6"><div><h1 className="text-3xl font-bold text-slate-900">My profile</h1><p className="mt-2 text-slate-600">Keep your MSWD officer information and photo current.</p></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><OfficerProfileForm profile={{ ...account, contactNumber: account.profile?.contactNumber ?? null, address: account.profile?.address ?? null, barangay: account.profile?.barangay ?? null, municipality: account.profile?.municipality ?? null, province: account.profile?.province ?? null }} hasPhoto={Boolean(account.profile?.photoContent)} /></section></div>;
}
