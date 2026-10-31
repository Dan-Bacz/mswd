import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, FolderTree, HandHeart, Users } from "lucide-react";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/ui/metric-card";
import { ApproveOfficerForm } from "@/components/admin/approve-officer-form";
import { ResendApprovalEmailButton } from "@/components/admin/resend-approval-email-button";
import { DeleteOfficerForm } from "@/components/admin/delete-officer-form";
import { assignOfficerCategoriesAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function OfficerManagePage({
  params,
}: {
  params: Promise<{ officerId: string }>;
}) {
  const { officerId } = await params;
  const officer = await db.user.findUnique({
    where: { id: officerId },
    include: {
      role: true,
      staffIdDocument: {
        select: { fileName: true, originalName: true, mimeType: true, size: true, uploadedAt: true },
      },
      userCategories: { include: { category: true }, orderBy: { category: { name: "asc" } } },
    },
  });

  if (!officer || officer.role.name !== "OFFICER") {
    notFound();
  }

  const [categories, beneficiaryCount, assistanceCount] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.beneficiary.count({ where: { assignedOfficerId: officer.id } }),
    db.beneficiaryAssistance.count({ where: { providedById: officer.id } }),
  ]);

  const assignedCategoryIds = new Set(officer.userCategories.map((item) => item.categoryId));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/officers"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to officers
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{officer.name}</h1>
        <p className="mt-2 text-slate-600">{officer.position || "Position not recorded"}</p>
        <p className="mt-1 text-sm text-slate-500">{officer.email}</p>
      </div>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name details</p>
          <p className="mt-2 text-sm text-slate-700">
            First: <span className="font-medium">{officer.firstName || "—"}</span>
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Middle: <span className="font-medium">{officer.middleName || "—"}</span>
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Last: <span className="font-medium">{officer.lastName || "—"}</span>
          </p>
          <p className="mt-3 text-sm text-slate-700">
            Registered:{" "}
            <span className="font-medium">
              {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(officer.createdAt)}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Staff ID document</p>
          {officer.staffIdDocument ? (
            <div className="mt-2">
              <a
                href={`/admin/officers/${officer.id}/id`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                View ID document
              </a>
              <p className="mt-2 truncate text-xs text-slate-500">{officer.staffIdDocument.originalName}</p>
              <p className="mt-1 text-xs text-slate-400">
                {(officer.staffIdDocument.size / 1024).toFixed(1)} KB • uploaded{" "}
                {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(officer.staffIdDocument.uploadedAt)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-700">No ID document was uploaded.</p>
          )}
        </div>
      </section>

      {officer.status === "PENDING_APPROVAL" ? (
        <ApproveOfficerForm officerId={officer.id} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700">
          Account status:{" "}
          <span className={`font-semibold ${officer.status === "ACTIVE" ? "text-emerald-700" : "text-slate-600"}`}>
            {officer.status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
        </div>
      )}

      {officer.status === "ACTIVE" && !officer.approvalEmailSentAt && (
        <ResendApprovalEmailButton officerId={officer.id} />
      )}

      {officer.status === "ACTIVE" && <DeleteOfficerForm officerId={officer.id} officerName={officer.name} />}

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Assigned beneficiaries"
          value={String(beneficiaryCount)}
          hint="Beneficiary caseload"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Assistance recorded"
          value={String(assistanceCount)}
          hint="Assistance provided by this officer"
          icon={<HandHeart className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <FolderTree className="h-5 w-5 text-sky-700" />
            <h2 className="text-xl font-semibold text-slate-900">Assigned categories</h2>
          </div>
          {officer.status === "PENDING_APPROVAL" ? (
            <p className="text-sm text-slate-600">Approve this registration before assigning categories.</p>
          ) : (
            <form action={assignOfficerCategoriesAction} className="space-y-4">
              <input type="hidden" name="officerId" value={officer.id} />
              <fieldset className="space-y-2">
                <legend className="mb-2 block text-sm font-medium text-slate-700">
                  Select the categories this officer may access
                </legend>
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={category.id}
                      defaultChecked={assignedCategoryIds.has(category.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-800">{category.name}</span>
                      {category.description && (
                        <span className="mt-0.5 block text-xs text-slate-500">{category.description}</span>
                      )}
                    </span>
                  </label>
                ))}
              </fieldset>
              <button
                type="submit"
                className="w-full rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800"
              >
                Save assignments
              </button>
            </form>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Category dashboards</h2>
          </div>
          {officer.userCategories.length > 0 ? (
            <ul className="divide-y divide-slate-200">
              {officer.userCategories.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">{assignment.category.name}</span>
                  <Link
                    href={`/admin/categories/${assignment.categoryId}`}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                  >
                    Open dashboard
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-slate-500">
              No categories assigned yet. The officer cannot open any category dashboard.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
