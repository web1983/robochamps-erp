import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import {
  bufferToXls,
  canAccessUploadedSheet,
  downloadFileNameAsXls,
  downloadSheetBuffer,
  fetchSheetRecord,
  isExcelFileName,
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

    const buffer = await downloadSheetBuffer(sheet.fileUrl);

    if (isExcelFileName(sheet.fileName)) {
      const xlsBuffer = sheet.fileName.toLowerCase().endsWith('.xls')
        ? buffer
        : bufferToXls(buffer);
      const fileName = downloadFileNameAsXls(sheet.fileName);
      return new NextResponse(new Uint8Array(xlsBuffer), {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Cache-Control': 'private, no-cache',
        },
      });
    }

    const ext = sheet.fileName.split('.').pop() || 'bin';
    const mime =
      ext === 'pdf'
        ? 'application/pdf'
        : ext === 'png'
          ? 'image/png'
          : ext === 'jpg' || ext === 'jpeg'
            ? 'image/jpeg'
            : 'application/octet-stream';

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(sheet.fileName)}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('Download uploaded sheet error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download file' },
      { status: 500 }
    );
  }
}
