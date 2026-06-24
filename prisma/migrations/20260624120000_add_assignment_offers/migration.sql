-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'OFFERED';

-- CreateEnum
CREATE TYPE "AssignmentOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "AssignmentOffer" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "interpreterId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "AssignmentOfferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "AssignmentOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentOffer_token_key" ON "AssignmentOffer"("token");

-- CreateIndex
CREATE INDEX "AssignmentOffer_appointmentId_status_idx" ON "AssignmentOffer"("appointmentId", "status");

-- AddForeignKey
ALTER TABLE "AssignmentOffer" ADD CONSTRAINT "AssignmentOffer_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentOffer" ADD CONSTRAINT "AssignmentOffer_interpreterId_fkey" FOREIGN KEY ("interpreterId") REFERENCES "Interpreter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
