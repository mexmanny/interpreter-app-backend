import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { env } from "./config/env.js";
import { appointmentRoutes } from "./appointments/appointment.routes.js";
import { assignmentRoutes } from "./assignments/assignment.routes.js";
import { healthRoutes } from "./health/health.routes.js";
import { interpreterRoutes } from "./interpreters/interpreter.routes.js";
import { reminderRoutes } from "./reminders/reminder.routes.js";
import { resolveHttpError } from "./lib/http-error.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true, credentials: true });
await app.register(sensible);
await app.register(healthRoutes, { prefix: "/api" });
await app.register(appointmentRoutes, { prefix: "/api" });
await app.register(interpreterRoutes, { prefix: "/api" });
await app.register(assignmentRoutes, { prefix: "/api" });
await app.register(reminderRoutes, { prefix: "/api" });

app.setErrorHandler((error, _request, reply) => {
  const { statusCode, message } = resolveHttpError(error);
  app.log.error(error);
  reply.code(statusCode).send({ message, statusCode });
});

await app.listen({ port: env.PORT, host: "0.0.0.0" });
