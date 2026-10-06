import { z } from "zod";

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
  barangay: z.string().trim().max(80).optional().or(z.literal("")),
  municipality: z.string().trim().max(80).optional().or(z.literal("")),
  province: z.string().trim().max(80).optional().or(z.literal("")),
  categoryId: z.string().trim().min(1, "Please choose a category."),
  subcategory: z.string().trim().max(80).optional().or(z.literal("")),
  assignedOfficerId: z.string().trim().optional().or(z.literal("")),
  remarks: z.string().trim().max(500).optional().or(z.literal("")),
});

export const caseSchema = z.object({
  beneficiaryId: z.string().trim().min(1, "Please select a beneficiary."),
  categoryId: z.string().trim().min(1, "Please select a category."),
  caseType: z.string().trim().min(2, "Case type is required."),
  description: z.string().trim().min(10, "Description must be at least 10 characters."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedOfficerId: z.string().trim().optional().or(z.literal("")),
  remarks: z.string().trim().max(500).optional().or(z.literal("")),
});
