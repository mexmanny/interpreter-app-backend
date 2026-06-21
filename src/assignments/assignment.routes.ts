import { FastifyInstance } from "fastify";
import { approveAssignment, recordAssignmentEvent, requestAssignment } from "./assignment.service.js";
import { approveAssignmentJsonSchema, approveAssignmentSchema, assignmentEventJsonSchema, assignmentEventSchema, requestAssignmentJsonSchema, requestAssignmentSchema } from "./assignment.schema.js";

export async function assignmentRoutes(app: FastifyInstance) {
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
}
