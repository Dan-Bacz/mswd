import { db } from "@/lib/db";

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
) {
  const start = new Date(`${dateRange.startDate}T00:00:00.000Z`);
  const endExclusive = new Date(`${dateRange.endDate}T00:00:00.000Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  const [beneficiaries, assistance] = await Promise.all([
    db.beneficiary.findMany({
      where: {
        ...(officerId ? { assignedOfficerId: officerId } : {}),
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
        ...(officerId ? { providedById: officerId } : {}),
        visitDate: { gte: start, lt: endExclusive },
      },
      select: {
        referenceNumber: true,
        type: true,
        otherType: true,
        visitDate: true,
        outcome: true,
        beneficiary: {
          select: {
            beneficiaryNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
          },
        },
      },
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return {
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
      beneficiaryNumber: record.beneficiary.beneficiaryNumber,
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
