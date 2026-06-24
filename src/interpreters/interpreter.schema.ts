import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const createInterpreterSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  languages: z.array(z.string().min(1)).min(1),
  coverageAreas: z.array(z.string().min(1)).min(1),
  transportEligible: z.boolean().default(false),
  active: z.boolean().default(true)
});

export type CreateInterpreterInput = z.infer<typeof createInterpreterSchema>;
export const createInterpreterJsonSchema = zodToJsonSchema(createInterpreterSchema);

export const updateInterpreterSchema = createInterpreterSchema;
export type UpdateInterpreterInput = z.infer<typeof updateInterpreterSchema>;
export const updateInterpreterJsonSchema = zodToJsonSchema(updateInterpreterSchema);
