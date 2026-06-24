import { FastifyInstance } from "fastify";
import { createAppointment } from "./appointment.service.js";
import { createAppointmentJsonSchema, createAppointmentSchema } from "./appointment.schema.js";
import {
  findAppointmentById,
  findAssignmentRequestsByAppointmentId,
  findOpenAppointments,
} from "./appointment.repository.js";
import { listPlatformEventsByAppointmentId } from "../platform-events/platform-event.repository.js";
import {
  localPdfFilename,
  readLocalPdf,
} from "../storage/local-pdf.service.js";
import { downloadPdf } from "../storage/r2.service.js";
import { buildAppointmentIcs } from "../calendar/ics.service.js";

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

  app.get("/appointments/:appointmentId", async (request) => {
    const { appointmentId } = request.params as { appointmentId: string };
    const appointment = await findAppointmentById(appointmentId);
    if (!appointment) {
      throw app.httpErrors.notFound("Appointment not found");
    }
    return appointment;
  });

  app.get("/appointments/:appointmentId/requests", async (request) => {
    const { appointmentId } = request.params as { appointmentId: string };
    const appointment = await findAppointmentById(appointmentId);
    if (!appointment) {
      throw app.httpErrors.notFound("Appointment not found");
    }
    return findAssignmentRequestsByAppointmentId(appointmentId);
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

  app.get("/appointments/:appointmentId/calendar.ics", async (request, reply) => {
    const { appointmentId } = request.params as { appointmentId: string };
    const appointment = await findAppointmentById(appointmentId);
    if (!appointment) {
      throw app.httpErrors.notFound("Appointment not found");
    }

    const ics = buildAppointmentIcs(appointment);
    return reply
      .header("Content-Type", "text/calendar; charset=utf-8")
      .header(
        "Content-Disposition",
        `attachment; filename="appointment-${appointmentId}.ics"`,
      )
      .send(ics);
  });

  // Served without a .ics URL suffix so mobile clients import a single event
  // instead of offering to subscribe to a recurring calendar feed.
  app.get("/appointments/:appointmentId/calendar/file", async (request, reply) => {
    const { appointmentId } = request.params as { appointmentId: string };
    const appointment = await findAppointmentById(appointmentId);
    if (!appointment) {
      throw app.httpErrors.notFound("Appointment not found");
    }

    const ics = buildAppointmentIcs(appointment);
    return reply
      .header("Content-Type", "application/octet-stream")
      .header(
        "Content-Disposition",
        `attachment; filename="interpreter-session-${appointmentId}.ics"`,
      )
      .send(ics);
  });
}
