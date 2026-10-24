"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/permissions";
import { beneficiarySchema } from "@/lib/validation";
import { MAHAYAG_MUNICIPALITY } from "@/lib/locations";

function generateSequence(prefix: string) {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
}

export type BeneficiaryActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
};

export async function createBeneficiaryAction(
  _previousState: BeneficiaryActionState,
  formData: FormData,
): Promise<BeneficiaryActionState> {
  const user = await requireAuth();

  const raw = {
    firstName: String(formData.get("firstName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    suffix: String(formData.get("suffix") ?? ""),
    sex: String(formData.get("sex") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    civilStatus: String(formData.get("civilStatus") ?? ""),
    contactNumber: String(formData.get("contactNumber") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? ""),
    barangay: String(formData.get("barangay") ?? ""),
    province: String(formData.get("province") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    subcategory: String(formData.get("subcategory") ?? ""),
    assignedOfficerId: String(formData.get("assignedOfficerId") ?? ""),
    remarks: String(formData.get("remarks") ?? ""),
  };

  const parsed = beneficiarySchema.safeParse(raw);

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
      fieldErrors,
    };
  }

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId } });

  if (!category) {
    return {
      ok: false,
      message: "Selected category was not found. Refresh the page and try again.",
      fieldErrors: { categoryId: "Select a valid beneficiary category." },
    };
  }

  if (user.role === "OFFICER" && !user.categoryIds.includes(parsed.data.categoryId)) {
    return {
      ok: false,
      message: "You can only register beneficiaries in your assigned categories.",
      fieldErrors: { categoryId: "This category is outside your assigned categories." },
    };
  }

  if (user.role === "ADMIN" && parsed.data.assignedOfficerId) {
    const officer = await db.user.findUnique({
      where: { id: parsed.data.assignedOfficerId },
      include: { userCategories: { select: { categoryId: true } } },
    });

    if (!officer) {
      return {
        ok: false,
        message: "Selected officer was not found. Refresh the page and try again.",
        fieldErrors: { assignedOfficerId: "Select a valid officer or leave this unassigned." },
      };
    }

    const canAssign = officer.userCategories.some((item) => item.categoryId === parsed.data.categoryId);

    if (!canAssign) {
      return {
        ok: false,
        message: "This officer is not authorized for the selected category.",
        fieldErrors: { assignedOfficerId: "Choose an officer assigned to this category." },
      };
    }
  }

  const dob = parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null;
  const age = dob ? new Date().getFullYear() - dob.getFullYear() : null;

  try {
    await db.beneficiary.create({
      data: {
        beneficiaryNumber: generateSequence("BEN"),
        firstName: parsed.data.firstName,
        middleName: parsed.data.middleName || null,
        lastName: parsed.data.lastName,
        suffix: parsed.data.suffix || null,
        sex: parsed.data.sex,
        dateOfBirth: dob,
        age,
        civilStatus: parsed.data.civilStatus || null,
        contactNumber: parsed.data.contactNumber || null,
        email: parsed.data.email || null,
        address: parsed.data.address,
        barangay: parsed.data.barangay || null,
        municipality: MAHAYAG_MUNICIPALITY,
        province: parsed.data.province || null,
        categoryId: parsed.data.categoryId,
        subcategory: parsed.data.subcategory || null,
        assignedOfficerId: user.role === "OFFICER"
          ? user.id
          : parsed.data.assignedOfficerId || null,
        remarks: parsed.data.remarks || null,
        status: "ACTIVE",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Unable to save beneficiary:", error);
      return {
        ok: false,
        message: "Unable to save the beneficiary. Please try again.",
      };
    }
    throw error;
  }

  revalidatePath("/admin/beneficiaries");
  revalidatePath("/officer/beneficiaries");
  revalidatePath("/admin/dashboard");
  revalidatePath("/officer/dashboard");
  revalidatePath(`/officer/categories/${parsed.data.categoryId}`);
  return { ok: true, message: "Beneficiary saved successfully.", saved: true };
}
