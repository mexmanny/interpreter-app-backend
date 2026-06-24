import { Appointment } from "@prisma/client";

const formatIcsUtc = (date: Date) =>
  date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const escapeIcsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export const buildAppointmentIcs = (appointment: Appointment): string => {
  const start = appointment.startTime;
  const end = new Date(start.getTime() + appointment.durationMinutes * 60_000);
  const now = new Date();

  const summary = escapeIcsText(
    `Interpreter Session — ${appointment.patientName} @ ${appointment.facilityName}`,
  );
  const location = escapeIcsText(`${appointment.facilityName}, ${appointment.address}`);
  const description = escapeIcsText(
    [
      `Patient: ${appointment.patientName}`,
      `Client: ${appointment.clientName}`,
      `Duration: ${appointment.durationMinutes} minutes`,
      appointment.contactNumber ? `Contact: ${appointment.contactNumber}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Interpreter Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:appointment-${appointment.id}@interpreter-platform`,
    `DTSTAMP:${formatIcsUtc(now)}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};
