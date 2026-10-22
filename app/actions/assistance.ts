"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/permissions";
import { ASSISTANCE_TYPE_VALUES } from "@/lib/assistance";
import { z } from "zod";

const assistanceSchema = z
  .object({
    beneficiaryId: z.string().trim().min(1, "Select a beneficiary."),
    type: z.enum(ASSISTANCE_TYPE_VALUES),
    otherType: z.string().trim().max(100, "Keep the description under 100 characters."),
    providedAt: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
      .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
      }, "Choose a valid date."),
    notes: z.string().trim().max(1000, "Keep notes under 1,000 characters."),
  })
  .superRefine((value, context) => {
    if (value.type === "OTHER" && !value.otherType) {
      context.addIssue({
        code: "custom",
        path: ["otherType"],
        message: "Describe the other assistance provided.",
      });
    }
  });

export type AssistanceActionState = {
  ok: boolean;
  message: string;
  resetKey: number;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
};

export async function createAssistanceAction(
  previousState: AssistanceActionState,
  formData: FormData,
): Promise<AssistanceActionState> {
  const user = await requireAuth();
  const parsed = assistanceSchema.safeParse({
    beneficiaryId: String(formData.get("beneficiaryId") ?? ""),
    type: String(formData.get("type") ?? ""),
    otherType: String(formData.get("otherType") ?? ""),
    providedAt: String(formData.get("providedAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
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
    select: { categoryId: true },
  });

  if (!beneficiary) {
    return {
      ok: false,
      message: "The selected beneficiary could not be found.",
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

  await db.beneficiaryAssistance.create({
    data: {
      beneficiaryId: parsed.data.beneficiaryId,
      type: parsed.data.type,
      otherType: parsed.data.type === "OTHER" ? parsed.data.otherType : null,
      providedAt: new Date(`${parsed.data.providedAt}T00:00:00.000Z`),
      notes: parsed.data.notes || null,
      providedById: user.id,
    },
  });

  revalidatePath("/admin/assistance");
  revalidatePath("/officer/assistance");
  revalidatePath("/admin/dashboard");
  revalidatePath("/officer/dashboard");

  return {
    ok: true,
    message: "Assistance record saved.",
    resetKey: previousState.resetKey + 1,
    saved: true,
  };
}
