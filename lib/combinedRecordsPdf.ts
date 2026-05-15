import jsPDF from 'jspdf';
import { format } from 'date-fns';

export type CombinedRecordForPdf = {
  date: string;
  trainerName: string;
  trainerEmail: string;
  schoolName: string;
  attendance?: {
    classLabel: string;
    photoUrl?: string;
    geo?: { lat: number; lng: number };
  } | null;
  reports: Array<{
    type: string;
    classLabel?: string;
    topics: string;
    summary: string;
    notes?: string;
  }>;
};

const MARGIN = 14;
const PAGE_BOTTOM = 285;
const CONTENT_WIDTH = 182;
const INNER_PAD = 5;
const LINE = 4.8;

function formatReportType(type: string): string {
  if (type === 'TEACHER_TRAINING') return 'School View Training';
  if (type === 'TRAINER_CLASS') return 'Trainer Class';
  return type.replace(/_/g, ' ');
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text || '—', maxWidth);
}

function drawLines(doc: jsPDF, lines: string[], x: number, y: number): number {
  const blockHeight = lines.length * LINE;
  doc.text(lines, x, y);
  return y + blockHeight;
}

function labelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number
): number {
  doc.setFont('helvetica', 'bold');
  const labelText = `${label}: `;
  doc.text(labelText, x, y);
  const labelW = doc.getTextWidth(labelText);
  doc.setFont('helvetica', 'normal');
  const valueLines = wrapText(doc, value, maxWidth - labelW);
  if (valueLines.length <= 1) {
    doc.text(valueLines[0] ?? '—', x + labelW, y);
    return y + LINE;
  }
  doc.text(valueLines[0], x + labelW, y);
  let ny = y + LINE;
  for (let i = 1; i < valueLines.length; i++) {
    doc.text(valueLines[i], x, ny);
    ny += LINE;
  }
  return ny;
}

/** Estimate card height for page breaks (conservative). */
function estimateCardHeight(record: CombinedRecordForPdf): number {
  let lines = 4;
  if (record.attendance) lines += 4;
  record.reports.forEach((r) => {
    lines += 5;
    lines += Math.ceil((r.topics?.length || 0) / 70);
    lines += Math.ceil((r.summary?.length || 0) / 70);
    if (r.notes) lines += Math.ceil(r.notes.length / 70);
  });
  return lines * LINE + INNER_PAD * 2 + 8;
}

function drawCardWithBackground(doc: jsPDF, record: CombinedRecordForPdf, y: number): number {
  const est = estimateCardHeight(record);
  if (y + est > PAGE_BOTTOM) {
    doc.addPage();
    y = MARGIN;
  }

  const cardTop = y;
  // Placeholder height — expand after content
  const x = MARGIN + INNER_PAD;
  const textW = CONTENT_WIDTH - INNER_PAD * 2;
  let cy = y + INNER_PAD + 2;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  cy = drawLines(doc, wrapText(doc, format(new Date(record.date), 'PPp'), textW), x, cy) + 2;

  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  cy = labelValue(doc, 'Trainer', `${record.trainerName} (${record.trainerEmail})`, x, cy, textW);
  cy = labelValue(doc, 'School', record.schoolName, x, cy, textW) + 2;

  if (record.attendance) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 120, 90);
    doc.text('Attendance', x, cy);
    cy += LINE;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    cy = labelValue(doc, 'Class', record.attendance.classLabel || '—', x, cy, textW);
    cy = labelValue(
      doc,
      'Photo',
      record.attendance.photoUrl ? 'Yes' : 'No',
      x,
      cy,
      textW
    );
    const loc = record.attendance.geo
      ? `${record.attendance.geo.lat.toFixed(5)}, ${record.attendance.geo.lng.toFixed(5)}`
      : 'N/A';
    cy = labelValue(doc, 'Location', loc, x, cy, textW) + 2;
  }

  if (record.reports.length > 0) {
    record.reports.forEach((report, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(record.reports.length > 1 ? `Report ${idx + 1}` : 'Report', x, cy);
      cy += LINE;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      cy = labelValue(doc, 'Type', formatReportType(report.type), x, cy, textW);
      if (report.classLabel) {
        cy = labelValue(doc, 'Class', report.classLabel, x, cy, textW);
      }
      cy = labelValue(doc, 'Topics', report.topics || '—', x, cy, textW);
      cy = labelValue(doc, 'Summary', report.summary || '—', x, cy, textW);
      if (report.notes) {
        cy = labelValue(doc, 'Notes', report.notes, x, cy, textW);
      }
      cy += 2;
    });
  } else if (!record.attendance) {
    doc.setFont('helvetica', 'italic');
    doc.text('No attendance or report for this session.', x, cy);
    cy += LINE;
    doc.setFont('helvetica', 'normal');
  }

  const cardBottom = cy + INNER_PAD;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, cardTop, CONTENT_WIDTH, cardBottom - cardTop, 2, 2, 'S');

  return cardBottom + 6;
}

export function downloadCombinedRecordsPdf(
  records: CombinedRecordForPdf[],
  options?: {
    title?: string;
    filename?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  if (records.length === 0) return;

  const doc = new jsPDF();
  let y = MARGIN;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(options?.title ?? 'Combined Attendance & Reports', MARGIN, y);
  y += 9;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${format(new Date(), 'PPP')}`, MARGIN, y);
  y += 6;

  if (options?.startDate || options?.endDate) {
    let range = 'Date range: ';
    if (options.startDate) range += format(new Date(options.startDate), 'PP');
    if (options.startDate && options.endDate) range += ' to ';
    if (options.endDate) range += format(new Date(options.endDate), 'PP');
    doc.text(range, MARGIN, y);
    y += 6;
  }

  doc.setTextColor(55, 65, 81);
  y += 4;

  records.forEach((record) => {
    const est = estimateCardHeight(record);
    if (y + est > PAGE_BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
    y = drawCardWithBackground(doc, record, y);
  });

  const filename =
    options?.filename ?? `combined-records-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
