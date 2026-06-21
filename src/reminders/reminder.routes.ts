import { FastifyInstance } from "fastify";
import { expirationQueue, reminderQueue } from "../queues/queues.js";
import { env } from "../config/env.js";

const assertJobAuth = (authorization?: string) => {
  if (authorization !== `Bearer ${env.JOB_SECRET}`) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
};

export async function reminderRoutes(app: FastifyInstance) {
  app.post("/jobs/expire-open-appointments", async (request, reply) => {
    assertJobAuth(request.headers.authorization);
    await expirationQueue.add("expire_open_appointments", {}, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
    return reply.code(202).send({ queued: true });
  });

  app.post("/jobs/send-one-hour-reminders", async (request, reply) => {
    assertJobAuth(request.headers.authorization);
    await reminderQueue.add("send_one_hour_reminders", {}, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
    return reply.code(202).send({ queued: true });
  });
}
