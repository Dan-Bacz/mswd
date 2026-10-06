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
