import { PdfGenerationStatus, Prisma, AppointmentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const createAppointmentRecord = (data: Prisma.AppointmentCreateInput) =>
  prisma.appointment.create({ data });

export const updateAppointmentPdf = (
  id: string,
  data: { pdfStorageKey: string; pdfUrl: string },
) => prisma.appointment.update({ where: { id }, data });

export const updatePdfGenerationStatus = (
  id: string,
  data: {
    pdfGenerationStatus: PdfGenerationStatus;
    pdfGenerationError?: string | null;
    pdfGeneratedAt?: Date | null;
    pdfDeletedAt?: Date | null;
  },
) => prisma.appointment.update({ where: { id }, data });

export const markAppointmentPdfGenerated = (
  id: string,
  data: { pdfStorageKey: string; pdfUrl: string },
) =>
  prisma.appointment.update({
    where: { id },
    data: {
      pdfStorageKey: data.pdfStorageKey,
      pdfUrl: data.pdfUrl,
      pdfGenerationStatus: PdfGenerationStatus.GENERATED,
      pdfGenerationError: null,
      pdfGeneratedAt: new Date(),
    },
  });

export const markAppointmentPdfFailed = (id: string, errorMessage: string) =>
  prisma.appointment.update({
    where: { id },
    data: {
      pdfGenerationStatus: PdfGenerationStatus.FAILED,
      pdfGenerationError: errorMessage,
    },
  });

export const findOpenExpiredAppointments = (now = new Date()) =>
  prisma.appointment.findMany({
    where: { status: AppointmentStatus.OPEN, coverageExpiresAt: { lt: now } },
  });

export const expireAppointment = (id: string) =>
  prisma.appointment.update({
    where: { id },
    data: {
      status: AppointmentStatus.EXPIRED,
      pdfStorageKey: null,
      pdfUrl: null,
      pdfGenerationStatus: PdfGenerationStatus.DELETED,
      pdfDeletedAt: new Date(),
    },
  });

export const findOpenAppointments = () =>
  prisma.appointment.findMany({
    where: { status: AppointmentStatus.OPEN },
    orderBy: { startTime: "asc" },
  });

export const findAppointmentsForCoordinator = (interpreterId?: string) =>
  prisma.appointment.findMany({
    where: interpreterId
      ? {
          OR: [
            { assignments: { some: { interpreterId } } },
            { requests: { some: { interpreterId } } },
            { offers: { some: { interpreterId, status: "PENDING" } } },
          ],
        }
      : undefined,
    include: {
      assignments: {
        include: { interpreter: true },
        orderBy: { createdAt: "desc" },
      },
      requests: {
        include: { interpreter: true },
        orderBy: { createdAt: "asc" },
      },
      offers: {
        where: { status: "PENDING" },
        include: { interpreter: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { requests: true } },
    },
    orderBy: { startTime: "desc" },
  });

export const findAppointmentById = (id: string) =>
  prisma.appointment.findUnique({ where: { id } });

export const findAssignmentRequestsByAppointmentId = (appointmentId: string) =>
  prisma.assignmentRequest.findMany({
    where: { appointmentId },
    include: { interpreter: true },
    orderBy: { createdAt: "asc" },
  });
