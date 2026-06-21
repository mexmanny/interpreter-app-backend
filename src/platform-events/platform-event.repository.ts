import {
  PlatformEventStatus,
  PlatformEventType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type CreatePlatformEventInput = {
  type: PlatformEventType;
  status: PlatformEventStatus;
  appointmentId?: string;
  assignmentId?: string;
  message?: string;
  errorMessage?: string;
  metadata?: Prisma.InputJsonValue;
};

export const createPlatformEvent = (data: CreatePlatformEventInput) =>
  prisma.platformEvent.create({ data });

export const listPlatformEventsByAppointmentId = (appointmentId: string) =>
  prisma.platformEvent.findMany({
    where: { appointmentId },
    orderBy: { createdAt: "asc" },
  });
