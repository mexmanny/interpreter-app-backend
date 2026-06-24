import { Appointment } from "@prisma/client";
import { env } from "../config/env.js";

const formatOfferDateTime = (date: Date) => {
  const datePart = date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} ${timePart}`;
};

export const buildAssignmentOfferMessage = (
  appointment: Appointment,
  offerId: string,
  token: string,
) => {
  const confirmLink = `${env.WEB_APP_URL}/interpreter/offers/${offerId}?token=${token}`;
  const pay = `$${(appointment.payAmountCents / 100).toFixed(2)}`;

  return [
    `Offer: ${appointment.clientName}, ${appointment.facilityName}, ${appointment.address}, ${formatOfferDateTime(appointment.startTime)}, ${pay}`,
    `Confirm you can work: ${confirmLink}`,
  ].join("\n");
};
