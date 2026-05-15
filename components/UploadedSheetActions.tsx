'use client';

import Link from 'next/link';

function isExcelFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.xlsm');
}

type Props = {
  sheetId: string;
  fileName: string;
  className?: string;
};

export default function UploadedSheetActions({ sheetId, fileName, className = '' }: Props) {
  const excel = isExcelFileName(fileName);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Link
        href={`/dashboard/uploaded-sheets/${sheetId}`}
        className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        View
      </Link>
      <a
        href={`/api/uploaded-sheets/${sheetId}/download`}
        className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
        download={excel ? fileName.replace(/\.[^.]+$/, '.xls') : fileName}
      >
        {excel ? 'Download XLS' : 'Download'}
      </a>
    </div>
  );
}
