import type { ConnectionOptions } from "bullmq";
import { env } from "../config/env.js";

export const redisConnection: ConnectionOptions = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
};
