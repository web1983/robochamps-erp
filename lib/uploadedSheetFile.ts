import * as XLSX from 'xlsx';
import { supabaseAdmin } from '@/lib/supabase';
import type { UploadedCombinedSheet } from '@/lib/db';

const BUCKET = 'combined-sheets';

export function parseStoragePathFromUrl(fileUrl: string): string | null {
  const marker = '/combined-sheets/';
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(fileUrl.slice(idx + marker.length).split('?')[0]);
}

export function isExcelFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.xlsm');
}

export function canAccessUploadedSheet(
  role: string,
  userId: string,
  schoolId: string | undefined,
  sheet: UploadedCombinedSheet
): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
    return sheet.trainerId === userId;
  }
  if (role === 'TEACHER') {
    return !!schoolId && sheet.schoolId === schoolId.toString();
  }
  return false;
}

export async function fetchSheetRecord(id: string) {
  const { ObjectId } = await import('mongodb');
  const { getCollection } = await import('@/lib/db');
  if (!ObjectId.isValid(id)) return null;
  const uploadedSheets = await getCollection<UploadedCombinedSheet>('uploadedCombinedSheets');
  const sheet = await uploadedSheets.findOne({ _id: new ObjectId(id) as any });
  if (!sheet) return null;
  return { ...sheet, _id: sheet._id?.toString() };
}

export async function downloadSheetBuffer(fileUrl: string): Promise<Buffer> {
  if (!supabaseAdmin) {
    throw new Error('File storage is not configured');
  }
  const filePath = parseStoragePathFromUrl(fileUrl);
  if (!filePath) {
    throw new Error('Invalid file URL');
  }
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(filePath);
  if (error || !data) {
    throw new Error(error?.message || 'Failed to download file');
  }
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function bufferToXls(buffer: Buffer): Buffer {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return XLSX.write(workbook, { type: 'buffer', bookType: 'biff8' }) as Buffer;
}

export type SheetPreview = {
  sheetName: string;
  rows: (string | number | boolean | null)[][];
};

export function parseExcelPreview(buffer: Buffer): SheetPreview[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
      header: 1,
      defval: null,
      raw: false,
    });
    return { sheetName, rows };
  });
}

export function downloadFileNameAsXls(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '') || 'combined-sheet';
  return `${base}.xls`;
}
