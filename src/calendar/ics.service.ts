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

  // Omit METHOD — METHOD:PUBLISH makes many clients (especially Apple Calendar)
  // treat a fetchable .ics URL as a subscription feed instead of a one-off event.
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Interpreter Platform//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:appointment-${appointment.id}@interpreter-platform`,
    `DTSTAMP:${formatIcsUtc(now)}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};
