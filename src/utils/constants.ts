export const ASSIGNMENT_EVENTS = [
  "REQUESTED",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "PATIENT_NO_SHOW",
  "RUNNING_LATE",
  "CANCELLED",
  "COMPLETED",
] as const;

export type AssignmentEventType = (typeof ASSIGNMENT_EVENTS)[number];

export const URGENCY_RESPONSE_WINDOWS_MINUTES = {
  STANDARD: 24 * 60,
  SAME_DAY: 60,
  URGENT: 30,
} as const;
