import { OfficerProfileForm } from "@/components/officer/officer-profile-form";
import { db } from "@/lib/db";
import { requireSelectedOfficerCategory } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerProfilePage() {
  const { user } = await requireSelectedOfficerCategory();
  const account = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      firstName: true, middleName: true, lastName: true,
      email: true, employeeId: true,
      profile: { select: { contactNumber: true, address: true, barangay: true, municipality: true, province: true, photoContent: true } },
      staffIdDocument: { select: { frontContent: true, backContent: true, content: true } },
    },
  });

  return <div className="mx-auto max-w-5xl space-y-6"><div><h1 className="text-3xl font-bold text-slate-900">My profile</h1><p className="mt-2 text-slate-600">Keep your MSWD officer information and photo current.</p></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><OfficerProfileForm profile={{ ...account, contactNumber: account.profile?.contactNumber ?? null, address: account.profile?.address ?? null, barangay: account.profile?.barangay ?? null, municipality: account.profile?.municipality ?? null, province: account.profile?.province ?? null }} hasPhoto={Boolean(account.profile?.photoContent)} /></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">My National ID</h2><p className="mt-1 text-sm text-slate-600">Your saved ID images are private and visible only to you and authorized administrators.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{(account.staffIdDocument?.frontContent || account.staffIdDocument?.content) && <img src="/api/profile/id?side=front" alt="National ID front" className="max-h-72 w-full rounded-xl border border-slate-200 object-contain" />}{account.staffIdDocument?.backContent && <img src="/api/profile/id?side=back" alt="National ID back" className="max-h-72 w-full rounded-xl border border-slate-200 object-contain" />}</div></section></div>;
}
