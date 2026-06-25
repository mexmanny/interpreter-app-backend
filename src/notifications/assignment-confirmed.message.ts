import { Appointment } from "@prisma/client";
import { env } from "../config/env.js";
import { formatAppointmentDateTime } from "../utils/datetime.js";

export const buildAssignmentConfirmedMessage = (
  appointment: Appointment,
  assignmentId: string,
) => {
  const detailsLink = `${env.WEB_APP_URL}/interpreter/assignments/${assignmentId}`;
  const pdfLink = `${env.WEB_APP_URL}/api/appointments/${appointment.id}/pdf`;
  const calendarLink = `${env.WEB_APP_URL}/appointments/${appointment.id}/calendar`;

  return [
    "Session Assigned",
    `Date: ${formatAppointmentDateTime(appointment.startTime)}`,
    `Patient: ${appointment.patientName}`,
    `Client: ${appointment.clientName}`,
    "Address:",
    appointment.facilityName,
    appointment.address,
    "",
    "Download PDF:",
    pdfLink,
    "",
    "Check in and Check out on this link:",
    detailsLink,
    "",
    "Add to calendar:",
    calendarLink,
    "",
    "Reminder will be sent 1 hr before appt.",
  ].join("\n");
};
