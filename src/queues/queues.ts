import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";

export const pdfQueue = new Queue("pdf", { connection: redisConnection });
export const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
});
export const reminderQueue = new Queue("reminders", {
  connection: redisConnection,
});
export const expirationQueue = new Queue("expirations", {
  connection: redisConnection,
});
