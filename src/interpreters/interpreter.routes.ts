import { FastifyInstance } from "fastify";
import { createInterpreterJsonSchema, createInterpreterSchema } from "./interpreter.schema.js";
import { createInterpreterRecord, listInterpreters } from "./interpreter.repository.js";

export async function interpreterRoutes(app: FastifyInstance) {
  app.post("/interpreters", { schema: { body: createInterpreterJsonSchema } }, async (request, reply) => {
    const input = createInterpreterSchema.parse(request.body);
    const interpreter = await createInterpreterRecord(input);
    return reply.code(201).send(interpreter);
  });

  app.get("/interpreters", async () => listInterpreters());
}
