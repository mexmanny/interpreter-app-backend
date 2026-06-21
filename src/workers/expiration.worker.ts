import { Worker } from "bullmq";
import {
  findOpenExpiredAppointments,
  expireAppointment,
} from "../appointments/appointment.repository.js";
import { redisConnection } from "../lib/redis.js";
import { createPlatformEvent } from "../platform-events/platform-event.repository.js";
import { PlatformEventStatus, PlatformEventType } from "@prisma/client";
import { deleteFile } from "../storage/r2.service.js";

export const expirationWorker = new Worker(
  "expirations",
  async (job) => {
    if (job.name !== "expire_open_appointments") return;
    const appointments = await findOpenExpiredAppointments();

    for (const appointment of appointments) {
      if (appointment.pdfStorageKey) {
        await deleteFile(appointment.pdfStorageKey);
        await createPlatformEvent({
          type: PlatformEventType.PDF_DELETED,
          status: PlatformEventStatus.COMPLETED,
          appointmentId: appointment.id,
          message: "PDF deleted because appointment expired without assignment",
          metadata: { pdfStorageKey: appointment.pdfStorageKey },
        });
      }

      await expireAppointment(appointment.id);
      await createPlatformEvent({
        type: PlatformEventType.APPOINTMENT_EXPIRED,
        status: PlatformEventStatus.COMPLETED,
        appointmentId: appointment.id,
        message: "Appointment expired without assignment",
      });
    }
  },
  { connection: redisConnection },
);
