import { db } from "@/lib/db";
import { isPwdCategory } from "@/lib/utils";
import { ASSISTANCE_TYPE_VALUES } from "@/lib/assistance";

export type ReportDateRange = {
  startDate: string;
  endDate: string;
};

function isValidDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getReportDateRange(
  requestedStart?: string,
  requestedEnd?: string,
): ReportDateRange {
  const today = new Date().toISOString().slice(0, 10);
  const startDate = isValidDate(requestedStart) ? requestedStart : `${today.slice(0, 4)}-01-01`;
  const endDate = isValidDate(requestedEnd) ? requestedEnd : today;

  return startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };
}

export async function getReportData(
  dateRange: ReportDateRange,
  officerId?: string,
  categoryId?: string,
  categoryIds?: string[],
) {
  const start = new Date(`${dateRange.startDate}T00:00:00.000Z`);
  const endExclusive = new Date(`${dateRange.endDate}T00:00:00.000Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const pwdCategories = await db.category.findMany({ select: { id: true, name: true } });
  const excludedCategoryIds = pwdCategories.filter((category) => isPwdCategory(category.name)).map((category) => category.id);
  const [beneficiaries, assistance] = await Promise.all([
    db.beneficiary.findMany({
      where: {
        ...(officerId && !categoryIds ? { assignedOfficerId: officerId } : {}),
        categoryId: {
          ...(categoryIds ? { in: categoryIds } : categoryId ? { equals: categoryId } : {}),
          ...(excludedCategoryIds.length ? { notIn: excludedCategoryIds } : {}),
        },
        registrationDate: { gte: start, lt: endExclusive },
      },
      select: {
        beneficiaryNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        registrationDate: true,
        status: true,
        barangay: true,
        category: { select: { name: true } },
      },
      orderBy: { registrationDate: "desc" },
    }),
    db.beneficiaryAssistance.findMany({
      where: {
        ...(officerId && !categoryIds ? { providedById: officerId } : {}),
        beneficiary: {
          categoryId: {
            ...(categoryIds ? { in: categoryIds } : categoryId ? { equals: categoryId } : {}),
            ...(excludedCategoryIds.length ? { notIn: excludedCategoryIds } : {}),
          },
        },
        visitDate: { gte: start, lt: endExclusive },
      },
      select: {
        referenceNumber: true,
        type: true,
        otherType: true,
        visitDate: true,
        purpose: true,
        requestedDescription: true,
        outcome: true,
        providedDescription: true,
        medicineCount: true,
        medicineQuantity: true,
        itemQuantity: true,
        providerName: true,
        doctorName: true,
        financialAmount: true,
        financialType: true,
        transactionDetails: true,
        providedAt: true,
        notProvidedReason: true,
        referralDetails: true,
        followUpReason: true,
        followUpNotes: true,
        internalRemarks: true,
        createdAt: true,
        providedBy: { select: { id: true, name: true } },
        beneficiary: {
          select: {
            beneficiaryNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return {
    assistanceTypes: [...ASSISTANCE_TYPE_VALUES],
    beneficiaries: beneficiaries.map((beneficiary) => ({
      beneficiaryNumber: beneficiary.beneficiaryNumber,
      fullName: [
        beneficiary.firstName,
        beneficiary.middleName,
        beneficiary.lastName,
        beneficiary.suffix,
      ]
        .filter(Boolean)
        .join(" "),
      registrationDate: beneficiary.registrationDate.toISOString(),
      categoryName: beneficiary.category.name,
      barangay: beneficiary.barangay ?? "",
      status: beneficiary.status,
    })),
    assistance: assistance.map((record) => ({
      referenceNumber: record.referenceNumber,
      type: record.type,
      otherType: record.otherType ?? "",
      visitDate: record.visitDate.toISOString().slice(0, 10),
      outcome: record.outcome,
      purpose: record.purpose,
      requestedDescription: record.requestedDescription,
      providedDescription: record.providedDescription ?? "",
      medicineCount: record.medicineCount,
      medicineQuantity: record.medicineQuantity,
      itemQuantity: record.itemQuantity,
      providerName: record.providerName ?? "",
      doctorName: record.doctorName ?? "",
      financialAmount: record.financialAmount === null ? null : Number(record.financialAmount),
      financialType: record.financialType ?? "",
      transactionDetails: record.transactionDetails ?? "",
      providedAt: record.providedAt?.toISOString().slice(0, 10) ?? "",
      notProvidedReason: record.notProvidedReason ?? "",
      referralDetails: record.referralDetails ?? "",
      followUpReason: record.followUpReason ?? "",
      followUpNotes: record.followUpNotes ?? "",
      internalRemarks: record.internalRemarks ?? "",
      staffId: record.providedBy.id,
      staffName: record.providedBy.name,
      beneficiaryNumber: record.beneficiary.beneficiaryNumber,
      categoryName: record.beneficiary.category.name,
      beneficiaryName: [
        record.beneficiary.firstName,
        record.beneficiary.middleName,
        record.beneficiary.lastName,
        record.beneficiary.suffix,
      ]
        .filter(Boolean)
        .join(" "),
    })),
  };
}
