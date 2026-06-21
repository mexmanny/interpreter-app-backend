import twilio from "twilio";
import { env } from "../../config/env.js";
import type { SmsProvider, SmsSendParams, SmsSendResult } from "./SmsProvider.js";

const twilioClient =
  env.TWILIO_ACCOUNT_SID?.startsWith("AC") && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;

export class TwilioProvider implements SmsProvider {
  async send(params: SmsSendParams): Promise<SmsSendResult> {
    if (!twilioClient || !env.TWILIO_PHONE_NUMBER) {
      throw new Error("Twilio is not configured");
    }

    const result = await twilioClient.messages.create({
      to: params.to,
      from: env.TWILIO_PHONE_NUMBER,
      body: params.message,
    });

    return { providerId: result.sid };
  }
}
