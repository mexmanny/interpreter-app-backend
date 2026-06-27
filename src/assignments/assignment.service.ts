import { AssignmentEventType } from "@prisma/client";
import { notificationQueue } from "../queues/queues.js";
import {
  createConfirmedAssignment,
  createConfirmedAssignmentFromRequest,
  findAssignmentRequestById,
  createAssignmentRequest,
  addAssignmentEvent,
  findAssignmentById,
} from "./assignment.repository.js";
import { RequestAssignmentInput, SendAssignmentMessageInput } from "./assignment.schema.js";
import { sendSms } from "../notifications/notification.service.js";

export const requestAssignment = async (input: RequestAssignmentInput) => {
  const request = await createAssignmentRequest(input);
  await notificationQueue.add("coordinator_assignment_request", { requestId: request.id }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
  return request;
};

export const confirmInterpreterForAppointment = async (
  appointmentId: string,
  interpreterId: string,
) => {
  const assignment = await createConfirmedAssignment(appointmentId, interpreterId);
  await notificationQueue.add(
    "assignment_confirmed",
    { assignmentId: assignment.id },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  );
  return assignment;
};

export const approveAssignment = async (requestId: string) => {
  const request = await findAssignmentRequestById(requestId);
  return confirmInterpreterForAppointment(request.appointmentId, request.interpreterId);
};

export const recordAssignmentEvent = async (
  assignmentId: string,
  type: AssignmentEventType,
  notes?: string,
) => {
  const event = await addAssignmentEvent(assignmentId, { type, notes });
  await notificationQueue.add("assignment_event", { assignmentId, eventType: type }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
  return event;
};

export const sendMessageToAssignedInterpreter = async (
  assignmentId: string,
  input: SendAssignmentMessageInput,
) => {
  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) {
    throw Object.assign(new Error("Assignment not found"), { statusCode: 404 });
  }

  await sendSms({
    to: assignment.interpreter.phone,
    message: input.message,
    assignmentId: assignment.id,
    appointmentId: assignment.appointmentId,
  });

  return { sent: true, assignmentId: assignment.id };
};
