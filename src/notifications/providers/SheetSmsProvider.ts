import type { SmsProvider, SmsSendParams, SmsSendResult } from "./SmsProvider.js";
import { appendSmsRow, pollSheetSmsResult } from "./sheets.helper.js";

export class SheetSmsProvider implements SmsProvider {
  async send(params: SmsSendParams): Promise<SmsSendResult> {
    const appointmentId = String(
      params.metadata?.appointmentId ?? params.metadata?.assignmentId ?? "",
    );
    const scheduledAtRaw = params.metadata?.scheduledAt;
    const scheduledAt =
      scheduledAtRaw instanceof Date
        ? scheduledAtRaw
        : scheduledAtRaw
          ? new Date(String(scheduledAtRaw))
          : undefined;

    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      throw new Error("Invalid scheduledAt metadata for SheetSMS");
    }

    const { row, providerId } = await appendSmsRow({
      appointmentId,
      phone: params.to,
      message: params.message,
      scheduledAt,
    });

    const result = await pollSheetSmsResult(row);
    if (!result.success) {
      throw new Error(result.value || "SheetSMS failed to send message");
    }

    return { providerId };
  }
}
