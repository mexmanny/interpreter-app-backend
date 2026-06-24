import { FastifyInstance } from "fastify";
import { createInterpreterJsonSchema, createInterpreterSchema } from "./interpreter.schema.js";
import { createInterpreterRecord, findEligibleInterpreters, listInterpreters } from "./interpreter.repository.js";

export async function interpreterRoutes(app: FastifyInstance) {
  app.post("/interpreters", { schema: { body: createInterpreterJsonSchema } }, async (request, reply) => {
    const input = createInterpreterSchema.parse(request.body);
    const interpreter = await createInterpreterRecord(input);
    return reply.code(201).send(interpreter);
  });

  app.get("/interpreters", async () => listInterpreters());

  app.get("/interpreters/eligible", async (request) => {
    const query = request.query as {
      languageNeeded?: string;
      coverageArea?: string;
      transportRequired?: string;
    };

    if (!query.languageNeeded || !query.coverageArea) {
      throw app.httpErrors.badRequest("languageNeeded and coverageArea are required");
    }

    return findEligibleInterpreters({
      languageNeeded: query.languageNeeded,
      coverageArea: query.coverageArea,
      transportRequired: query.transportRequired === "true",
    });
  });
}
