-- CreateEnum
CREATE TYPE "PdfGenerationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'GENERATED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "PlatformEventType" AS ENUM ('PDF_GENERATION_QUEUED', 'PDF_GENERATION_STARTED', 'PDF_GENERATION_SUCCEEDED', 'PDF_GENERATION_FAILED', 'PDF_DELETED', 'APPOINTMENT_EXPIRED', 'SMS_SENT', 'SMS_FAILED', 'EMAIL_SENT', 'EMAIL_FAILED');

-- CreateEnum
CREATE TYPE "PlatformEventStatus" AS ENUM ('COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "pdfDeletedAt" TIMESTAMP(3),
ADD COLUMN     "pdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "pdfGenerationError" TEXT,
ADD COLUMN     "pdfGenerationStatus" "PdfGenerationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "PlatformEvent" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "assignmentId" TEXT,
    "type" "PlatformEventType" NOT NULL,
    "status" "PlatformEventStatus" NOT NULL,
    "message" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformEvent_appointmentId_createdAt_idx" ON "PlatformEvent"("appointmentId", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformEvent_assignmentId_createdAt_idx" ON "PlatformEvent"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformEvent_type_status_idx" ON "PlatformEvent"("type", "status");

-- AddForeignKey
ALTER TABLE "PlatformEvent" ADD CONSTRAINT "PlatformEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformEvent" ADD CONSTRAINT "PlatformEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
