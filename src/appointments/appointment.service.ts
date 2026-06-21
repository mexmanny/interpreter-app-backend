import { URGENCY_RESPONSE_WINDOWS_MINUTES } from "../utils/constants.js";
import { createAppointmentRecord } from "./appointment.repository.js";
import { CreateAppointmentInput } from "./appointment.schema.js";
import { pdfQueue } from "../queues/queues.js";
import { createPlatformEvent } from "../platform-events/platform-event.repository.js";
import { PlatformEventStatus, PlatformEventType } from "@prisma/client";

export const createAppointment = async (input: CreateAppointmentInput) => {
  const responseWindowMinutes = URGENCY_RESPONSE_WINDOWS_MINUTES[input.urgency];
  const coverageExpiresAt = new Date(
    Date.now() + responseWindowMinutes * 60_000,
  );

  const appointment = await createAppointmentRecord({
    date: new Date(input.date),
    startTime: new Date(input.startTime),
    durationMinutes: input.durationMinutes,
    patientName: input.patientName,
    clientName: input.clientName,
    facilityName: input.facilityName,
    address: input.address,
    contactNumber: input.contactNumber,
    payAmountCents: input.payAmountCents,
    languageNeeded: input.languageNeeded,
    coverageArea: input.coverageArea,
    transportRequired: input.transportRequired,
    urgency: input.urgency,
    coverageExpiresAt,
  });

  await pdfQueue.add(
    "generate_appointment_pdf",
    { appointmentId: appointment.id, savePdfLocally: input.savePdfLocally },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  );

  await createPlatformEvent({
    type: PlatformEventType.PDF_GENERATION_QUEUED,
    status: PlatformEventStatus.COMPLETED,
    appointmentId: appointment.id,
    message: "PDF generation queued",
  });

  return appointment;
};
