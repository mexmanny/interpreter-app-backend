import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const acceptOfferSchema = z.object({
  token: z.string().min(1),
});

export type AcceptOfferInput = z.infer<typeof acceptOfferSchema>;
export const acceptOfferJsonSchema = zodToJsonSchema(acceptOfferSchema);
