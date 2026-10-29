"use server";

import { Prisma } from "@prisma/client";
import type { BeneficiaryFileType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/permissions";
import { beneficiarySchema } from "@/lib/validation";
import { MAHAYAG_MUNICIPALITY } from "@/lib/locations";
import { calculateAge } from "@/lib/age";
import { buildBeneficiaryIdentityKey, buildFullName } from "@/lib/identity";

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

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId } });

  if (!category) {
    return {
      ok: false,
      message: "Selected category was not found. Refresh the page and try again.",
      fieldErrors: { categoryId: "Select a valid beneficiary category." },
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

  const duplicate = await db.beneficiary.findFirst({
    where: identityKey
      ? { identityKey }
      : {
          firstName: { equals: parsed.data.firstName, mode: "insensitive" },
          middleName: parsed.data.middleName
            ? { equals: parsed.data.middleName, mode: "insensitive" }
            : null,
          lastName: { equals: parsed.data.lastName, mode: "insensitive" },
          dateOfBirth: null,
          barangay: { equals: parsed.data.barangay, mode: "insensitive" },
        },
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
      if (error.code === "P2002" && identityKey) {
        const existing = await db.beneficiary.findUnique({
          where: { identityKey },
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
  revalidatePath(`/officer/categories/${parsed.data.categoryId}`);
  return { ok: true, message: "Beneficiary saved successfully.", saved: true };
}
