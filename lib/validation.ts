import { z } from "zod";
import { MAHAYAG_BARANGAYS } from "@/lib/locations";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const setupSchema = z.object({
  name: z.string().trim().min(2, "Full name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  setupKey: z.string().trim().min(1, "Setup key is required."),
});

export const officerRegistrationSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required."),
  middleName: z.string().trim().max(80).optional().or(z.literal("")),
  lastName: z.string().trim().min(2, "Last name is required."),
  position: z.string().trim().min(2, "Position or designation is required."),
  employeeId: z.string().trim().min(2, "Employee ID is required.").max(50),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const adminOfficerSchema = z.object({
  name: z.string().trim().min(2, "Full name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required."),
  description: z.string().trim().max(255).optional().or(z.literal("")),
});

export const beneficiarySchema = z.object({
  firstName: z.string().trim().min(2, "First name is required."),
  middleName: z.string().trim().max(80).optional().or(z.literal("")),
  lastName: z.string().trim().min(2, "Last name is required."),
  suffix: z.string().trim().max(20).optional().or(z.literal("")),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().trim().optional().or(z.literal("")),
  civilStatus: z.enum(["SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "DIVORCED", "OTHERS"]).optional().or(z.literal("")),
  contactNumber: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  address: z.string().trim().min(5, "Address is required."),
  barangay: z.enum(MAHAYAG_BARANGAYS),
  province: z.string().trim().max(80).optional().or(z.literal("")),
  categoryId: z.string().trim().min(1, "Please choose a category."),
  assignedOfficerId: z.string().trim().optional().or(z.literal("")),
  remarks: z.string().trim().max(500).optional().or(z.literal("")),
});
