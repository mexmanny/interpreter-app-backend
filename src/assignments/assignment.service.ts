import { AssignmentEventType } from "@prisma/client";
import { notificationQueue } from "../queues/queues.js";
import { createAssignmentRequest, createConfirmedAssignmentFromRequest, addAssignmentEvent } from "./assignment.repository.js";
import { RequestAssignmentInput } from "./assignment.schema.js";

export const requestAssignment = async (input: RequestAssignmentInput) => {
  const request = await createAssignmentRequest(input);
  await notificationQueue.add("coordinator_assignment_request", { requestId: request.id }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
  return request;
};

export const approveAssignment = async (requestId: string) => {
  const assignment = await createConfirmedAssignmentFromRequest(requestId);
  await notificationQueue.add("assignment_confirmed", { assignmentId: assignment.id }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
  return assignment;
};

export const recordAssignmentEvent = async (assignmentId: string, type: AssignmentEventType, notes?: string) => {
  const event = await addAssignmentEvent(assignmentId, { type, notes });
  await notificationQueue.add("assignment_event", { assignmentId, eventType: type }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
  return event;
};
