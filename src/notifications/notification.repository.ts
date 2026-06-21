import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const createNotificationLog = (data: {
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  message: string;
  appointmentId?: string;
  assignmentId?: string;
}) => prisma.notificationLog.create({ data });

export const updateNotificationLog = (
  id: string,
  data: {
    status: NotificationStatus;
    providerId?: string;
    errorMessage?: string;
  },
) => prisma.notificationLog.update({ where: { id }, data });
