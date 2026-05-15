import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import {
  canAccessUploadedSheet,
  downloadSheetBuffer,
  fetchSheetRecord,
  isExcelFileName,
  parseExcelPreview,
} from '@/lib/uploadedSheetFile';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as { id?: string }).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const role = (session.user as { role: string }).role;
    const schoolId = (session.user as { schoolId?: string }).schoolId;

    const sheet = await fetchSheetRecord(params.id);
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    if (!canAccessUploadedSheet(role, userId, schoolId, sheet)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isExcelFileName(sheet.fileName)) {
      return NextResponse.json({
        kind: 'file',
        fileName: sheet.fileName,
        fileUrl: sheet.fileUrl,
        mime: sheet.fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image',
      });
    }

    const buffer = await downloadSheetBuffer(sheet.fileUrl);
    const sheets = parseExcelPreview(buffer);

    return NextResponse.json({
      kind: 'excel',
      fileName: sheet.fileName,
      trainerName: sheet.trainerName,
      schoolName: sheet.schoolName,
      month: sheet.month,
      sheets,
    });
  } catch (error) {
    console.error('Preview uploaded sheet error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load preview' },
      { status: 500 }
    );
  }
}
