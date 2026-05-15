'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type ExcelPreview = {
  kind: 'excel';
  fileName: string;
  trainerName: string;
  schoolName: string;
  month: string;
  sheets: { sheetName: string; rows: (string | number | boolean | null)[][] }[];
};

type FilePreview = {
  kind: 'file';
  fileName: string;
  fileUrl: string;
  mime: string;
};

export default function UploadedSheetViewPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const sheetId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ExcelPreview | FilePreview | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status !== 'authenticated' || !sheetId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/uploaded-sheets/${sheetId}/preview`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load sheet');
        setPreview(data);
        setActiveSheet(0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load sheet');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [status, sheetId, router]);

  if (status === 'loading' || loading) {
    return <p className="text-gray-500">Loading sheet...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error}</p>
        <Link href="/dashboard/uploaded-sheets" className="text-emerald-600 hover:underline font-medium">
          Back to uploaded sheets
        </Link>
      </div>
    );
  }

  if (!preview) return null;

  const isExcel = preview.kind === 'excel';
  const downloadHref = `/api/uploaded-sheets/${sheetId}/download`;
  const downloadName = isExcel
    ? preview.fileName.replace(/\.[^.]+$/, '.xls')
    : preview.fileName;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/uploaded-sheets"
            className="text-sm text-emerald-600 hover:underline font-medium mb-2 inline-block"
          >
            ← Back to uploaded sheets
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{preview.fileName}</h1>
          {isExcel && (
            <p className="text-sm text-gray-500 mt-1">
              {preview.trainerName} · {preview.schoolName} ·{' '}
              {new Date(preview.month + '-01').toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        <a
          href={downloadHref}
          download={downloadName}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shrink-0"
        >
          {isExcel ? 'Download XLS' : 'Download file'}
        </a>
      </div>

      {preview.kind === 'file' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {preview.mime === 'application/pdf' ? (
            <iframe
              src={preview.fileUrl}
              title={preview.fileName}
              className="w-full min-h-[70vh] border-0"
            />
          ) : (
            <div className="p-4 flex justify-center bg-gray-50">
              <img src={preview.fileUrl} alt={preview.fileName} className="max-w-full max-h-[70vh] object-contain" />
            </div>
          )}
        </div>
      )}

      {preview.kind === 'excel' && (
        <>
          {preview.sheets.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {preview.sheets.map((s, i) => (
                <button
                  key={s.sheetName}
                  type="button"
                  onClick={() => setActiveSheet(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSheet === i
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                  }`}
                >
                  {s.sheetName}
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto max-h-[75vh]">
            <table className="min-w-full text-sm border-collapse">
              <tbody>
                {(preview.sheets[activeSheet]?.rows ?? []).map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx === 0 ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50/80'}>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="border border-gray-200 px-3 py-2 text-gray-900 whitespace-nowrap max-w-xs truncate"
                        title={cell != null ? String(cell) : ''}
                      >
                        {cell != null && cell !== '' ? String(cell) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
