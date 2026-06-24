import { FastifyInstance } from "fastify";
import {
  createInterpreterJsonSchema,
  createInterpreterSchema,
  updateInterpreterJsonSchema,
  updateInterpreterSchema,
} from "./interpreter.schema.js";
import {
  createInterpreterRecord,
  deleteInterpreterRecord,
  findEligibleInterpreters,
  findInterpreterById,
  interpreterHasRelatedRecords,
  listInterpreters,
  updateInterpreterRecord,
} from "./interpreter.repository.js";

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

  app.get("/interpreters/:interpreterId", async (request) => {
    const { interpreterId } = request.params as { interpreterId: string };
    const interpreter = await findInterpreterById(interpreterId);
    if (!interpreter) {
      throw app.httpErrors.notFound("Interpreter not found");
    }
    return interpreter;
  });

  app.patch(
    "/interpreters/:interpreterId",
    { schema: { body: updateInterpreterJsonSchema } },
    async (request) => {
      const { interpreterId } = request.params as { interpreterId: string };
      const existing = await findInterpreterById(interpreterId);
      if (!existing) {
        throw app.httpErrors.notFound("Interpreter not found");
      }

      const input = updateInterpreterSchema.parse(request.body);
      return updateInterpreterRecord(interpreterId, input);
    },
  );

  app.delete("/interpreters/:interpreterId", async (request) => {
    const { interpreterId } = request.params as { interpreterId: string };
    const existing = await findInterpreterById(interpreterId);
    if (!existing) {
      throw app.httpErrors.notFound("Interpreter not found");
    }

    if (await interpreterHasRelatedRecords(interpreterId)) {
      throw app.httpErrors.conflict(
        "Cannot delete interpreter with existing assignments, requests, or offers",
      );
    }

    await deleteInterpreterRecord(interpreterId);
    return { id: interpreterId, deleted: true };
  });
}
