import { AssignmentEventType, AssignmentStatus, AppointmentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const createAssignmentRequest = (data: { appointmentId: string; interpreterId: string; note?: string }) =>
  prisma.assignmentRequest.create({ data });

export const findAssignmentRequestById = (id: string) =>
  prisma.assignmentRequest.findUniqueOrThrow({ where: { id }, include: { appointment: true, interpreter: true } });

export const createConfirmedAssignmentFromRequest = async (requestId: string) =>
  prisma.$transaction(async (tx) => {
    const request = await tx.assignmentRequest.findUniqueOrThrow({ where: { id: requestId } });

    const assignment = await tx.assignment.create({
      data: {
        appointmentId: request.appointmentId,
        interpreterId: request.interpreterId,
        status: AssignmentStatus.CONFIRMED,
        events: { create: { type: AssignmentEventType.CONFIRMED } }
      }
    });

    await tx.appointment.update({
      where: { id: request.appointmentId },
      data: { status: AppointmentStatus.ASSIGNED }
    });

    return assignment;
  });

export const addAssignmentEvent = async (assignmentId: string, event: { type: AssignmentEventType; notes?: string }) =>
  prisma.$transaction(async (tx) => {
    const assignmentEvent = await tx.assignmentEvent.create({ data: { assignmentId, type: event.type, notes: event.notes } });

    const statusByEvent: Partial<Record<AssignmentEventType, AssignmentStatus>> = {
      CHECKED_IN: AssignmentStatus.IN_PROGRESS,
      CHECKED_OUT: AssignmentStatus.COMPLETED,
      PATIENT_NO_SHOW: AssignmentStatus.PATIENT_NO_SHOW,
      CANCELLED: AssignmentStatus.CANCELLED,
      COMPLETED: AssignmentStatus.COMPLETED
    };

    const updateData: Record<string, unknown> = {};
    if (statusByEvent[event.type]) updateData.status = statusByEvent[event.type];
    if (event.type === "CHECKED_IN") updateData.checkedInAt = new Date();
    if (event.type === "CHECKED_OUT") updateData.checkedOutAt = new Date();
    if (event.notes) updateData.notes = event.notes;

    await tx.assignment.update({ where: { id: assignmentId }, data: updateData });

    return assignmentEvent;
  });

export const findAssignmentsDueForOneHourReminder = (
  windowStart: Date,
  windowEnd: Date,
) =>
  prisma.assignment.findMany({
    where: {
      status: AssignmentStatus.CONFIRMED,
      reminderOneHourSentAt: null,
      appointment: { startTime: { gte: windowStart, lte: windowEnd } },
    },
    include: { appointment: true, interpreter: true },
  });

export const markReminderOneHourSent = (id: string) =>
  prisma.assignment.update({
    where: { id },
    data: { reminderOneHourSentAt: new Date() },
  });

export const findAssignmentById = (id: string) =>
  prisma.assignment.findUnique({
    where: { id },
    include: {
      appointment: true,
      interpreter: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

export const findAssignmentEventsByAssignmentId = (assignmentId: string) =>
  prisma.assignmentEvent.findMany({
    where: { assignmentId },
    orderBy: { createdAt: "asc" },
  });
