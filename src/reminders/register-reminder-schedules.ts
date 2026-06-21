import { reminderQueue } from "../queues/queues.js";
import { env } from "../config/env.js";

export const registerReminderSchedules = async () => {
  await reminderQueue.upsertJobScheduler(
    "send-one-hour-reminders",
    { every: env.REMINDER_REPEAT_EVERY_MINUTES * 60_000 },
    {
      name: "send_one_hour_reminders",
      data: {},
      opts: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    },
  );
};
