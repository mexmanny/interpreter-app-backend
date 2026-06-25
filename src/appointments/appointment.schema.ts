import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const wallClockDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Expected YYYY-MM-DDTHH:mm");

export const createAppointmentSchema = z.object({
  date: wallClockDateTimeSchema,
  startTime: wallClockDateTimeSchema,
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
  assignmentMode: z.enum(["OPEN", "ASSIGN", "OFFER"]).default("OPEN"),
  interpreterId: z.string().optional(),
}).superRefine((data, ctx) => {
  if ((data.assignmentMode === "ASSIGN" || data.assignmentMode === "OFFER") && !data.interpreterId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "interpreterId is required for ASSIGN and OFFER modes",
      path: ["interpreterId"],
    });
  }
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export const createAppointmentJsonSchema = zodToJsonSchema(createAppointmentSchema);
