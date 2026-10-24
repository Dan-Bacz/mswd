import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, HandHeart, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";
import { BeneficiaryRegistry } from "@/components/admin/beneficiary-registry";
import { getCurrentUser } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function OfficerCategoryDashboardPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const category = await db.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    notFound();
  }

  if (user.role !== "ADMIN" && !user.categoryIds.includes(categoryId)) {
    redirect("/officer/dashboard");
  }

  const [beneficiaryCount, assistanceCount, beneficiaries] = await Promise.all([
    db.beneficiary.count({ where: { categoryId, assignedOfficerId: user.id } }),
    db.beneficiaryAssistance.count({ where: { beneficiary: { categoryId } } }),
    db.beneficiary.findMany({
      where: { categoryId, assignedOfficerId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/officer/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Category dashboard</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{category.name}</h1>
        <p className="mt-2 text-slate-600">Manage your beneficiaries and view assistance recorded in this category.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="My beneficiaries"
          value={String(beneficiaryCount)}
          hint="Assigned to you in this category"
          icon={<UserRound className="h-5 w-5" />}
        />
        <MetricCard
          label="Assistance records"
          value={String(assistanceCount)}
          hint="Recorded for beneficiaries in this category"
          icon={<HandHeart className="h-5 w-5" />}
        />
      </div>

      <BeneficiaryRegistry
        categories={[{ id: category.id, name: category.name }]}
        filterCategories={[]}
        officers={[]}
        beneficiaries={beneficiaries.map((beneficiary) => ({
          id: beneficiary.id,
          beneficiaryNumber: beneficiary.beneficiaryNumber,
          fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
          categoryId: category.id,
          categoryName: category.name,
          barangay: beneficiary.barangay,
          officerName: user.name,
          status: beneficiary.status,
        }))}
        selectedCategoryId={category.id}
        officerMode
      />
    </div>
  );
}
