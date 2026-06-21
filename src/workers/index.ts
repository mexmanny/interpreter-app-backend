import "./pdf.worker.js";
import "./expiration.worker.js";
import "./notification.worker.js";
import "./reminder.worker.js";
import { registerReminderSchedules } from "../reminders/register-reminder-schedules.js";

await registerReminderSchedules();

console.log("Workers started");
