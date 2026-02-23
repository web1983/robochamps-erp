'use client';

import { useState, useEffect, Suspense } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import { format } from 'date-fns';

interface CombinedRecord {
  date: string;
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  schoolId: string;
  schoolName: string;
  attendance?: {
    _id: string;
    classLabel: string;
    datetime: string;
    photoUrl: string;
    geo?: {
      lat: number;
      lng: number;
      accuracy?: number;
    };
  } | null;
  reports: Array<{
    _id: string;
    type: string;
    classLabel?: string;
    topics: string;
    summary: string;
    notes?: string;
    datetime: string;
  }>;
}

interface UploadedSheet {
  _id: string;
  month: string;
  year: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

function TrainerCombinedSheetContent() {
  const [records, setRecords] = useState<CombinedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedSheets, setUploadedSheets] = useState<UploadedSheet[]>([]);
  const [uploadFormData, setUploadFormData] = useState({
    file: null as File | null,
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  });

  useEffect(() => {
    fetchRecords();
    fetchUploadedSheets();
  }, [startDate, endDate]);

  const fetchUploadedSheets = async () => {
    try {
      const response = await fetch('/api/uploaded-sheets');
      const data = await response.json();
      if (response.ok) {
        setUploadedSheets(data.sheets || []);
      }
    } catch (err) {
      console.error('Failed to fetch uploaded sheets:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFormData({ ...uploadFormData, file });
      setUploadError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess(false);

    if (!uploadFormData.file) {
      setUploadError('Please select a file');
      return;
    }

    if (!uploadFormData.month) {
      setUploadError('Please select a month');
      return;
    }

    setUploading(true);

    try {
      // Extract year from month (YYYY-MM format)
      const [year, month] = uploadFormData.month.split('-');
      
      const formData = new FormData();
      formData.append('file', uploadFormData.file);
      formData.append('month', uploadFormData.month);
      formData.append('year', year);

      const response = await fetch('/api/uploaded-sheets', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload sheet');
      }

      setUploadSuccess(true);
      setUploadFormData({ 
        file: null, 
        month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      });
      setShowUploadForm(false);
      fetchUploadedSheets();

      // Reset success message after 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload sheet');
    } finally {
      setUploading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let url = '/api/combined-records';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      // API automatically filters by trainerId for trainers
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch records');
      }

      setRecords(data.records || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const escapeCSV = (str: string): string => {
    if (!str) return '';
    const escaped = str.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  const generateCSV = () => {
    if (records.length === 0) {
      alert('No records to export');
      return;
    }

    const headers = [
      'Date & Time',
      'School',
      'Attendance Class',
      'Attendance Image',
      'Report Topics',
      'Report Summary',
      'Report Notes',
    ];

    const rows = records.flatMap((record) => {
      const dateTime = format(new Date(record.date), 'PPp');
      const school = record.schoolName;
      const attendance = record.attendance?.classLabel || '';
      const imageUrl = record.attendance?.photoUrl || '';

      if (record.reports.length > 0) {
        return record.reports.map((report) => [
          dateTime,
          school,
          attendance,
          imageUrl,
          escapeCSV(report.topics || ''),
          escapeCSV(report.summary || ''),
          escapeCSV(report.notes || ''),
        ]);
      } else {
        return [[dateTime, school, attendance, imageUrl, '', '', '']];
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `combined-sheet-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateExcel = () => {
    // For Excel, we'll generate CSV with .xls extension (works in Excel)
    generateCSV();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <DashboardHeader showBackButton backHref="/trainer/dashboard" role="TRAINER_SCHOOL" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <DashboardHeader showBackButton backHref="/trainer/dashboard" role="TRAINER_SCHOOL" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Combined Sheet</h1>
            <p className="text-gray-500 mt-1">View your attendance and reports together</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              {showUploadForm ? 'Cancel Upload' : '📤 Upload Signed Sheet'}
            </button>
            <button
              onClick={generateCSV}
              disabled={records.length === 0}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📊 Download CSV
            </button>
            <button
              onClick={generateExcel}
              disabled={records.length === 0}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📈 Download Excel
            </button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            ✅ Sheet uploaded successfully!
          </div>
        )}

        {showUploadForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Signed & Stamped Combined Sheet</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Month & Year *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="month"
                      required
                      value={uploadFormData.month}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, month: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select the month and year for this combined sheet
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File (PDF, Excel, or Image) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: 10MB. Upload your signed and stamped combined sheet.
                </p>
              </div>
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {uploadError}
                </div>
              )}
              <button
                type="submit"
                disabled={uploading}
                className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Sheet'}
              </button>
            </form>
          </div>
        )}

        {uploadedSheets.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Sheets</h2>
            <div className="space-y-3">
              {uploadedSheets.map((sheet) => (
                <div
                  key={sheet._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(sheet.month + '-01').toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {sheet.fileName} • {format(new Date(sheet.uploadedAt), 'PPp')}
                    </p>
                  </div>
                  <a
                    href={sheet.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold text-sm"
                  >
                    View / Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white"
              />
            </div>
          </div>
          <div>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {records.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-100">
            <p className="text-gray-500">No records found for the selected period.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Topics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.flatMap((record, idx) => {
                    const dateTime = format(new Date(record.date), 'PPp');
                    const school = record.schoolName;
                    const attendance = record.attendance?.classLabel || '';
                    const imageUrl = record.attendance?.photoUrl;

                    if (record.reports.length > 0) {
                      return record.reports.map((report, rIdx) => (
                        <tr key={`${record.date}_${record.trainerId}_${record.schoolId}_${idx}_${rIdx}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dateTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {school}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {attendance || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {imageUrl ? (
                              <a
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 hover:underline"
                              >
                                View Image
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {report.topics || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {report.summary || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {report.notes || <span className="text-gray-400">-</span>}
                          </td>
                        </tr>
                      ));
                    } else {
                      return (
                        <tr key={`${record.date}_${record.trainerId}_${record.schoolId}_${idx}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dateTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {school}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {attendance || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {imageUrl ? (
                              <a
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 hover:underline"
                              >
                                View Image
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">-</td>
                          <td className="px-6 py-4 text-sm text-gray-400">-</td>
                          <td className="px-6 py-4 text-sm text-gray-400">-</td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrainerCombinedSheetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
          <DashboardHeader showBackButton backHref="/trainer/dashboard" role="TRAINER_SCHOOL" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <TrainerCombinedSheetContent />
    </Suspense>
  );
}
