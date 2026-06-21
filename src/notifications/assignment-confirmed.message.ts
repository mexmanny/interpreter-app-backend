import { Appointment } from "@prisma/client";
import { env } from "../config/env.js";

const formatAppointmentDateTime = (date: Date) => {
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
  return `${datePart} - ${timePart}`;
};

export const buildAssignmentConfirmedMessage = (
  appointment: Appointment,
  assignmentId: string,
) => {
  const detailsLink = `${env.WEB_APP_URL}/interpreter/assignments/${assignmentId}`;
  const pdfLink = `${env.WEB_APP_URL}/api/appointments/${appointment.id}/pdf`;
  // TODO(calendar): Replace placeholder when ICS endpoint is implemented.
  const calendarLink = `${env.WEB_APP_URL}/api/appointments/${appointment.id}/calendar.ics`;

  return [
    "Session Assigned",
    `Date: ${formatAppointmentDateTime(appointment.startTime)}`,
    `Patient: ${appointment.patientName}`,
    `Client: ${appointment.clientName}`,
    "Address:",
    appointment.facilityName,
    appointment.address,
    "",
    "Download PDF / View Details:",
    pdfLink,
    detailsLink,
    "",
    "Add to calendar:",
    calendarLink,
    "",
    "Reminder will be sent 1 hr before appt.",
  ].join("\n");
};
