"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  sendNewOfficerRegistrationEmail,
  sendOfficerApprovalEmail,
  sendOfficerCategoryAssignmentEmail,
  sendOfficerDeactivationEmail,
  sendOfficerDeletionEmail,
  sendOfficerRejectionEmail,
} from "@/lib/email";
import { createSession, clearSession } from "@/lib/auth/session";
import { requireAdmin, requireAuth } from "@/lib/auth/permissions";
import { categorySchema, loginSchema, officerProfileSchema, officerRegistrationSchema, setupSchema } from "@/lib/validation";
import { buildFullName } from "@/lib/identity";
import {
  VERIFICATION_SESSION_TTL_MS,
  createVerificationToken,
  hashQrPayload,
  hashVerificationToken,
  parseRecognizedNationalIdPayload,
} from "@/lib/verification";
import { validateNationalIdImageUpload, validateProfilePhotoUpload, UploadValidationError } from "@/lib/uploads";
import {
  markAllNotificationsRead,
  markNotificationRead,
  markRegistrationNotificationsReviewed,
  notifyAdminsOfRegistration,
} from "@/lib/notifications";

export async function loginAction(
  _previousState: { ok: boolean; error: string } | null,
  formData: FormData
) {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { password } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findUnique({
    where: { email },
    include: {
      role: true,
      userCategories: { select: { categoryId: true } },
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (user.status === "PENDING_APPROVAL") {
    return { ok: false, error: "Your account is awaiting administrator approval." };
  }

  if (user.status !== "ACTIVE") {
    return { ok: false, error: "This account is inactive." };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name as "ADMIN" | "OFFICER",
    categoryIds: user.userCategories.map((item) => item.categoryId),
  });

  revalidatePath("/");
  redirect(user.role.name === "ADMIN" ? "/admin/dashboard" : user.userCategories.length > 1 ? "/officer/select-category" : "/officer/dashboard");
}

export async function setupAction(
  _previousState: { ok: boolean; error: string } | null,
  formData: FormData
) {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    setupKey: String(formData.get("setupKey") ?? ""),
  };

  const parsed = setupSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (process.env.MSWD_SETUP_KEY && parsed.data.setupKey !== process.env.MSWD_SETUP_KEY) {
    return { ok: false, error: "Invalid setup key." };
  }

  if (!process.env.MSWD_SETUP_KEY) {
    return { ok: false, error: "MSWD_SETUP_KEY is not configured." };
  }

  const existing = await db.user.count({ where: { email: parsed.data.email } });

  if (existing > 0) {
    return { ok: false, error: "An administrator with that email already exists." };
  }

  const adminRole = await db.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      roleId: adminRole.id,
      status: "ACTIVE",
    },
    include: {
      role: true,
      userCategories: { select: { categoryId: true } },
    },
  });

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name as "ADMIN" | "OFFICER",
    categoryIds: user.userCategories.map((item) => item.categoryId),
  });

  revalidatePath("/");
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createOfficerVerificationSessionAction() {
  const token = createVerificationToken();
  const session = await db.officerVerificationSession.create({
    data: {
      tokenHash: hashVerificationToken(token),
      expiresAt: new Date(Date.now() + VERIFICATION_SESSION_TTL_MS),
      consentAt: new Date(),
    },
    select: { id: true, expiresAt: true },
  });
  return { ok: true, sessionId: session.id, token, expiresAt: session.expiresAt.toISOString() };
}

export async function recordOfficerNationalIdScanAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  const sessionId = String(formData.get("verificationSessionId") ?? "").trim();
  const token = String(formData.get("verificationToken") ?? "").trim();
  const payload = String(formData.get("qrPayload") ?? "");
  if (!sessionId || !token || !payload) return { ok: false, message: "Start a new verification session and scan the QR code again." };

  const session = await db.officerVerificationSession.findFirst({
    where: { id: sessionId, tokenHash: hashVerificationToken(token) },
    select: { id: true, expiresAt: true, submittedAt: true },
  });
  if (!session || session.submittedAt || session.expiresAt <= new Date()) {
    return { ok: false, message: "The verification session has expired. Start again." };
  }

  const parsed = parseRecognizedNationalIdPayload(payload);
  if (!parsed) {
    return { ok: false, message: "The QR code was readable, but its format is not a recognized PhilSys identity payload. Authenticity was not verified." };
  }

  await db.officerVerificationSession.update({
    where: { id: session.id },
    data: {
      qrPayloadHash: hashQrPayload(payload),
      qrName: parsed.name,
      qrBirthDate: parsed.birthDate,
      qrSex: parsed.sex,
      qrStatus: "QR_DECODED",
      qrAuthenticityStatus: "INCONCLUSIVE",
      overallStatus: "INCONCLUSIVE",
      manualReviewReason: "QR decoded locally; official Philippine National ID authenticity verification is unavailable.",
    },
  });

  return {
    ok: true,
    message: "QR decoded. National ID authenticity is not verified and will require administrator/manual review.",
    name: parsed.name,
    birthDate: parsed.birthDate?.toISOString().slice(0, 10) ?? null,
    sex: parsed.sex,
  };
}

export async function recordOfficerLivenessInconclusiveAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  const sessionId = String(formData.get("verificationSessionId") ?? "").trim();
  const token = String(formData.get("verificationToken") ?? "").trim();
  if (!sessionId || !token) return { ok: false, message: "Start a verification session first." };

  const session = await db.officerVerificationSession.findFirst({
    where: { id: sessionId, tokenHash: hashVerificationToken(token) },
    select: { id: true, expiresAt: true, qrStatus: true, submittedAt: true },
  });
  if (!session || session.submittedAt || session.expiresAt <= new Date()) return { ok: false, message: "The verification session has expired. Start again." };
  if (session.qrStatus !== "QR_DECODED") return { ok: false, message: "Decode a recognized National ID QR payload before starting face verification." };

  await db.officerVerificationSession.update({
    where: { id: session.id },
    data: {
      livenessStatus: "INCONCLUSIVE",
      faceMatchStatus: "INCONCLUSIVE",
      overallStatus: "MANUAL_REVIEW",
      manualReviewReason: "Automated liveness and face matching are unavailable without a validated anti-spoofing detector and authorized reference portrait.",
    },
  });
  return { ok: true, message: "Face verification is inconclusive. Registration will remain pending manual review." };
}

export async function updateOfficerProfileAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  const user = await requireAuth();
  const parsed = officerProfileSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    contactNumber: String(formData.get("contactNumber") ?? ""),
    address: String(formData.get("address") ?? ""),
    barangay: String(formData.get("barangay") ?? ""),
    municipality: String(formData.get("municipality") ?? ""),
    province: String(formData.get("province") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please review your profile details." };
  }

  let photo: Awaited<ReturnType<typeof validateProfilePhotoUpload>>;
  try {
    photo = await validateProfilePhotoUpload(formData.get("profilePhoto"));
  } catch (error) {
    if (error instanceof UploadValidationError) return { ok: false, message: error.message };
    throw error;
  }

  const name = buildFullName(parsed.data);
  await db.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: user.id },
      data: {
        name,
        firstName: parsed.data.firstName,
        middleName: parsed.data.middleName || null,
        lastName: parsed.data.lastName,
      },
    });
    await transaction.userProfile.upsert({
      where: { userId: user.id },
      update: {
        contactNumber: parsed.data.contactNumber || null,
        address: parsed.data.address || null,
        barangay: parsed.data.barangay || null,
        municipality: parsed.data.municipality || null,
        province: parsed.data.province || null,
        ...(photo ? {
          photoFileName: photo.fileName,
          photoMimeType: photo.mimeType,
          photoSize: photo.size,
          photoContent: Buffer.from(photo.content),
        } : {}),
      },
      create: {
        userId: user.id,
        contactNumber: parsed.data.contactNumber || null,
        address: parsed.data.address || null,
        barangay: parsed.data.barangay || null,
        municipality: parsed.data.municipality || null,
        province: parsed.data.province || null,
        ...(photo ? {
          photoFileName: photo.fileName,
          photoMimeType: photo.mimeType,
          photoSize: photo.size,
          photoContent: Buffer.from(photo.content),
        } : {}),
      },
    });
  });

  revalidatePath("/officer/profile");
  revalidatePath("/officer/dashboard");
  return { ok: true, message: "Profile updated successfully." };
}

export async function registerOfficerAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData
) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    return { ok: false, message: "Passwords do not match." };
  }

  const parsed = officerRegistrationSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    employeeId: String(formData.get("employeeId") ?? ""),
    email: String(formData.get("email") ?? ""),
    password,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid registration details." };
  }

  let nationalIdFront: Awaited<ReturnType<typeof validateNationalIdImageUpload>>;
  let nationalIdBack: Awaited<ReturnType<typeof validateNationalIdImageUpload>>;
  let profilePhoto: Awaited<ReturnType<typeof validateProfilePhotoUpload>>;
  try {
    nationalIdFront = await validateNationalIdImageUpload(formData.get("nationalIdFront"), "front");
    nationalIdBack = await validateNationalIdImageUpload(formData.get("nationalIdBack"), "back");
    profilePhoto = await validateProfilePhotoUpload(formData.get("profilePhotoCapture"))
      ?? await validateProfilePhotoUpload(formData.get("profilePhotoUpload"));
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findFirst({ where: { OR: [{ email }, { employeeId: parsed.data.employeeId }] }, select: { id: true } });
  if (existing) {
    return { ok: false, message: "An account with that email address already exists." };
  }

  const officerRole = await db.role.upsert({
    where: { name: "OFFICER" },
    update: {},
    create: { name: "OFFICER" },
  });

  const name = buildFullName(parsed.data);
  let officer: { id: string; name: string; email: string; position: string | null; employeeId: string | null; createdAt: Date };
  try {
    officer = await db.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: {
        name,
        firstName: parsed.data.firstName,
        middleName: parsed.data.middleName || null,
        lastName: parsed.data.lastName,
        position: null,
        employeeId: parsed.data.employeeId,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        roleId: officerRole.id,
        status: "PENDING_APPROVAL",
        profile: profilePhoto ? { create: {
          photoFileName: profilePhoto.fileName,
          photoMimeType: profilePhoto.mimeType,
          photoSize: profilePhoto.size,
          photoContent: Buffer.from(profilePhoto.content),
        } } : undefined,
        staffIdDocument: { create: {
          fileName: nationalIdFront.fileName,
          originalName: nationalIdFront.originalName,
          mimeType: nationalIdFront.mimeType,
          size: nationalIdFront.size,
          content: Buffer.from(nationalIdFront.content),
          frontFileName: nationalIdFront.fileName,
          frontOriginalName: nationalIdFront.originalName,
          frontMimeType: nationalIdFront.mimeType,
          frontSize: nationalIdFront.size,
          frontContent: Buffer.from(nationalIdFront.content),
          backFileName: nationalIdBack.fileName,
          backOriginalName: nationalIdBack.originalName,
          backMimeType: nationalIdBack.mimeType,
          backSize: nationalIdBack.size,
          backContent: Buffer.from(nationalIdBack.content),
        } },
        },
        select: { id: true, name: true, email: true, position: true, employeeId: true, createdAt: true },
      });
      return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "An account with that email address already exists." };
    }
    throw error;
  }

  await notifyAdminsOfRegistration(officer);

  const admins = await db.user.findMany({
    where: { role: { name: "ADMIN" }, status: "ACTIVE" },
    select: { id: true, name: true, email: true },
  });

  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title: "New staff registration awaiting review",
      message: `${name} (Employee ID ${parsed.data.employeeId}) submitted a registration on ${new Date().toLocaleDateString("en-PH")}.`,
      type: "STAFF_REGISTRATION",
    })),
  });

  try {
    await sendNewOfficerRegistrationEmail(admins, { name: officer.name, email: officer.email, position: officer.position });
  } catch (error) {
    console.error("Officer registration was saved, but administrator notification email could not be sent:", error);
    return {
      ok: true,
      message:
        "Registration submitted and the administrator notification was created in the system, but the email notice failed to send. Do not submit the registration again.",
    };
  }

  return {
    ok: true,
    message: "Registration submitted. Your account will be available after an administrator approves it.",
  };
}

export async function createCategoryAction(
  _previousState: { ok: boolean; message: string; saved?: boolean },
  formData: FormData,
) {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please enter a valid category.",
    };
  }

  try {
    await db.category.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "A category with this name already exists." };
    }
    throw error;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/beneficiaries");
  revalidatePath("/admin/officers");
  revalidatePath("/admin/officers/[officerId]", "page");
  revalidatePath("/officer/dashboard");
  return { ok: true, message: "Category added successfully.", saved: true };
}

export async function deleteCategoryAction(
  _previousState: { ok: boolean; message: string },
  formData: FormData,
) {
  await requireAdmin();

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!categoryId) {
    return { ok: false, message: "Select a category to delete." };
  }

  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: {
      name: true,
      _count: {
        select: {
          beneficiaries: true,
          assignments: true,
          userCategories: true,
        },
      },
    },
  });

  if (!category) {
    return { ok: false, message: "This category no longer exists. Refresh the page." };
  }

  const linkedItems = ([
    [category._count.beneficiaries, "beneficiaries"],
    [category._count.userCategories, "officer assignments"],
    [category._count.assignments, "assignment records"],
  ] as const)
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`);

  let deletedCount = 0;
  try {
    const result = await db.category.deleteMany({
      where: {
        id: categoryId,
        beneficiaries: { none: {} },
        assignments: { none: {} },
        userCategories: { none: {} },
      },
    });
    deletedCount = result.count;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        ok: false,
        message: `Cannot delete "${category.name}" because it is linked to other records. Reassign or remove them first.`,
      };
    }
    throw error;
  }

  if (deletedCount === 0) {
    return {
      ok: false,
      message: linkedItems.length > 0
        ? `Cannot delete "${category.name}" because it is linked to ${linkedItems.join(", ")}. Reassign or remove them first.`
        : "This category is in use. Refresh the page and try again.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/officers");
  revalidatePath("/officer/dashboard");

  return { ok: true, message: `Category "${category.name}" deleted.` };
}

export async function createOfficerAction(
  _previousState: { ok: boolean; message: string; saved?: boolean; resetKey: number },
  formData: FormData,
) {
  await requireAdmin();

  const parsed = officerRegistrationSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    position: String(formData.get("position") ?? ""),
    employeeId: String(formData.get("employeeId") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Enter valid officer details.",
      resetKey: _previousState.resetKey,
    };
  }

  const categoryIds = Array.from(
    new Set(formData.getAll("categoryIds").flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean)),
  );
  if (categoryIds.length === 0) {
    return { ok: false, message: "Select at least one authorized category.", resetKey: _previousState.resetKey };
  }

  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  if (categories.length !== categoryIds.length) {
    return { ok: false, message: "One or more selected categories are no longer available. Refresh and try again.", resetKey: _previousState.resetKey };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, message: "An account with that email address already exists.", resetKey: _previousState.resetKey };
  }

  const officerRole = await db.role.upsert({
    where: { name: "OFFICER" },
    update: {},
    create: { name: "OFFICER" },
  });

  try {
    await db.user.create({
      data: {
        name: buildFullName(parsed.data),
        firstName: parsed.data.firstName,
        middleName: parsed.data.middleName || null,
        lastName: parsed.data.lastName,
        position: parsed.data.position,
        employeeId: parsed.data.employeeId,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        roleId: officerRole.id,
        status: "ACTIVE",
        approvedAt: new Date(),
        userCategories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "An account with that email address already exists.", resetKey: _previousState.resetKey };
    }
    throw error;
  }

  try {
    await sendOfficerCategoryAssignmentEmail({
      name: buildFullName(parsed.data),
      email,
      categories: categories.map((category) => category.name).sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    console.error("Officer account was created, but the category assignment email could not be sent:", error);
  }

  revalidatePath("/admin/officers");
  revalidatePath("/admin/dashboard");
  revalidatePath("/officer/dashboard");
  return { ok: true, message: "Officer account created successfully.", saved: true, resetKey: _previousState.resetKey + 1 };
}

export async function approveOfficerAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData
) {
  await requireAdmin();

  const officerId = String(formData.get("officerId") ?? "");
  if (!officerId) {
    return { ok: false, message: "Officer was not found." };
  }

  const officer = await db.user.findUnique({
    where: { id: officerId },
    include: { role: true, verificationSession: { select: { overallStatus: true, submittedAt: true, expiresAt: true } } },
  });

  if (!officer || officer.role.name !== "OFFICER") {
    return { ok: false, message: "Officer was not found." };
  }
  if (officer.status !== "PENDING_APPROVAL") {
    return { ok: false, message: "This officer account is no longer awaiting approval." };
  }
  if (officer.verificationSession && officer.verificationSession.overallStatus !== "MANUAL_REVIEW" && officer.verificationSession.overallStatus !== "VERIFIED") {
    return { ok: false, message: "Complete the required identity review before approving this account." };
  }

  const result = await db.user.updateMany({
    where: { id: officer.id, roleId: officer.roleId, status: "PENDING_APPROVAL" },
    data: { status: "ACTIVE", approvedAt: new Date() },
  });

  if (result.count !== 1) {
    return {
      ok: false,
      message: "The account status changed. Refresh and review the account.",
    };
  }

  await markRegistrationNotificationsReviewed(officer.id);

  revalidatePath("/admin/officers");
  revalidatePath(`/admin/officers/${officer.id}`);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/notifications");
  revalidatePath("/officer/dashboard");

  try {
    await sendOfficerApprovalEmail({ name: officer.name, email: officer.email, position: officer.position });
    await db.user.update({ where: { id: officer.id }, data: { approvalEmailSentAt: new Date() } });
  } catch (error) {
    console.error("Account approved, but the approval email could not be sent:", error);
    return {
      ok: true,
      message:
        "Account approved. The approval email could not be sent automatically; use “Resend approval email” on the officer page.",
    };
  }

  return { ok: true, message: "Account approved and notification email sent." };
}

export async function resendApprovalEmailAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  await requireAdmin();

  const officerId = String(formData.get("officerId") ?? "");
  if (!officerId) {
    return { ok: false, message: "Officer was not found." };
  }

  const officer = await db.user.findUnique({
    where: { id: officerId },
    include: { role: true },
  });

  if (!officer || officer.role.name !== "OFFICER") {
    return { ok: false, message: "Officer was not found." };
  }
  if (officer.status !== "ACTIVE") {
    return { ok: false, message: "Approval emails can only be resent to active staff accounts." };
  }

  try {
    await sendOfficerApprovalEmail({ name: officer.name, email: officer.email, position: officer.position });
  } catch (error) {
    console.error("Unable to resend officer approval email:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to send the approval email.",
    };
  }

  await db.user.update({ where: { id: officer.id }, data: { approvalEmailSentAt: new Date() } });
  revalidatePath(`/admin/officers/${officer.id}`);

  return { ok: true, message: "Approval email resent." };
}

export async function rejectOfficerAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData
) {
  await requireAdmin();

  const officerId = String(formData.get("officerId") ?? "");
  if (!officerId) {
    return { ok: false, message: "Officer was not found." };
  }

  const officer = await db.user.findUnique({
    where: { id: officerId },
    include: { role: true },
  });

  if (!officer || officer.role.name !== "OFFICER") {
    return { ok: false, message: "Officer was not found." };
  }
  if (officer.status !== "PENDING_APPROVAL") {
    return { ok: false, message: "This officer account is no longer awaiting approval." };
  }

  const result = await db.user.updateMany({
    where: { id: officer.id, roleId: officer.roleId, status: "PENDING_APPROVAL" },
    data: { status: "INACTIVE" },
  });

  if (result.count !== 1) {
    return {
      ok: false,
      message: "The account status changed. Refresh and review the account.",
    };
  }

  await markRegistrationNotificationsReviewed(officer.id);

  revalidatePath("/admin/officers");
  revalidatePath(`/admin/officers/${officer.id}`);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/notifications");

  try {
    await sendOfficerRejectionEmail({ name: officer.name, email: officer.email });
  } catch (error) {
    console.error("Account rejected, but the rejection email could not be sent:", error);
    return {
      ok: true,
      message: "Account rejected. The rejection email could not be sent automatically.",
    };
  }

  return { ok: true, message: "Account rejected and notification email sent." };
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireAdmin();
  const notificationId = String(formData.get("notificationId") ?? "");
  if (!notificationId) {
    return;
  }

  await markNotificationRead(notificationId, user.id);
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
}

export async function markAllNotificationsReadAction() {
  const user = await requireAdmin();
  await markAllNotificationsRead(user.id);
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
}

function readCategoryIds(formData: FormData, fieldName = "categoryIds") {
  return Array.from(
    new Set(
      formData
        .getAll(fieldName)
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export async function assignOfficerCategoriesAction(formData: FormData) {
  const admin = await requireAdmin();

  const officerId = String(formData.get("officerId") ?? "");
  const categoryIds = readCategoryIds(formData);

  if (!officerId) {
    throw new Error("Officer is required.");
  }

  const [officer, categories, existing] = await Promise.all([
    db.user.findUnique({ where: { id: officerId }, include: { role: true } }),
    categoryIds.length > 0
      ? db.category.findMany({ where: { id: { in: categoryIds } } })
      : Promise.resolve([]),
    db.userCategory.findMany({ where: { userId: officerId }, select: { categoryId: true } }),
  ]);

  if (!officer || officer.role.name !== "OFFICER") {
    throw new Error("Officer was not found.");
  }
  if (officer.status === "PENDING_APPROVAL") {
    throw new Error("Approve this officer before assigning categories.");
  }

  if (categories.length !== categoryIds.length) {
    throw new Error("One or more selected categories were not found.");
  }

  const existingIds = new Set(existing.map((item) => item.categoryId));
  const addedCategoryIds = categoryIds.filter((id) => !existingIds.has(id));

  await db.$transaction([
    db.userCategory.deleteMany({ where: { userId: officerId } }),
    ...(categoryIds.length > 0
      ? [
          db.userCategory.createMany({
            data: categoryIds.map((categoryId) => ({ userId: officerId, categoryId })),
          }),
        ]
      : []),
    ...(addedCategoryIds.length > 0
      ? [
          db.assignment.createMany({
            data: addedCategoryIds.map((categoryId) => ({
              officerId,
              categoryId,
              assignedById: admin.id,
            })),
          }),
        ]
      : []),
  ]);

  if (officer.status === "ACTIVE") {
    try {
      await sendOfficerCategoryAssignmentEmail({
        name: officer.name,
        email: officer.email,
        categories: categories.map((category) => category.name).sort((a, b) => a.localeCompare(b)),
      });
    } catch (error) {
      console.error("Officer categories were saved, but the assignment email could not be sent:", error);
    }
  }

  revalidatePath("/admin/officers");
  revalidatePath(`/admin/officers/${officerId}`);
  revalidatePath("/officer/dashboard");
  revalidatePath("/officer/select-category");
}

export async function deleteOfficerAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  const admin = await requireAdmin();
  const officerId = String(formData.get("officerId") ?? "").trim();

  if (!officerId || officerId === admin.id) {
    return { ok: false, message: "Select a valid officer account." };
  }

  const officer = await db.user.findUnique({
    where: { id: officerId },
    include: { role: true },
  });

  if (!officer || officer.role.name !== "OFFICER") {
    return { ok: false, message: "Officer was not found." };
  }

  if (officer.status === "INACTIVE") {
    return { ok: false, message: "This officer account is already inactive." };
  }

  await db.$transaction([
    db.user.update({ where: { id: officer.id }, data: { status: "INACTIVE" } }),
    db.userCategory.deleteMany({ where: { userId: officer.id } }),
    db.auditLog.create({
      data: {
        userId: admin.id,
        action: "DEACTIVATE",
        module: "OFFICERS",
        recordId: officer.id,
        description: `Deactivated officer account ${officer.email} and revoked category access.`,
      },
    }),
  ]);

  revalidatePath("/admin/officers");
  revalidatePath(`/admin/officers/${officer.id}`);
  revalidatePath("/admin/categories");
  revalidatePath("/officer/dashboard");
  revalidatePath("/officer/select-category");

  try {
    await sendOfficerDeactivationEmail({ name: officer.name, email: officer.email });
  } catch (error) {
    console.error("Officer account was deactivated, but the deactivation email could not be sent:", error);
    return { ok: true, message: "Officer account deactivated and access revoked, but the email could not be sent." };
  }

  return { ok: true, message: "Officer account deactivated, category access revoked, and email sent." };
}

export async function permanentlyDeleteOfficerAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  const admin = await requireAdmin();
  const officerId = String(formData.get("officerId") ?? "").trim();

  if (!officerId || officerId === admin.id) {
    return { ok: false, message: "Select a valid officer account." };
  }

  const officer = await db.user.findUnique({
    where: { id: officerId },
    include: { role: true },
  });

  if (!officer || officer.role.name !== "OFFICER") {
    return { ok: false, message: "Officer was not found." };
  }
  let transferredAssistanceCount = 0;
  try {
    transferredAssistanceCount = await db.$transaction(async (tx) => {
      const assistance = await tx.beneficiaryAssistance.count({ where: { providedById: officer.id } });

      // Preserve operational history by making the administrator the surviving owner
      // of records that require a User relation before the officer is deleted.
      await tx.beneficiaryAssistance.updateMany({
        where: { providedById: officer.id },
        data: { providedById: admin.id },
      });
      await tx.document.updateMany({
        where: { uploaderId: officer.id },
        data: { uploaderId: admin.id },
      });
      await tx.assignment.updateMany({
        where: { officerId: officer.id },
        data: { officerId: admin.id },
      });
      await tx.assignment.updateMany({
        where: { assignedById: officer.id },
        data: { assignedById: admin.id },
      });
      await tx.beneficiary.updateMany({
        where: { assignedOfficerId: officer.id },
        data: { assignedOfficerId: null },
      });
      await tx.household.updateMany({
        where: { createdById: officer.id },
        data: { createdById: null },
      });
      await tx.auditLog.updateMany({
        where: { userId: officer.id },
        data: { userId: admin.id },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "DELETE",
          module: "OFFICERS",
          recordId: officer.id,
          description: `Deleted officer account ${officer.name}; transferred ${assistance} assistance record(s) to the administrator.`,
        },
      });

      await tx.user.delete({ where: { id: officer.id } });
      return assistance;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, message: "The account could not be deleted because a linked record could not be transferred to the administrator." };
    }
    throw error;
  }

  revalidatePath("/admin/officers");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/assistance");
  revalidatePath("/officer/dashboard");

  try {
    await sendOfficerDeletionEmail({ name: officer.name, email: officer.email, assistanceCount: transferredAssistanceCount });
  } catch (error) {
    console.error("Officer account was deleted, but the deletion email could not be sent:", error);
    return { ok: true, message: "Officer account permanently deleted, but the email could not be sent." };
  }

  return { ok: true, message: "Officer account permanently deleted and email sent." };
}

export async function setCategoryOfficersAction(formData: FormData) {
  const admin = await requireAdmin();

  const categoryId = String(formData.get("categoryId") ?? "");
  const officerIds = Array.from(
    new Set(
      formData
        .getAll("officerIds")
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  if (!categoryId) {
    throw new Error("Category is required.");
  }

  const [category, officers] = await Promise.all([
    db.category.findUnique({ where: { id: categoryId } }),
    officerIds.length > 0
      ? db.user.findMany({
          where: { id: { in: officerIds } },
          include: { role: true },
        })
      : Promise.resolve([]),
  ]);

  if (!category) {
    throw new Error("Category was not found.");
  }

  if (officers.some((officer) => officer.role.name !== "OFFICER")) {
    throw new Error("Only officers can be assigned to a category.");
  }
  if (officers.some((officer) => officer.status === "PENDING_APPROVAL")) {
    throw new Error("Approve officers before assigning categories.");
  }

  if (officers.length !== officerIds.length) {
    throw new Error("One or more selected officers were not found.");
  }

  const existing = await db.userCategory.findMany({
    where: { categoryId },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((item) => item.userId));
  const nextIds = new Set(officerIds);

  const toAdd = officerIds.filter((id) => !existingIds.has(id));
  const toRemove = existing.filter((item) => !nextIds.has(item.userId));

  await db.$transaction([
    ...(toRemove.length > 0
      ? [
          db.userCategory.deleteMany({
            where: { categoryId, userId: { in: toRemove.map((item) => item.userId) } },
          }),
        ]
      : []),
    ...(toAdd.length > 0
      ? [
          db.userCategory.createMany({
            data: toAdd.map((userId) => ({ userId, categoryId })),
          }),
        ]
      : []),
    ...(toAdd.length > 0
      ? [
          db.assignment.createMany({
            data: toAdd.map((officerId) => ({
              officerId,
              categoryId,
              assignedById: admin.id,
            })),
          }),
        ]
      : []),
  ]);

  await Promise.all(
    officers
      .filter((officer) => toAdd.includes(officer.id))
      .map(async (officer) => {
        try {
          await sendOfficerCategoryAssignmentEmail({ name: officer.name, email: officer.email, categories: [category.name] });
        } catch (error) {
          console.error(`Category assignment email failed for officer ${officer.id}:`, error);
        }
      }),
  );

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath("/admin/officers");
  revalidatePath("/officer/dashboard");
}
