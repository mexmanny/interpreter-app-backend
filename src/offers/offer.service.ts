import { randomBytes } from "node:crypto";
import { AppointmentStatus } from "@prisma/client";
import { confirmInterpreterForAppointment } from "../assignments/assignment.service.js";
import { notificationQueue } from "../queues/queues.js";
import { prisma } from "../lib/prisma.js";
import {
  createAssignmentOffer,
  expireAssignmentOffer,
  findAssignmentOfferById,
  markAssignmentOfferAccepted,
} from "./offer.repository.js";

const OFFER_EXPIRY_MS = 60 * 60 * 1000;

export const createOfferForAppointment = async (
  appointmentId: string,
  interpreterId: string,
) => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + OFFER_EXPIRY_MS);

  const offer = await createAssignmentOffer({
    appointmentId,
    interpreterId,
    token,
    expiresAt,
  });

  await notificationQueue.add(
    "assignment_offer",
    { offerId: offer.id },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  );

  return offer;
};

export const acceptAssignmentOffer = async (offerId: string, token: string) => {
  const offer = await findAssignmentOfferById(offerId);
  if (!offer) {
    throw Object.assign(new Error("Offer not found"), { statusCode: 404 });
  }
  if (offer.token !== token) {
    throw Object.assign(new Error("Invalid offer token"), { statusCode: 403 });
  }
  if (offer.status === "ACCEPTED") {
    const assignment = await prisma.assignment.findFirst({
      where: {
        appointmentId: offer.appointmentId,
        interpreterId: offer.interpreterId,
      },
    });
    if (!assignment) {
      throw Object.assign(new Error("Accepted offer has no assignment"), { statusCode: 500 });
    }
    return { offer, assignment, alreadyAccepted: true };
  }
  if (offer.status !== "PENDING") {
    throw Object.assign(new Error("Offer is no longer available"), { statusCode: 409 });
  }
  if (offer.expiresAt.getTime() < Date.now()) {
    await expireAssignmentOffer(offer.id);
    throw Object.assign(new Error("Offer has expired"), { statusCode: 410 });
  }
  if (offer.appointment.status === AppointmentStatus.ASSIGNED) {
    throw Object.assign(new Error("Appointment is already assigned"), { statusCode: 409 });
  }

  const assignment = await confirmInterpreterForAppointment(
    offer.appointmentId,
    offer.interpreterId,
  );
  await markAssignmentOfferAccepted(offer.id);

  return { offer, assignment, alreadyAccepted: false };
};
