import { env } from "../config/env.js";

export const getOneHourReminderWindow = (now = new Date()) => {
  const offsetMs = env.REMINDER_ONE_HOUR_MINUTES * 60_000;
  const halfWindowMs = (env.REMINDER_ONE_HOUR_WINDOW_MINUTES * 60_000) / 2;

  return {
    windowStart: new Date(now.getTime() + offsetMs - halfWindowMs),
    windowEnd: new Date(now.getTime() + offsetMs + halfWindowMs),
  };
};
