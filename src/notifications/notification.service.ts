import { Resend } from "resend";
import {
  NotificationChannel,
  PlatformEventStatus,
  PlatformEventType,
} from "@prisma/client";
import { env } from "../config/env.js";
import { createPlatformEvent } from "../platform-events/platform-event.repository.js";
import smsProvider from "./providers/index.js";
import { createNotificationLog, updateNotificationLog } from "./notification.repository.js";

const resend = env.RESEND_API_KEY?.startsWith("re_")
  ? new Resend(env.RESEND_API_KEY)
  : null;

export const sendSms = async (data: {
  to: string;
  message: string;
  assignmentId?: string;
  appointmentId?: string;
}) => {
  const log = await createNotificationLog({
    channel: NotificationChannel.SMS,
    recipient: data.to,
    message: data.message,
    assignmentId: data.assignmentId,
    appointmentId: data.appointmentId,
  });

  try {
    console.info({
      provider: env.SMS_PROVIDER,
      phone: data.to,
      messagePreview: data.message.slice(0, 50),
    });

    const result = await smsProvider.send({
      to: data.to,
      message: data.message,
      metadata: {
        appointmentId: data.appointmentId,
        assignmentId: data.assignmentId,
      },
    });

    await updateNotificationLog(log.id, {
      status: "SENT",
      providerId: result.providerId,
    });
    await createPlatformEvent({
      type: PlatformEventType.SMS_SENT,
      status: PlatformEventStatus.COMPLETED,
      appointmentId: data.appointmentId,
      assignmentId: data.assignmentId,
      message: `SMS sent to ${data.to}`,
      metadata: { notificationLogId: log.id, providerId: result.providerId },
    });
    return result.providerId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await updateNotificationLog(log.id, { status: "FAILED", errorMessage });
    await createPlatformEvent({
      type: PlatformEventType.SMS_FAILED,
      status: PlatformEventStatus.FAILED,
      appointmentId: data.appointmentId,
      assignmentId: data.assignmentId,
      message: `SMS failed for ${data.to}`,
      errorMessage,
      metadata: { notificationLogId: log.id },
    });
    throw error;
  }
};

export const sendEmail = async (data: {
  to: string;
  subject: string;
  html: string;
  assignmentId?: string;
  appointmentId?: string;
}) => {
  const log = await createNotificationLog({
    channel: NotificationChannel.EMAIL,
    recipient: data.to,
    subject: data.subject,
    message: data.html,
    assignmentId: data.assignmentId,
    appointmentId: data.appointmentId,
  });
  try {
    if (!resend) throw new Error("Resend is not configured");
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: data.to,
      subject: data.subject,
      html: data.html,
    });
    await updateNotificationLog(log.id, { status: "SENT", providerId: result.data?.id });
    await createPlatformEvent({
      type: PlatformEventType.EMAIL_SENT,
      status: PlatformEventStatus.COMPLETED,
      appointmentId: data.appointmentId,
      assignmentId: data.assignmentId,
      message: `Email sent to ${data.to}`,
      metadata: { notificationLogId: log.id, providerId: result.data?.id },
    });
    return result.data?.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await updateNotificationLog(log.id, { status: "FAILED", errorMessage });
    await createPlatformEvent({
      type: PlatformEventType.EMAIL_FAILED,
      status: PlatformEventStatus.FAILED,
      appointmentId: data.appointmentId,
      assignmentId: data.assignmentId,
      message: `Email failed for ${data.to}`,
      errorMessage,
      metadata: { notificationLogId: log.id },
    });
    throw error;
  }
};
