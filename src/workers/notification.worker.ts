import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { buildAssignmentConfirmedMessage } from "../notifications/assignment-confirmed.message.js";
import { sendEmail, sendSms } from "../notifications/notification.service.js";
import { prisma } from "../lib/prisma.js";

export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    if (job.name === "assignment_confirmed") {
      const { assignmentId } = job.data as { assignmentId: string };
      const assignment = await prisma.assignment.findUniqueOrThrow({
        where: { id: assignmentId },
        include: { appointment: true, interpreter: true },
      });
      const message = buildAssignmentConfirmedMessage(
        assignment.appointment,
        assignment.id,
      );
      await sendSms({
        to: assignment.interpreter.phone,
        message,
        assignmentId,
        appointmentId: assignment.appointmentId,
      });
      if (assignment.interpreter.email) {
        await sendEmail({
          to: assignment.interpreter.email,
          subject: "Session Assigned",
          html: `<pre>${message}</pre>`,
          assignmentId,
          appointmentId: assignment.appointmentId,
        });
      }
    }

    if (job.name === "assignment_event") {
      const { assignmentId, eventType } = job.data as {
        assignmentId: string;
        eventType: string;
      };
      // Coordinator routing can be added once coordinator contact preferences are defined.
      console.log(`Assignment event recorded`, { assignmentId, eventType });
    }
  },
  { connection: redisConnection },
);
