import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const requestAssignmentSchema = z.object({
  appointmentId: z.string().min(1),
  interpreterId: z.string().min(1),
  note: z.string().optional()
});
export const approveAssignmentSchema = z.object({
  requestId: z.string().min(1)
});
export const assignmentEventSchema = z.object({
  type: z.enum(["CHECKED_IN", "CHECKED_OUT", "PATIENT_NO_SHOW", "RUNNING_LATE", "CANCELLED"]),
  notes: z.string().optional()
});
export const sendAssignmentMessageSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

export type RequestAssignmentInput = z.infer<typeof requestAssignmentSchema>;
export type ApproveAssignmentInput = z.infer<typeof approveAssignmentSchema>;
export type AssignmentEventInput = z.infer<typeof assignmentEventSchema>;
export type SendAssignmentMessageInput = z.infer<typeof sendAssignmentMessageSchema>;

export const requestAssignmentJsonSchema = zodToJsonSchema(requestAssignmentSchema);
export const approveAssignmentJsonSchema = zodToJsonSchema(approveAssignmentSchema);
export const assignmentEventJsonSchema = zodToJsonSchema(assignmentEventSchema);
export const sendAssignmentMessageJsonSchema = zodToJsonSchema(sendAssignmentMessageSchema);
