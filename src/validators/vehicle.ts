import { z } from "zod";

const currentYear = new Date().getFullYear();

export const vehicleSchema = z.object({
  vehicle_number: z
    .string()
    .min(4, "Enter a valid vehicle number")
    .max(20)
    .transform((v) => v.toUpperCase().replace(/\s/g, "")),
  type: z.enum(["bike", "scooter", "car", "auto", "truck", "other"]),
  brand: z.string().min(1, "Brand is required").max(50),
  model: z.string().min(1, "Model is required").max(80),
  color: z.string().min(1, "Color is required").max(30),
  year: z
    .number()
    .int()
    .min(1980, "Year must be 1980 or later")
    .max(currentYear + 1)
    .optional(),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(2, "Name is required").max(80),
  relation: z.string().min(1, "Relation is required").max(30),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  priority_order: z.number().int().min(1),
});

export const medicalProfileSchema = z.object({
  blood_group: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),
  allergies: z.string().max(500).optional(),
  conditions: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
  consent_given: z.literal(true, {
    error: "You must consent to store medical data",
  }),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;
export type MedicalProfileInput = z.infer<typeof medicalProfileSchema>;
