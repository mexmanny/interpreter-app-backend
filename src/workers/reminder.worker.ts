import { Worker } from "bullmq";
import {
  findAssignmentsDueForOneHourReminder,
  markReminderOneHourSent,
} from "../assignments/assignment.repository.js";
import { redisConnection } from "../lib/redis.js";
import { sendSms } from "../notifications/notification.service.js";
import { getOneHourReminderWindow } from "../reminders/reminder-window.js";
import { env } from "../config/env.js";

export const reminderWorker = new Worker(
  "reminders",
  async (job) => {
    if (job.name !== "send_one_hour_reminders") return;

    const { windowStart, windowEnd } = getOneHourReminderWindow();
    const assignments = await findAssignmentsDueForOneHourReminder(
      windowStart,
      windowEnd,
    );

    for (const assignment of assignments) {
      const link = `${env.WEB_APP_URL}/interpreter/assignments/${assignment.id}`;
      await sendSms({
        to: assignment.interpreter.phone,
        message: `Reminder: ${assignment.appointment.facilityName}, ${assignment.appointment.address}, ${assignment.appointment.startTime.toLocaleString()}. Check in: ${link}`,
        assignmentId: assignment.id,
        appointmentId: assignment.appointmentId,
      });
      await markReminderOneHourSent(assignment.id);
    }
  },
  { connection: redisConnection },
);
