import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JOB_SECRET: z.string().min(16),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Interpreter Platform <notifications@example.com>"),
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default("interpreter-platform-pdfs"),
  R2_PUBLIC_BASE_URL: z.string().optional(),
  WEB_APP_URL: z.string().default("http://localhost:3000"),
  LOCAL_PDF_DIR: z.string().default("./local-pdfs"),
  SMS_PROVIDER: z.enum(["twilio", "sheetsms"]).default("sheetsms"),
  GOOGLE_SHEET_ID: z.string().optional(),
  GOOGLE_SHEET_TAB: z.string().default("Sheet1"),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  // TODO(sheetsms): Enable SENDSMSWITHSENDER when custom_sender is approved.
  SHEETSMS_CUSTOM_SENDER: z.string().optional(),
  REMINDER_ONE_HOUR_MINUTES: z.coerce.number().int().positive().default(60),
  REMINDER_ONE_HOUR_WINDOW_MINUTES: z.coerce.number().int().positive().default(10),
  REMINDER_REPEAT_EVERY_MINUTES: z.coerce.number().int().positive().default(5),
  APP_TIMEZONE: z.string().default("America/New_York"),
});

export const env = envSchema.parse(process.env);
