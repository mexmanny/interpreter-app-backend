import { google } from "googleapis";
import { env } from "../../config/env.js";
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from "../../utils/datetime.js";

export const SHEETSMS_SUCCESS_MESSAGE = "Message has been sent!";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getSheetsClient = () => {
  if (
    !env.GOOGLE_SHEET_ID ||
    !env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    !env.GOOGLE_PRIVATE_KEY
  ) {
    throw new Error("Google Sheets is not configured");
  }

  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
};

const formatSheetDate = (date: Date) => formatAppointmentDate(date);

const formatSheetTime = (date: Date) => formatAppointmentTime(date);

export const buildSmsFormula = (row: number, scheduled: boolean) => {
  // TODO(sheetsms): Enable when custom_sender is approved.
  // if (env.SHEETSMS_CUSTOM_SENDER) {
  //   return `=SENDSMSWITHSENDER(C${row}, B${row}, "${env.SHEETSMS_CUSTOM_SENDER}")`;
  // }

  if (scheduled) {
    return `=SCHEDULESMS(C${row}, B${row}, D${row}, E${row})`;
  }

  return `=SENDSMS(C${row}, B${row})`;
};

export const isSheetSmsSuccess = (value: string) =>
  value.trim() === SHEETSMS_SUCCESS_MESSAGE;

const getNextRow = async (sheets: ReturnType<typeof getSheetsClient>, tab: string) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEET_ID!,
    range: `${tab}!A:G`,
  });

  return (response.data.values?.length ?? 0) + 1;
};

const readRowCells = async (
  sheets: ReturnType<typeof getSheetsClient>,
  tab: string,
  row: number,
) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEET_ID!,
    range: `${tab}!A${row}:C${row}`,
  });

  const [appointmentId = "", phone = "", message = ""] = response.data.values?.[0] ?? [];
  return { appointmentId: String(appointmentId), phone: String(phone), message: String(message) };
};

const readFormulaCell = async (
  sheets: ReturnType<typeof getSheetsClient>,
  tab: string,
  row: number,
) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEET_ID!,
    range: `${tab}!F${row}`,
  });

  return response.data.values?.[0]?.[0]?.toString() ?? "";
};

export type AppendSmsRowInput = {
  appointmentId: string;
  phone: string;
  message: string;
  scheduledAt?: Date;
};

export type AppendSmsRowResult = {
  row: number;
  providerId: string;
  formula: string;
};

export const appendSmsRow = async (input: AppendSmsRowInput): Promise<AppendSmsRowResult> => {
  if (!input.phone.trim() || !input.message.trim()) {
    throw new Error("SheetSMS requires non-empty phone and message");
  }

  const sheets = getSheetsClient();
  const tab = env.GOOGLE_SHEET_TAB;
  const scheduled = Boolean(input.scheduledAt);
  const sendDate = input.scheduledAt ? formatSheetDate(input.scheduledAt) : "";
  const sendTime = input.scheduledAt ? formatSheetTime(input.scheduledAt) : "";
  const status = scheduled ? "scheduled" : "queued";
  const row = await getNextRow(sheets, tab);
  const formula = buildSmsFormula(row, scheduled);

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: env.GOOGLE_SHEET_ID!,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: `${tab}!A${row}:E${row}`,
          values: [[
            input.appointmentId,
            input.phone,
            input.message,
            sendDate,
            sendTime,
          ]],
        },
        {
          range: `${tab}!F${row}`,
          values: [[formula]],
        },
        {
          range: `${tab}!G${row}`,
          values: [[status]],
        },
      ],
    },
  });

  const written = await readRowCells(sheets, tab, row);
  if (!written.phone.trim() || !written.message.trim()) {
    throw new Error(
      `SheetSMS row ${row} was not written correctly (phone/message empty after update)`,
    );
  }

  return {
    row,
    formula,
    providerId: `sheet:${tab}!F${row}`,
  };
};

export const pollSheetSmsResult = async (
  row: number,
  attempts = 3,
  delayMs = 2000,
) => {
  const sheets = getSheetsClient();
  const tab = env.GOOGLE_SHEET_TAB;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await sleep(delayMs);
    const value = await readFormulaCell(sheets, tab, row);

    if (isSheetSmsSuccess(value)) {
      return { success: true as const, value };
    }

    if (value && !value.startsWith("=")) {
      return { success: false as const, value };
    }

    if (attempt === attempts) {
      throw new Error(
        value
          ? `SheetSMS result timeout with last value: ${value}`
          : "SheetSMS result timeout",
      );
    }
  }

  throw new Error("SheetSMS result timeout");
};
