import { FastifyInstance } from "fastify";
import { approveAssignment, recordAssignmentEvent, requestAssignment, sendMessageToAssignedInterpreter } from "./assignment.service.js";
import { approveAssignmentJsonSchema, approveAssignmentSchema, assignmentEventJsonSchema, assignmentEventSchema, requestAssignmentJsonSchema, requestAssignmentSchema, sendAssignmentMessageJsonSchema, sendAssignmentMessageSchema } from "./assignment.schema.js";
import {
  findAssignmentById,
  findAssignmentEventsByAssignmentId,
} from "./assignment.repository.js";

export async function assignmentRoutes(app: FastifyInstance) {
  app.get("/assignments/:assignmentId", async (request) => {
    const { assignmentId } = request.params as { assignmentId: string };
    const assignment = await findAssignmentById(assignmentId);
    if (!assignment) {
      throw app.httpErrors.notFound("Assignment not found");
    }
    return assignment;
  });

  app.get("/assignments/:assignmentId/events", async (request) => {
    const { assignmentId } = request.params as { assignmentId: string };
    const assignment = await findAssignmentById(assignmentId);
    if (!assignment) {
      throw app.httpErrors.notFound("Assignment not found");
    }
    return findAssignmentEventsByAssignmentId(assignmentId);
  });

  app.post("/assignments/requests", { schema: { body: requestAssignmentJsonSchema } }, async (request, reply) => {
    const input = requestAssignmentSchema.parse(request.body);
    const assignmentRequest = await requestAssignment(input);
    return reply.code(201).send(assignmentRequest);
  });

  app.post("/assignments/approve", { schema: { body: approveAssignmentJsonSchema } }, async (request) => {
    const input = approveAssignmentSchema.parse(request.body);
    return approveAssignment(input.requestId);
  });

  app.post("/assignments/:assignmentId/events", { schema: { body: assignmentEventJsonSchema } }, async (request) => {
    const params = request.params as { assignmentId: string };
    const input = assignmentEventSchema.parse(request.body);
    return recordAssignmentEvent(params.assignmentId, input.type, input.notes);
  });

  app.post(
    "/assignments/:assignmentId/message",
    { schema: { body: sendAssignmentMessageJsonSchema } },
    async (request) => {
      const { assignmentId } = request.params as { assignmentId: string };
      const input = sendAssignmentMessageSchema.parse(request.body);
      return sendMessageToAssignedInterpreter(assignmentId, input);
    },
  );
}
