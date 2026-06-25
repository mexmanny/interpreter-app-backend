import { env } from "../config/env.js";

const WALL_CLOCK_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Parse YYYY-MM-DDTHH:mm as wall-clock time in APP_TIMEZONE and return UTC. */
export const wallClockToUtc = (
  localDateTime: string,
  timeZone = env.APP_TIMEZONE,
): Date => {
  const match = WALL_CLOCK_PATTERN.exec(localDateTime);
  if (!match) {
    throw Object.assign(new Error(`Invalid appointment datetime: ${localDateTime}`), {
      statusCode: 400,
    });
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const matchesWallClock = (ms: number) => {
    const parts = formatter.formatToParts(new Date(ms));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value ?? NaN);

    const formattedHour = get("hour");
    return (
      get("year") === year &&
      get("month") === month &&
      get("day") === day &&
      (formattedHour === hour || (formattedHour === 0 && hour === 24)) &&
      get("minute") === minute
    );
  };

  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  for (let offsetHours = -14; offsetHours <= 14; offsetHours++) {
    const candidate = naiveUtc + offsetHours * 3600_000;
    if (matchesWallClock(candidate)) {
      return new Date(candidate);
    }
  }

  throw Object.assign(
    new Error(`Could not convert ${localDateTime} from ${timeZone} to UTC`),
    { statusCode: 400 },
  );
};

export const formatAppointmentDateTime = (
  date: Date,
  timeZone = env.APP_TIMEZONE,
) => {
  const datePart = date.toLocaleDateString("en-US", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} - ${timePart}`;
};

export const formatAppointmentDate = (date: Date, timeZone = env.APP_TIMEZONE) =>
  date.toLocaleDateString("en-US", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

export const formatAppointmentTime = (date: Date, timeZone = env.APP_TIMEZONE) =>
  date.toLocaleTimeString("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
