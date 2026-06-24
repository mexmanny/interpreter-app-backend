import { AssignmentOfferStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const createAssignmentOffer = (data: {
  appointmentId: string;
  interpreterId: string;
  token: string;
  expiresAt: Date;
}) =>
  prisma.assignmentOffer.create({
    data: {
      ...data,
      status: AssignmentOfferStatus.PENDING,
    },
    include: { appointment: true, interpreter: true },
  });

export const findAssignmentOfferById = (id: string) =>
  prisma.assignmentOffer.findUnique({
    where: { id },
    include: { appointment: true, interpreter: true },
  });

export const markAssignmentOfferAccepted = (id: string) =>
  prisma.assignmentOffer.update({
    where: { id },
    data: {
      status: AssignmentOfferStatus.ACCEPTED,
      respondedAt: new Date(),
    },
  });

export const expireAssignmentOffer = (id: string) =>
  prisma.assignmentOffer.update({
    where: { id },
    data: { status: AssignmentOfferStatus.EXPIRED },
  });
