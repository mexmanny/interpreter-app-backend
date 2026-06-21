import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const createAppointmentSchema = z.object({
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  patientName: z.string().min(1),
  clientName: z.string().min(1),
  facilityName: z.string().min(1),
  address: z.string().min(1),
  contactNumber: z.string().optional(),
  payAmountCents: z.number().int().nonnegative(),
  languageNeeded: z.string().min(1),
  coverageArea: z.string().min(1),
  transportRequired: z.boolean().default(false),
  urgency: z.enum(["STANDARD", "SAME_DAY", "URGENT"]).default("STANDARD"),
  savePdfLocally: z.boolean().default(true),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export const createAppointmentJsonSchema = zodToJsonSchema(createAppointmentSchema);
