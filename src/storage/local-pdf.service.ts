import { access, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { env } from "../config/env.js";

const appointmentPdfPath = (appointmentId: string) =>
  path.join(env.LOCAL_PDF_DIR, "appointments", `${appointmentId}.pdf`);

export const saveLocalPdf = async (appointmentId: string, body: Buffer) => {
  const filePath = appointmentPdfPath(appointmentId);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
  return filePath;
};

export const readLocalPdf = async (appointmentId: string): Promise<Buffer | null> => {
  const filePath = appointmentPdfPath(appointmentId);
  try {
    await access(filePath);
    return readFile(filePath);
  } catch {
    return null;
  }
};

export const localPdfFilename = (appointmentId: string) =>
  `appointment-${appointmentId}.pdf`;
