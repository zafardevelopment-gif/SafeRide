import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const otpSchema = z
  .string()
  .length(6, "OTP must be 6 digits")
  .regex(/^\d+$/, "OTP must be numeric");

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  phone: phoneSchema,
  role: z.enum(["customer", "agent"]),
});

export type SignupInput = z.infer<typeof signupSchema>;
