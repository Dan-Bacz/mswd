"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/permissions";
import { ASSISTANCE_OUTCOME_VALUES, ASSISTANCE_TYPE_VALUES } from "@/lib/assistance";

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, "Choose a valid date.");

const assistanceSchema = z
  .object({
    recordId: z.string().trim(),
    beneficiaryId: z.string().trim().min(1, "Select an existing beneficiary."),
    type: z.enum(ASSISTANCE_TYPE_VALUES),
    otherType: z.string().trim().max(100, "Keep the description under 100 characters."),
    visitDate: dateSchema,
    purpose: z.string().trim().min(1, "Enter the reason for the visit.").max(1000),
    requestedDescription: z.string().trim().min(1, "Describe the requested assistance.").max(2000),
    outcome: z.enum(ASSISTANCE_OUTCOME_VALUES),
    providedDescription: z.string().trim().max(2000),
    providedAt: z.string().trim(),
    notProvidedReason: z.string().trim().max(1000),
    referralDetails: z.string().trim().max(1000),
    followUpReason: z.string().trim().max(1000),
    followUpNotes: z.string().trim().max(1000),
    internalRemarks: z.string().trim().max(2000),
    medicineCount: z.coerce.number().int().min(0).max(100000).optional(),
    providerName: z.string().trim().max(200).optional(),
    financialAmount: z.coerce.number().min(0).max(100000000).optional(),
    financialType: z.string().trim().max(100).optional(),
    transactionDetails: z.string().trim().max(1000).optional(),
    printProof: z.string().trim(),
  })
  .superRefine((value, context) => {
    if (value.type === "OTHER" && !value.otherType) {
      context.addIssue({
        code: "custom",
        path: ["otherType"],
        message: "Specify the other assistance type.",
      });
    }

    if (value.outcome === "PROVIDED") {
      if (!value.providedDescription) {
        context.addIssue({
          code: "custom",
          path: ["providedDescription"],
          message: "Describe the assistance or service delivered.",
        });
      }
      const providedDate = dateSchema.safeParse(value.providedAt);
      if (!providedDate.success) {
        context.addIssue({
          code: "custom",
          path: ["providedAt"],
          message: "Choose the date assistance was provided.",
        });
      }
    }

    if (value.outcome === "NOT_PROVIDED" && !value.notProvidedReason) {
      context.addIssue({
        code: "custom",
        path: ["notProvidedReason"],
        message: "Explain why assistance was not provided.",
      });
    }

    if (value.outcome === "REFERRED" && !value.referralDetails) {
      context.addIssue({
        code: "custom",
        path: ["referralDetails"],
        message: "Provide the referral details.",
      });
    }

    if (value.outcome === "FOLLOW_UP") {
      if (!value.followUpReason) {
        context.addIssue({
          code: "custom",
          path: ["followUpReason"],
          message: "Enter the reason follow-up is needed.",
        });
      }
      if (!value.followUpNotes) {
        context.addIssue({
          code: "custom",
          path: ["followUpNotes"],
          message: "Enter the follow-up details.",
        });
      }
    }
  });

export type AssistanceActionState = {
  ok: boolean;
  message: string;
  resetKey: number;
  savedId?: string;
  printProof?: boolean;
  fieldErrors?: Record<string, string>;
};

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function saveAssistanceAction(
  previousState: AssistanceActionState,
  formData: FormData,
): Promise<AssistanceActionState> {
  const user = await requireAuth();
  const parsed = assistanceSchema.safeParse({
    recordId: String(formData.get("recordId") ?? ""),
    beneficiaryId: String(formData.get("beneficiaryId") ?? ""),
    type: String(formData.get("type") ?? ""),
    otherType: String(formData.get("otherType") ?? ""),
    visitDate: String(formData.get("visitDate") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
    requestedDescription: String(formData.get("requestedDescription") ?? ""),
    outcome: String(formData.get("outcome") ?? ""),
    providedDescription: String(formData.get("providedDescription") ?? ""),
    providedAt: String(formData.get("providedAt") ?? ""),
    notProvidedReason: String(formData.get("notProvidedReason") ?? ""),
    referralDetails: String(formData.get("referralDetails") ?? ""),
    followUpReason: String(formData.get("followUpReason") ?? ""),
    followUpNotes: String(formData.get("followUpNotes") ?? ""),
    internalRemarks: String(formData.get("internalRemarks") ?? ""),
    medicineCount: formData.get("medicineCount") ? Number(formData.get("medicineCount")) : undefined,
    providerName: String(formData.get("providerName") ?? ""),
    financialAmount: formData.get("financialAmount") ? Number(formData.get("financialAmount")) : undefined,
    financialType: String(formData.get("financialType") ?? ""),
    transactionDetails: String(formData.get("transactionDetails") ?? ""),
    printProof: String(formData.get("printProof") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      ok: false,
      message: "Please review the highlighted fields.",
      resetKey: previousState.resetKey,
      fieldErrors,
    };
  }

  const beneficiary = await db.beneficiary.findUnique({
    where: { id: parsed.data.beneficiaryId },
    select: { id: true, categoryId: true },
  });
  if (!beneficiary) {
    return {
      ok: false,
      message: "The selected beneficiary could not be found. Register the beneficiary before recording assistance.",
      resetKey: previousState.resetKey,
      fieldErrors: { beneficiaryId: "Select an existing beneficiary." },
    };
  }
  if (user.role === "OFFICER" && !user.categoryIds.includes(beneficiary.categoryId)) {
    return {
      ok: false,
      message: "You can only record assistance for beneficiaries in your assigned categories.",
      resetKey: previousState.resetKey,
      fieldErrors: { beneficiaryId: "This beneficiary is outside your assigned categories." },
    };
  }

  if (parsed.data.recordId) {
    const existing = await db.beneficiaryAssistance.findUnique({
      where: { id: parsed.data.recordId },
      select: { beneficiary: { select: { categoryId: true } } },
    });
    if (!existing || (user.role === "OFFICER" && !user.categoryIds.includes(existing.beneficiary.categoryId))) {
      return {
        ok: false,
        message: "You are not authorized to edit this assistance record.",
        resetKey: previousState.resetKey,
      };
    }
  }

  const currentDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replaceAll("/", "-");
  const referenceNumber = `MSWD-${currentDate.replaceAll("-", "")}-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const data = {
    beneficiaryId: beneficiary.id,
    type: parsed.data.type,
    otherType: parsed.data.type === "OTHER" ? parsed.data.otherType : null,
    visitDate: dateOnly(parsed.data.visitDate),
    purpose: parsed.data.purpose,
    requestedDescription: parsed.data.requestedDescription,
    outcome: parsed.data.outcome,
    providedDescription: parsed.data.outcome === "PROVIDED" ? parsed.data.providedDescription : null,
    providedAt: parsed.data.outcome === "PROVIDED" ? dateOnly(parsed.data.providedAt) : null,
    notProvidedReason: parsed.data.outcome === "NOT_PROVIDED" ? parsed.data.notProvidedReason : null,
    referralDetails: parsed.data.outcome === "REFERRED" ? parsed.data.referralDetails : null,
    followUpReason: parsed.data.outcome === "FOLLOW_UP" ? parsed.data.followUpReason : null,
    followUpNotes: parsed.data.outcome === "FOLLOW_UP" ? parsed.data.followUpNotes : null,
    internalRemarks: parsed.data.internalRemarks || null,
    medicineCount: parsed.data.medicineCount ?? null,
    providerName: parsed.data.providerName || null,
    financialAmount: parsed.data.financialAmount ?? null,
    financialType: parsed.data.financialType || null,
    transactionDetails: parsed.data.transactionDetails || null,
  };

  const savedRecord = await db.$transaction(async (transaction) => {
    const record = parsed.data.recordId
      ? await transaction.beneficiaryAssistance.update({
          where: { id: parsed.data.recordId },
          data,
          select: { id: true, referenceNumber: true },
        })
      : await transaction.beneficiaryAssistance.create({
          data: {
            ...data,
            referenceNumber,
            providedById: user.id,
          },
          select: { id: true, referenceNumber: true },
        });

    await transaction.auditLog.create({
      data: {
        userId: user.id,
        action: parsed.data.recordId ? "UPDATE" : "CREATE",
        module: "ASSISTANCE",
        recordId: record.id,
        description: `${parsed.data.recordId ? "Updated" : "Recorded"} assistance ${record.referenceNumber} for beneficiary ${beneficiary.id}.`,
      },
    });
    return record;
  });

  revalidatePath("/admin/assistance");
  revalidatePath("/officer/assistance");
  revalidatePath("/admin/reports");
  revalidatePath("/officer/reports");
  revalidatePath("/admin/dashboard");
  revalidatePath("/officer/dashboard");

  return {
    ok: true,
    message: `Assistance record ${savedRecord.referenceNumber} saved.`,
    resetKey: previousState.resetKey + 1,
    savedId: savedRecord.id,
    printProof: parsed.data.printProof === "true",
  };
}
