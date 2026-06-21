import { Appointment } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const buildAppointmentPdf = async (appointment: Appointment): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text: string, x: number, y: number, size = 11, bold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? boldFont : font,
      color: rgb(0.08, 0.13, 0.22)
    });
  };

  page.drawRectangle({ x: 40, y: 724, width: 532, height: 36, color: rgb(0.86, 0.91, 0.96) });
  drawText("Interpreter Appointment", 56, 738, 16, true);

  const rows: Array<[string, string]> = [
    ["Date", appointment.date.toLocaleDateString("en-US")],
    ["Patient Name", appointment.patientName],
    ["Client / Medical Office", appointment.clientName],
    ["Facility Name", appointment.facilityName],
    ["Address", appointment.address],
    ["Appointment Time", appointment.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })],
    ["Duration", `${appointment.durationMinutes} minutes`],
    ["Pay Amount", `$${(appointment.payAmountCents / 100).toFixed(2)}`],
    ["Contact Number", appointment.contactNumber ?? ""]
  ];

  let y = 690;
  for (const [label, value] of rows) {
    drawText(label, 56, y, 10, true);
    drawText(value || "—", 220, y, 10);
    page.drawLine({ start: { x: 56, y: y - 8 }, end: { x: 556, y: y - 8 }, thickness: 0.5, color: rgb(0.82, 0.86, 0.91) });
    y -= 32;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
};
