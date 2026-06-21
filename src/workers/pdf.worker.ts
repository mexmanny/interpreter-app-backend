import { Worker } from "bullmq";
import {
  PlatformEventStatus,
  PlatformEventType,
  PdfGenerationStatus,
  Prisma,
} from "@prisma/client";
import {
  markAppointmentPdfFailed,
  markAppointmentPdfGenerated,
  updatePdfGenerationStatus,
} from "../appointments/appointment.repository.js";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/redis.js";
import { buildAppointmentPdf } from "../pdf/pdf.service.js";
import { createPlatformEvent } from "../platform-events/platform-event.repository.js";
import { saveLocalPdf } from "../storage/local-pdf.service.js";
import { uploadPdf } from "../storage/r2.service.js";

const recordPdfFailure = async (
  appointmentId: string,
  errorMessage: string,
  metadata?: Prisma.InputJsonValue,
) => {
  await markAppointmentPdfFailed(appointmentId, errorMessage);
  await createPlatformEvent({
    type: PlatformEventType.PDF_GENERATION_FAILED,
    status: PlatformEventStatus.FAILED,
    appointmentId,
    message: "PDF generation failed",
    errorMessage,
    metadata,
  });
};

export const pdfWorker = new Worker(
  "pdf",
  async (job) => {
    if (job.name !== "generate_appointment_pdf") return;

    const { appointmentId, savePdfLocally = true } = job.data as {
      appointmentId: string;
      savePdfLocally?: boolean;
    };

    await updatePdfGenerationStatus(appointmentId, {
      pdfGenerationStatus: PdfGenerationStatus.IN_PROGRESS,
    });
    await createPlatformEvent({
      type: PlatformEventType.PDF_GENERATION_STARTED,
      status: PlatformEventStatus.COMPLETED,
      appointmentId,
      message: "PDF generation started",
      metadata: { jobId: job.id, attempt: job.attemptsMade + 1 },
    });

    try {
      const appointment = await prisma.appointment.findUniqueOrThrow({
        where: { id: appointmentId },
      });
      const pdf = await buildAppointmentPdf(appointment);
      let localSaved = false;

      if (savePdfLocally) {
        const localPath = await saveLocalPdf(appointment.id, pdf);
        localSaved = true;
        await createPlatformEvent({
          type: PlatformEventType.PDF_SAVED_LOCALLY,
          status: PlatformEventStatus.COMPLETED,
          appointmentId,
          message: "PDF saved locally",
          metadata: { localPath },
        });
      }

      try {
        const key = `appointments/${appointment.id}.pdf`;
        const pdfUrl = await uploadPdf({ key, body: pdf });
        await markAppointmentPdfGenerated(appointment.id, { pdfStorageKey: key, pdfUrl });
        await createPlatformEvent({
          type: PlatformEventType.PDF_GENERATION_SUCCEEDED,
          status: PlatformEventStatus.COMPLETED,
          appointmentId,
          message: "PDF generated and uploaded",
          metadata: { pdfStorageKey: key, pdfUrl },
        });
      } catch (r2Error) {
        const errorMessage =
          r2Error instanceof Error ? r2Error.message : "R2 upload failed";

        if (localSaved) {
          await markAppointmentPdfFailed(appointmentId, errorMessage);
          await createPlatformEvent({
            type: PlatformEventType.PDF_GENERATION_FAILED,
            status: PlatformEventStatus.FAILED,
            appointmentId,
            message: "PDF saved locally but cloud upload failed",
            errorMessage,
            metadata: {
              jobId: job.id,
              attempt: job.attemptsMade + 1,
              localSaved: true,
            },
          });
          return;
        }

        await recordPdfFailure(appointmentId, errorMessage, {
          jobId: job.id,
          attempt: job.attemptsMade + 1,
        });
        throw r2Error;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown PDF generation error";
      await recordPdfFailure(appointmentId, errorMessage, {
        jobId: job.id,
        attempt: job.attemptsMade + 1,
      });
      throw error;
    }
  },
  { connection: redisConnection },
);

pdfWorker.on("failed", async (job, error) => {
  if (!job || job.name !== "generate_appointment_pdf") return;

  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  const { appointmentId } = job.data as { appointmentId: string };
  const errorMessage = error instanceof Error ? error.message : "PDF generation failed";
  await markAppointmentPdfFailed(appointmentId, errorMessage);
});
