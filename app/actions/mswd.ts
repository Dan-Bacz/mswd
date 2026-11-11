"use server";

import { Prisma } from "@prisma/client";
import type { BeneficiaryFileType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/permissions";
import { beneficiarySchema, soloParentApplicationSchema } from "@/lib/validation";
import { MAHAYAG_MUNICIPALITY } from "@/lib/locations";
import { calculateAge } from "@/lib/age";
import { buildBeneficiaryIdentityKey, buildBeneficiaryNameIdentityKey, buildFullName, capitalizePersonName } from "@/lib/identity";

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
  duplicateClient?: {
    id: string;
    beneficiaryNumber: string;
    name: string;
    categoryName: string;
  };
};

const MAX_IMAGE_SIZE = 1024 * 1024;
const MAX_TOTAL_IMAGE_SIZE = 3 * MAX_IMAGE_SIZE;
const GENERAL_INTAKE_FIELDS = [
  "clientStatus", "mobileNumber", "placeOfBirth", "relationshipToBeneficiary", "highestEducationalAttainment",
  "religion", "nationality", "philhealthNumber", "modeOfAdmission", "referringParty", "contactPerson",
  "assessmentProblemPresented", "socialWorkersAssessment", "clientSubCategory", "financialAssistanceType",
  "financialAssistanceValue", "financialAssistanceAmount", "modeOfFinancialAssistance", "sourceOfAssistance",
  "materialAssistanceType", "materialAssistanceSpecify", "materialAssistanceSource", "clientSignatureName",
  "interviewedBy", "intakeDate",
] as const;

function collectGeneralIntakeData(formData: FormData): Prisma.InputJsonObject {
  const data: Record<string, Prisma.InputJsonValue> = {};
  for (const field of GENERAL_INTAKE_FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    if (value) data[field] = value;
  }
  data.familyComposition = formData.getAll("intakeFamilyMember").map(String).map((value) => value.trim()).filter(Boolean);
  for (const [field, value] of formData.entries()) {
    if (!field.startsWith("vawc") || typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const existing = data[field];
    data[field] = existing === undefined ? trimmed : Array.isArray(existing) ? [...existing, trimmed] : [existing, trimmed];
  }
  return data as Prisma.InputJsonObject;
}

const REQUIRED_VAWC_FIELDS = [
  "vawcIntakeDate", "vawcInterviewedBy", "vawcHandlingOrganization", "vawcReportingType",
  "lastName", "firstName", "middleName", "sex", "dateOfBirth", "address", "vawcVictimNationality",
  "vawcVictimCivilStatus", "vawcVictimAge", "vawcVictimEthnicity", "vawcVictimOccupation",
  "vawcVictimEmployment", "vawcVictimMigratoryStatus", "vawcVictimCurrentAddress",
  "vawcIncidentDescription", "vawcIncidentDate", "vawcIncidentLocation", "vawcPerpetratorLastName",
  "vawcPerpetratorFirstName", "vawcPerpetratorAddress",
] as const;

function missingVawcFields(formData: FormData) {
  return REQUIRED_VAWC_FIELDS.filter((field) => String(formData.get(field) ?? "").trim().length === 0);
}

type BeneficiaryImage = {
  type: BeneficiaryFileType;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: Uint8Array;
};

class ImageUploadError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

async function parseImageUpload(
  value: FormDataEntryValue | null,
  type: BeneficiaryFileType,
  field: string,
): Promise<BeneficiaryImage | null> {
  if (!isFile(value) || value.size === 0) {
    return null;
  }

  if (value.size > MAX_IMAGE_SIZE) {
    throw new ImageUploadError(field, "Each image must be 1 MB or smaller.");
  }

  const content = new Uint8Array(await value.arrayBuffer());
  let mimeType: string | null = null;
  let extension = "";

  if (content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff) {
    mimeType = "image/jpeg";
    extension = "jpg";
  } else if (
    content[0] === 0x89 &&
    content[1] === 0x50 &&
    content[2] === 0x4e &&
    content[3] === 0x47 &&
    content[4] === 0x0d &&
    content[5] === 0x0a &&
    content[6] === 0x1a &&
    content[7] === 0x0a
  ) {
    mimeType = "image/png";
    extension = "png";
  } else if (
    String.fromCharCode(...content.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...content.slice(8, 12)) === "WEBP"
  ) {
    mimeType = "image/webp";
    extension = "webp";
  }

  if (!mimeType) {
    throw new ImageUploadError(field, "Use a valid JPEG, PNG, or WebP image.");
  }

  const originalName = value.name.replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 255) || "image";
  return {
    type,
    fileName: `${type.toLowerCase()}-${randomUUID()}.${extension}`,
    originalName,
    mimeType,
    size: content.byteLength,
    content,
  };
}

export async function createBeneficiaryAction(
  _previousState: BeneficiaryActionState,
  formData: FormData,
): Promise<BeneficiaryActionState> {
  const user = await requireAuth();

  const raw = {
    firstName: capitalizePersonName(String(formData.get("firstName") ?? formData.get("vawcVictimFirstName") ?? "")),
    middleName: capitalizePersonName(String(formData.get("middleName") ?? formData.get("vawcVictimMiddleName") ?? "")),
    lastName: capitalizePersonName(String(formData.get("lastName") ?? formData.get("vawcVictimLastName") ?? "")),
    suffix: String(formData.get("suffix") ?? ""),
    sex: String(formData.get("sex") ?? formData.get("vawcVictimSex") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? formData.get("vawcVictimBirthdate") ?? ""),
    civilStatus: String(formData.get("civilStatus") ?? ""),
    contactNumber: String(formData.get("contactNumber") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? formData.get("vawcVictimAddress") ?? ""),
    barangay: String(formData.get("barangay") ?? ""),
    province: String(formData.get("province") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
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

  let soloParentData: ReturnType<typeof soloParentApplicationSchema.parse> | undefined;
  let generalIntakeData: Prisma.InputJsonObject | undefined;
  if (category.name.toLowerCase().includes("solo parent")) {
    const familyNames = formData.getAll("familyMemberName").map(String);
    const familyRelationships = formData.getAll("familyMemberRelationship").map(String);
    const familyAges = formData.getAll("familyMemberAge").map(String);
    const familyCivilStatuses = formData.getAll("familyMemberCivilStatus").map(String);
    const familyEducation = formData.getAll("familyMemberEducation").map(String);
    const familyOccupationIncome = formData.getAll("familyMemberOccupationIncome").map(String);
    const familyComposition = familyNames.map((name, index) => ({
      name,
      relationship: familyRelationships[index] ?? "",
      age: familyAges[index] ?? "",
      civilStatus: familyCivilStatuses[index] ?? "",
      educationalAttainment: familyEducation[index] ?? "",
      occupationMonthlyIncome: familyOccupationIncome[index] ?? "",
    })).filter((member) => Object.values(member).some((value) => value.trim()));

    const soloParentParsed = soloParentApplicationSchema.safeParse({
      placeOfBirth: String(formData.get("placeOfBirth") ?? ""),
      highestEducationalAttainment: String(formData.get("highestEducationalAttainment") ?? ""),
      occupation: String(formData.get("occupation") ?? ""),
      monthlyIncome: String(formData.get("monthlyIncome") ?? ""),
      totalMonthlyFamilyIncome: String(formData.get("totalMonthlyFamilyIncome") ?? ""),
      mobileNumber: String(formData.get("mobileNumber") ?? ""),
      contactNumber: String(formData.get("contactNumber") ?? ""),
      religion: String(formData.get("religion") ?? ""),
      maritalStatus: String(formData.get("soloParentMaritalStatus") ?? ""),
      classification: String(formData.get("classification") ?? ""),
      incidenceDate: String(formData.get("incidenceDate") ?? ""),
      needsProblems: String(formData.get("needsProblems") ?? ""),
      familyResources: String(formData.get("familyResources") ?? ""),
      familyComposition,
      submittedRequirements: String(formData.get("submittedRequirements") ?? ""),
      idNumber: String(formData.get("soloParentIdNumber") ?? ""),
      povertyThreshold: String(formData.get("povertyThreshold") ?? ""),
      dateIssued: String(formData.get("dateIssued") ?? ""),
      expiryDate: String(formData.get("expiryDate") ?? ""),
      interviewedAssessedBy: String(formData.get("interviewedAssessedBy") ?? ""),
      assessmentDate: String(formData.get("assessmentDate") ?? ""),
      applicantSignatureName: String(formData.get("applicantSignatureName") ?? ""),
      signatureDate: String(formData.get("signatureDate") ?? ""),
    });

    if (!soloParentParsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of soloParentParsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { ok: false, message: "Please complete the Solo Parent application form.", fieldErrors };
    }
    soloParentData = soloParentParsed.data;
  }

  const categoryName = category.name.toLowerCase();
  if (!categoryName.includes("solo parent")) {
    if (categoryName.includes("vawc") || (categoryName.includes("special protection") && !categoryName.includes("children in need of special protection"))) {
      const missingFields = missingVawcFields(formData);
      if (missingFields.length > 0) {
        return {
          ok: false,
          message: "Please complete all required Annex D fields before saving the beneficiary.",
          fieldErrors: Object.fromEntries(missingFields.map((field) => [field, "This field is required."])),
        };
      }
    }
    generalIntakeData = collectGeneralIntakeData(formData);
  }

  let images: BeneficiaryImage[];
  try {
    const idFront = await parseImageUpload(formData.get("idFront"), "VALID_ID_FRONT", "idFront");
    const idBack = await parseImageUpload(formData.get("idBack"), "VALID_ID_BACK", "idBack");
    const profileCapture = await parseImageUpload(
      formData.get("profileImageCapture"),
      "PROFILE_IMAGE",
      "profileImage",
    );
    const profileUpload = await parseImageUpload(
      formData.get("profileImageUpload"),
      "PROFILE_IMAGE",
      "profileImage",
    );

    if (profileCapture && profileUpload) {
      return {
        ok: false,
        message: "Choose either a camera photo or a profile image from your device, not both.",
        fieldErrors: { profileImage: "Choose only one profile image." },
      };
    }

    images = [idFront, idBack, profileCapture ?? profileUpload].filter(
      (image): image is BeneficiaryImage => image !== null,
    );
    if (images.reduce((total, image) => total + image.size, 0) > MAX_TOTAL_IMAGE_SIZE) {
      return {
        ok: false,
        message: "The combined image size must not exceed 3 MB.",
        fieldErrors: { profileImage: "Reduce the image sizes and try again." },
      };
    }
  } catch (error) {
    if (!(error instanceof ImageUploadError)) throw error;
    return {
      ok: false,
      message: "Please check the uploaded images.",
      fieldErrors: { [error.field]: error.message },
    };
  }

  const age = parsed.data.dateOfBirth ? calculateAge(parsed.data.dateOfBirth) : null;
  if (parsed.data.dateOfBirth && age === null) {
    return {
      ok: false,
      message: "Please enter a valid date of birth that is not in the future.",
      fieldErrors: { dateOfBirth: "Enter a valid date of birth." },
    };
  }

  const dob = parsed.data.dateOfBirth ? new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`) : null;
  const identityKey = buildBeneficiaryIdentityKey({
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName,
    lastName: parsed.data.lastName,
    dateOfBirth: dob,
    barangay: parsed.data.barangay,
  });
  const nameIdentityKey = buildBeneficiaryNameIdentityKey(parsed.data);

  const duplicate = await db.beneficiary.findFirst({
    where: { categoryId: parsed.data.categoryId, nameIdentityKey },
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (duplicate) {
    return {
      ok: false,
      message: "This client or beneficiary already exists in the system.",
      duplicateClient: {
        id: duplicate.id,
        beneficiaryNumber: duplicate.beneficiaryNumber,
        name: buildFullName(duplicate),
        categoryName: duplicate.category.name,
      },
    };
  }

  if (category.name.toLowerCase().includes("senior") && age === null) {
    return {
      ok: false,
      message: "A date of birth is required to register a senior citizen beneficiary.",
      fieldErrors: { dateOfBirth: "Date of birth is required for the Senior Citizens category." },
    };
  }

  if (category.name.toLowerCase().includes("senior") && age !== null && age < 60) {
    return {
      ok: false,
      message: "Beneficiaries must be at least 60 years old to be registered under Senior Citizens.",
      fieldErrors: { age: "Must be at least 60 years old for the Senior Citizens category." },
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

  try {
    await db.$transaction(async (transaction) => {
      const beneficiary = await transaction.beneficiary.create({
        data: {
          beneficiaryNumber: generateSequence("BEN"),
          identityKey,
          nameIdentityKey,
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
          assignedOfficerId: user.role === "OFFICER"
            ? user.id
            : parsed.data.assignedOfficerId || null,
          remarks: parsed.data.remarks || null,
          soloParentData,
          generalIntakeData,
          status: "ACTIVE",
        },
      });

      await transaction.document.createMany({
        data: images.map((image) => ({
          beneficiaryId: beneficiary.id,
          uploaderId: user.id,
          fileType: image.type,
          fileName: image.fileName,
          originalName: image.originalName,
          mimeType: image.mimeType,
          size: image.size,
          content: Buffer.from(image.content),
          storageUrl: "database",
        })),
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const existing = await db.beneficiary.findFirst({
          where: {
            categoryId: parsed.data.categoryId,
            OR: [...(identityKey ? [{ identityKey }] : []), { nameIdentityKey }],
          },
          include: { category: { select: { name: true } } },
        });

        if (existing) {
          return {
            ok: false,
            message: "This client or beneficiary already exists in the system.",
            duplicateClient: {
              id: existing.id,
              beneficiaryNumber: existing.beneficiaryNumber,
              name: buildFullName(existing),
              categoryName: existing.category.name,
            },
          };
        }
      }

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
  revalidatePath(`/admin/categories/${parsed.data.categoryId}`);
  revalidatePath(`/officer/categories/${parsed.data.categoryId}`);
  return { ok: true, message: "Beneficiary saved successfully.", saved: true };
}

export async function updateBeneficiaryAction(
  _previousState: BeneficiaryActionState,
  formData: FormData,
): Promise<BeneficiaryActionState> {
  const user = await requireAuth();
  const beneficiaryId = String(formData.get("beneficiaryId") ?? "").trim();
  if (!beneficiaryId) return { ok: false, message: "Beneficiary record was not found." };

  const existing = await db.beneficiary.findUnique({
    where: { id: beneficiaryId },
    select: { id: true, assignedOfficerId: true, categoryId: true, category: { select: { name: true } }, generalIntakeData: true, soloParentData: true },
  });
  if (!existing) return { ok: false, message: "Beneficiary record was not found." };
  if (user.role !== "ADMIN" && existing.assignedOfficerId !== user.id) {
    return { ok: false, message: "You can only edit beneficiaries assigned to you." };
  }

  const parsed = beneficiarySchema.safeParse({
    firstName: capitalizePersonName(String(formData.get("firstName") ?? "")),
    middleName: capitalizePersonName(String(formData.get("middleName") ?? "")),
    lastName: capitalizePersonName(String(formData.get("lastName") ?? "")),
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
    assignedOfficerId: "",
    remarks: String(formData.get("remarks") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, message: "Please review the highlighted fields.", fieldErrors };
  }

  const dob = parsed.data.dateOfBirth ? new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`) : null;
  const age = parsed.data.dateOfBirth ? calculateAge(parsed.data.dateOfBirth) : null;
  if (parsed.data.dateOfBirth && age === null) {
    return { ok: false, message: "Please enter a valid date of birth that is not in the future.", fieldErrors: { dateOfBirth: "Enter a valid date of birth." } };
  }
  const identityKey = buildBeneficiaryIdentityKey({
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName,
    lastName: parsed.data.lastName,
    dateOfBirth: dob,
    barangay: parsed.data.barangay,
  });
  const nameIdentityKey = buildBeneficiaryNameIdentityKey(parsed.data);
  const duplicateByName = await db.beneficiary.findFirst({
    where: { categoryId: parsed.data.categoryId, nameIdentityKey, id: { not: beneficiaryId } },
    select: { beneficiaryNumber: true },
  });
  if (duplicateByName) {
    return { ok: false, message: "This client or beneficiary is already registered in the system.", fieldErrors: { firstName: `Existing Client ID: ${duplicateByName.beneficiaryNumber}.` } };
  }
  if (identityKey) {
    const duplicate = await db.beneficiary.findFirst({ where: { categoryId: parsed.data.categoryId, identityKey, id: { not: beneficiaryId } }, select: { beneficiaryNumber: true } });
    if (duplicate) return { ok: false, message: "This client or beneficiary is already registered in the system.", fieldErrors: { firstName: `Existing Client ID: ${duplicate.beneficiaryNumber}.` } };
  }

  let photo: BeneficiaryImage | null = null;
  try {
    photo = await parseImageUpload(formData.get("profileImage"), "PROFILE_IMAGE", "profileImage");
  } catch (error) {
    if (error instanceof ImageUploadError) return { ok: false, message: error.message, fieldErrors: { profileImage: error.message } };
    throw error;
  }

  const formFieldEntries = Array.from(formData.entries())
    .filter(([name, value]) => name.startsWith("formField_") && typeof value === "string")
    .map(([name, value]) => [name.slice("formField_".length), String(value).trim()] as const);
  const categoryName = existing.category.name.toLowerCase();
  const currentFormData = categoryName.includes("solo parent") ? existing.soloParentData : existing.generalIntakeData;
  const updatedFormData = formFieldEntries.length > 0
    ? { ...((currentFormData && typeof currentFormData === "object" && !Array.isArray(currentFormData)) ? currentFormData : {}), ...Object.fromEntries(formFieldEntries) } as Prisma.InputJsonObject
    : undefined;

  try {
    await db.$transaction(async (transaction) => {
      await transaction.beneficiary.update({
        where: { id: beneficiaryId },
        data: {
          identityKey,
          nameIdentityKey,
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
          province: parsed.data.province || null,
          remarks: parsed.data.remarks || null,
          ...(updatedFormData ? (categoryName.includes("solo parent") ? { soloParentData: updatedFormData } : { generalIntakeData: updatedFormData }) : {}),
        },
      });
      if (photo) {
        await transaction.document.deleteMany({ where: { beneficiaryId, fileType: "PROFILE_IMAGE" } });
        await transaction.document.create({
          data: {
            beneficiaryId,
            uploaderId: user.id,
            fileType: photo.type,
            fileName: photo.fileName,
            originalName: photo.originalName,
            mimeType: photo.mimeType,
            size: photo.size,
            content: Buffer.from(photo.content),
            storageUrl: "database",
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "This client or beneficiary is already registered in the system." };
    }
    throw error;
  }

  revalidatePath("/admin/beneficiaries");
  revalidatePath("/officer/beneficiaries");
  revalidatePath(`/admin/beneficiaries/${beneficiaryId}`);
  revalidatePath(`/officer/beneficiaries/${beneficiaryId}`);
  return { ok: true, message: "Beneficiary profile updated successfully.", saved: true };
}
