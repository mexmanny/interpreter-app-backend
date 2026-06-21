import { FastifyInstance } from "fastify";
import { createAppointment } from "./appointment.service.js";
import { createAppointmentJsonSchema, createAppointmentSchema } from "./appointment.schema.js";
import {
  findAppointmentById,
  findOpenAppointments,
} from "./appointment.repository.js";
import { listPlatformEventsByAppointmentId } from "../platform-events/platform-event.repository.js";
import {
  localPdfFilename,
  readLocalPdf,
} from "../storage/local-pdf.service.js";
import { downloadPdf } from "../storage/r2.service.js";

export async function appointmentRoutes(app: FastifyInstance) {
  app.post("/appointments", {
    schema: { body: createAppointmentJsonSchema }
  }, async (request, reply) => {
    const input = createAppointmentSchema.parse(request.body);
    const appointment = await createAppointment(input);
    return reply.code(201).send(appointment);
  });

  app.get("/appointments/open", async () => {
    return findOpenAppointments();
  });

  app.get("/appointments/:appointmentId/events", async (request) => {
    const { appointmentId } = request.params as { appointmentId: string };
    return listPlatformEventsByAppointmentId(appointmentId);
  });

  app.get("/appointments/:appointmentId/pdf", async (request, reply) => {
    const { appointmentId } = request.params as { appointmentId: string };
    const filename = localPdfFilename(appointmentId);

    const localPdf = await readLocalPdf(appointmentId);
    if (localPdf) {
      return reply
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .send(localPdf);
    }

    const appointment = await findAppointmentById(appointmentId);
    if (!appointment?.pdfStorageKey) {
      throw app.httpErrors.notFound("PDF not available");
    }

    const pdf = await downloadPdf(appointment.pdfStorageKey);
    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(pdf);
  });
}
