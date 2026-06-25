import { Appointment } from "@prisma/client";
import { env } from "../config/env.js";
import { formatAppointmentDateTime } from "../utils/datetime.js";

export const buildAssignmentOfferMessage = (
  appointment: Appointment,
  offerId: string,
  token: string,
) => {
  const confirmLink = `${env.WEB_APP_URL}/interpreter/offers/${offerId}?token=${token}`;
  const pay = `$${(appointment.payAmountCents / 100).toFixed(2)}`;

  return [
    `Offer: ${appointment.clientName}, ${appointment.facilityName}, ${appointment.address}, ${formatAppointmentDateTime(appointment.startTime)}, ${pay}`,
    `Confirm you can work: ${confirmLink}`,
  ].join("\n");
};
