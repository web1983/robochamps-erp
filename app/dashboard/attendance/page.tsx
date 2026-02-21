'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface AttendanceRecord {
  _id: string;
  schoolId: string;
  trainerId: string;
  classLabel: string;
  datetime: string;
  photoUrl: string;
  trainerName?: string;
  trainerEmail?: string;
  schoolName?: string;
  geo?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [schools, setSchools] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate, schoolId, trainerName, trainerEmail]);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();
      if (response.ok) {
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      let url = '/api/attendance';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (schoolId) params.append('schoolId', schoolId);
      if (trainerName) params.append('trainerName', trainerName);
      if (trainerEmail) params.append('trainerEmail', trainerEmail);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attendance');
      }

      setRecords(data.records || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Attendance Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 30);
    
    if (startDate || endDate) {
      doc.setFontSize(10);
      let dateRange = 'Date Range: ';
      if (startDate) dateRange += format(new Date(startDate), 'PP');
      if (startDate && endDate) dateRange += ' to ';
      if (endDate) dateRange += format(new Date(endDate), 'PP');
      doc.text(dateRange, 14, 36);
    }

    const tableData = records.map((record) => [
      format(new Date(record.datetime), 'PPp'),
      record.classLabel,
      record.trainerName || 'N/A',
      record.schoolName || 'N/A',
      record.geo ? `${record.geo.lat.toFixed(6)}, ${record.geo.lng.toFixed(6)}` : 'N/A',
    ]);

    (doc as any).autoTable({
      head: [['Date & Time', 'Class', 'Trainer', 'School', 'Location']],
      body: tableData,
      startY: startDate || endDate ? 42 : 36,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 50 },
      },
    });

    // Add signature area
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text('Principal Signature:', 14, finalY);
    doc.line(14, finalY + 5, 80, finalY + 5);
    
    doc.text('Date:', 100, finalY);
    doc.line(100, finalY + 5, 150, finalY + 5);

    doc.text('Stamp:', 14, finalY + 15);
    doc.rect(14, finalY + 18, 60, 20);

    doc.save(`attendance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
          <button
            onClick={generatePDF}
            disabled={records.length === 0}
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📄 Generate PDF
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Name</label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                placeholder="Search by name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Email</label>
              <input
                type="email"
                value={trainerEmail}
                onChange={(e) => setTrainerEmail(e.target.value)}
                placeholder="Search by email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
          </div>
          <div>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSchoolId('');
                setTrainerName('');
                setTrainerEmail('');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {records.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No attendance records found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record._id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{record.classLabel}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <strong>Date & Time:</strong> {format(new Date(record.datetime), 'PPP p')}
                      </p>
                      {record.trainerName && (
                        <p className="text-gray-600">
                          <strong>Trainer:</strong> {record.trainerName}
                          {record.trainerEmail && ` (${record.trainerEmail})`}
                        </p>
                      )}
                      {record.schoolName && (
                        <p className="text-gray-600">
                          <strong>School:</strong> {record.schoolName}
                        </p>
                      )}
                      {record.geo && (
                        <p className="text-gray-600">
                          <strong>📍 Location:</strong> {record.geo.lat.toFixed(6)}, {record.geo.lng.toFixed(6)}
                          {record.geo.accuracy && ` (Accuracy: ${record.geo.accuracy.toFixed(2)}m)`}
                        </p>
                      )}
                    </div>
                  </div>
                  <img
                    src={record.photoUrl}
                    alt="Attendance photo"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
