-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COORDINATOR', 'INTERPRETER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('OPEN', 'EXPIRED', 'ASSIGNED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'PATIENT_NO_SHOW', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssignmentEventType" AS ENUM ('REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'PATIENT_NO_SHOW', 'RUNNING_LATE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('STANDARD', 'SAME_DAY', 'URGENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interpreter" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "transportEligible" BOOLEAN NOT NULL DEFAULT false,
    "coverageAreas" TEXT[],
    "languages" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interpreter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "patientName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactNumber" TEXT,
    "payAmountCents" INTEGER NOT NULL,
    "languageNeeded" TEXT NOT NULL,
    "coverageArea" TEXT NOT NULL,
    "transportRequired" BOOLEAN NOT NULL DEFAULT false,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'STANDARD',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'OPEN',
    "coverageExpiresAt" TIMESTAMP(3) NOT NULL,
    "pdfStorageKey" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentRequest" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "interpreterId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "interpreterId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confirmedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "actualDuration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentEvent" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "type" "AssignmentEventType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "providerId" TEXT,
    "errorMessage" TEXT,
    "assignmentId" TEXT,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Interpreter_userId_key" ON "Interpreter"("userId");

-- CreateIndex
CREATE INDEX "Appointment_status_coverageExpiresAt_idx" ON "Appointment"("status", "coverageExpiresAt");

-- CreateIndex
CREATE INDEX "Appointment_languageNeeded_coverageArea_status_idx" ON "Appointment"("languageNeeded", "coverageArea", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentRequest_appointmentId_interpreterId_key" ON "AssignmentRequest"("appointmentId", "interpreterId");

-- CreateIndex
CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");

-- CreateIndex
CREATE INDEX "Assignment_interpreterId_createdAt_idx" ON "Assignment"("interpreterId", "createdAt");

-- CreateIndex
CREATE INDEX "AssignmentEvent_assignmentId_createdAt_idx" ON "AssignmentEvent"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_status_createdAt_idx" ON "NotificationLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_assignmentId_idx" ON "NotificationLog"("assignmentId");

-- CreateIndex
CREATE INDEX "NotificationLog_appointmentId_idx" ON "NotificationLog"("appointmentId");

-- AddForeignKey
ALTER TABLE "Interpreter" ADD CONSTRAINT "Interpreter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRequest" ADD CONSTRAINT "AssignmentRequest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRequest" ADD CONSTRAINT "AssignmentRequest_interpreterId_fkey" FOREIGN KEY ("interpreterId") REFERENCES "Interpreter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_interpreterId_fkey" FOREIGN KEY ("interpreterId") REFERENCES "Interpreter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentEvent" ADD CONSTRAINT "AssignmentEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
