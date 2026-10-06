"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { beneficiarySchema, caseSchema } from "@/lib/validation";

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

export async function createBeneficiaryAction(formData: FormData) {
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
    municipality: String(formData.get("municipality") ?? ""),
    province: String(formData.get("province") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    subcategory: String(formData.get("subcategory") ?? ""),
    assignedOfficerId: String(formData.get("assignedOfficerId") ?? ""),
    remarks: String(formData.get("remarks") ?? ""),
  };

  const parsed = beneficiarySchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid beneficiary details.");
  }

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId } });

  if (!category) {
    throw new Error("Selected category was not found.");
  }

  if (parsed.data.assignedOfficerId) {
    const officer = await db.user.findUnique({
      where: { id: parsed.data.assignedOfficerId },
      include: { userCategories: { select: { categoryId: true } } },
    });

    if (!officer) {
      throw new Error("Selected officer was not found.");
    }

    const canAssign = officer.userCategories.some((item) => item.categoryId === parsed.data.categoryId);

    if (!canAssign) {
      throw new Error("This officer is not authorized for the selected category.");
    }
  }

  const dob = parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null;
  const age = dob ? new Date().getFullYear() - dob.getFullYear() : null;

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
      municipality: parsed.data.municipality || null,
      province: parsed.data.province || null,
      categoryId: parsed.data.categoryId,
      subcategory: parsed.data.subcategory || null,
      assignedOfficerId: parsed.data.assignedOfficerId || null,
      remarks: parsed.data.remarks || null,
      status: "ACTIVE",
    },
  });

  revalidatePath("/admin/beneficiaries");
  revalidatePath("/officer/beneficiaries");
  redirect("/admin/beneficiaries");
}

export async function createCaseAction(formData: FormData) {
  const raw = {
    beneficiaryId: String(formData.get("beneficiaryId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    caseType: String(formData.get("caseType") ?? ""),
    description: String(formData.get("description") ?? ""),
    priority: String(formData.get("priority") ?? "MEDIUM"),
    assignedOfficerId: String(formData.get("assignedOfficerId") ?? ""),
    remarks: String(formData.get("remarks") ?? ""),
  };

  const parsed = caseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid case details.");
  }

  const beneficiary = await db.beneficiary.findUnique({
    where: { id: parsed.data.beneficiaryId },
    include: { category: true },
  });

  if (!beneficiary) {
    throw new Error("Selected beneficiary not found.");
  }

  if (beneficiary.categoryId !== parsed.data.categoryId) {
    throw new Error("Selected case category must match the beneficiary's category.");
  }

  if (parsed.data.assignedOfficerId) {
    const officer = await db.user.findUnique({
      where: { id: parsed.data.assignedOfficerId },
      include: { userCategories: { select: { categoryId: true } } },
    });

    if (!officer) {
      throw new Error("Selected officer was not found.");
    }

    const canAssign = officer.userCategories.some((item) => item.categoryId === parsed.data.categoryId);

    if (!canAssign) {
      throw new Error("This officer is not authorized for the selected category.");
    }
  }

  const caseRecord = await db.case.create({
    data: {
      caseNumber: generateSequence("CASE"),
      beneficiaryId: parsed.data.beneficiaryId,
      categoryId: parsed.data.categoryId,
      caseType: parsed.data.caseType,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: "NEW",
      assignedOfficerId: parsed.data.assignedOfficerId || null,
      remarks: parsed.data.remarks || null,
    },
  });

  await db.caseHistory.create({
    data: {
      caseId: caseRecord.id,
      event: "CASE_OPENED",
      description: `Case created for ${beneficiary.firstName} ${beneficiary.lastName}.`,
    },
  });

  revalidatePath("/admin/cases");
  revalidatePath("/officer/cases");
  redirect("/admin/cases");
}
