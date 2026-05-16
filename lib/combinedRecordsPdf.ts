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

const MARGIN = 12;
const PAGE_BOTTOM = 282;
const CARD_W = 186;
const PAD = 6;
const LINE_SM = 4.2;
const LINE_MD = 5;
const GAP = 3;

function formatReportType(type: string): string {
  if (type === 'TEACHER_TRAINING') return 'School View Training';
  if (type === 'TRAINER_CLASS') return 'Trainer Class';
  return type.replace(/_/g, ' ');
}

function lineCount(doc: jsPDF, text: string, maxWidth: number): number {
  return doc.splitTextToSize(text || '—', maxWidth).length;
}

function blockHeight(doc: jsPDF, value: string, maxWidth: number, hasLabel = true): number {
  let h = hasLabel ? LINE_SM : 0;
  h += lineCount(doc, value, maxWidth) * LINE_MD;
  return h + GAP;
}

function sectionHeight(): number {
  return LINE_SM + 4;
}

function formatImageUrlLine(photoUrl?: string): string {
  const url = photoUrl?.trim();
  return url ? `Image URL: ${url}` : 'Image URL: —';
}

function measureCard(doc: jsPDF, record: CombinedRecordForPdf): number {
  const textW = CARD_W - PAD * 2;
  doc.setFontSize(9);

  let h = PAD * 2 + 12;
  h += lineCount(doc, format(new Date(record.date), 'PPp'), textW) * LINE_MD + 4;
  h += blockHeight(doc, `${record.trainerName}\n${record.trainerEmail}`, textW);
  h += blockHeight(doc, record.schoolName, textW);

  if (record.attendance) {
    h += sectionHeight();
    h += blockHeight(doc, `Class: ${record.attendance.classLabel || '—'}`, textW, false);
    h += blockHeight(doc, formatImageUrlLine(record.attendance.photoUrl), textW, false);
    const loc = record.attendance.geo
      ? `${record.attendance.geo.lat.toFixed(5)}, ${record.attendance.geo.lng.toFixed(5)}`
      : 'N/A';
    h += blockHeight(doc, `Location: ${loc}`, textW, false);
  }

  if (record.reports.length > 0) {
    record.reports.forEach((report, idx) => {
      const title = record.reports.length > 1 ? `Report ${idx + 1}` : 'Report';
      h += sectionHeight();
      h += blockHeight(doc, `Type: ${formatReportType(report.type)}`, textW, false);
      if (report.classLabel) {
        h += blockHeight(doc, `Class: ${report.classLabel}`, textW, false);
      }
      h += blockHeight(doc, `Topics: ${report.topics || '—'}`, textW, false);
      h += blockHeight(doc, `Summary: ${report.summary || '—'}`, textW, false);
      if (report.notes) {
        h += blockHeight(doc, `Notes: ${report.notes}`, textW, false);
      }
    });
  } else if (!record.attendance) {
    h += blockHeight(doc, 'No attendance or report logged for this session.', textW, false);
  }

  return h + PAD;
}

function drawBlock(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  showLabel = true
): number {
  let cy = y;
  if (showLabel) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x, cy);
    cy += LINE_SM;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const lines = doc.splitTextToSize(value || '—', maxWidth);
  doc.text(lines, x, cy);
  cy += lines.length * LINE_MD;
  return cy + GAP;
}

function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text(title.toUpperCase(), x, y);
  return y + LINE_SM + 3;
}

function drawCardContent(
  doc: jsPDF,
  record: CombinedRecordForPdf,
  x: number,
  y: number,
  maxWidth: number
): number {
  let cy = y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const dateLines = doc.splitTextToSize(format(new Date(record.date), 'PPp'), maxWidth);
  doc.text(dateLines, x, cy);
  cy += dateLines.length * LINE_MD + 4;

  cy = drawBlock(doc, 'Trainer', `${record.trainerName}\n${record.trainerEmail}`, x, cy, maxWidth);
  cy = drawBlock(doc, 'School', record.schoolName, x, cy, maxWidth);

  if (record.attendance) {
    cy = drawSectionTitle(doc, 'Attendance', x, cy);
    cy = drawBlock(
      doc,
      '',
      `Class: ${record.attendance.classLabel || '—'}`,
      x,
      cy,
      maxWidth,
      false
    );
    cy = drawBlock(doc, '', formatImageUrlLine(record.attendance.photoUrl), x, cy, maxWidth, false);
    const loc = record.attendance.geo
      ? `${record.attendance.geo.lat.toFixed(5)}, ${record.attendance.geo.lng.toFixed(5)}`
      : 'N/A';
    cy = drawBlock(doc, '', `Location: ${loc}`, x, cy, maxWidth, false);
  }

  if (record.reports.length > 0) {
    record.reports.forEach((report, idx) => {
      const title = record.reports.length > 1 ? `Report ${idx + 1}` : 'Report';
      cy = drawSectionTitle(doc, title, x, cy);
      cy = drawBlock(
        doc,
        '',
        `Type: ${formatReportType(report.type)}`,
        x,
        cy,
        maxWidth,
        false
      );
      if (report.classLabel) {
        cy = drawBlock(doc, '', `Class: ${report.classLabel}`, x, cy, maxWidth, false);
      }
      cy = drawBlock(doc, '', `Topics: ${report.topics || '—'}`, x, cy, maxWidth, false);
      cy = drawBlock(doc, '', `Summary: ${report.summary || '—'}`, x, cy, maxWidth, false);
      if (report.notes) {
        cy = drawBlock(doc, '', `Notes: ${report.notes}`, x, cy, maxWidth, false);
      }
    });
  } else if (!record.attendance) {
    cy = drawBlock(
      doc,
      '',
      'No attendance or report logged for this session.',
      x,
      cy,
      maxWidth,
      false
    );
  }

  return cy;
}

function drawCard(doc: jsPDF, record: CombinedRecordForPdf, index: number, y: number): number {
  const cardH = measureCard(doc, record);
  if (y + cardH > PAGE_BOTTOM) {
    doc.addPage();
    y = MARGIN;
  }

  const cardTop = y;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, cardTop, CARD_W, cardH, 3, 3, 'FD');

  const textX = MARGIN + PAD;
  const textY = cardTop + PAD;
  const textW = CARD_W - PAD * 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Session ${index + 1}`, textX, textY);

  drawCardContent(doc, record, textX, textY + 5, textW);

  return cardTop + cardH + 10;
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

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(options?.title ?? 'Combined Attendance & Reports', MARGIN, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${format(new Date(), 'PPP')}`, MARGIN, y);
  y += 5;
  doc.text('Each session is shown in its own card below (not a table row).', MARGIN, y);
  y += 5;

  if (options?.startDate || options?.endDate) {
    let range = 'Date range: ';
    if (options.startDate) range += format(new Date(options.startDate), 'PP');
    if (options.startDate && options.endDate) range += ' to ';
    if (options.endDate) range += format(new Date(options.endDate), 'PP');
    doc.text(range, MARGIN, y);
    y += 5;
  }

  y += 4;

  records.forEach((record, index) => {
    y = drawCard(doc, record, index, y);
  });

  const stamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const filename =
    options?.filename?.replace('.pdf', `-cards-${stamp}.pdf`) ??
    `combined-attendance-cards-${stamp}.pdf`;
  doc.save(filename);
}
