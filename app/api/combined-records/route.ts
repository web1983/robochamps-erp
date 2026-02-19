import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, AttendanceRecord, DailyReport, User, School } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const schoolId = (session.user as any).schoolId;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const schoolIdFilter = searchParams.get('schoolId');
    const trainerNameFilter = searchParams.get('trainerName');
    const trainerEmailFilter = searchParams.get('trainerEmail');

    const attendanceRecords = await getCollection<AttendanceRecord>('attendanceRecords');
    const reports = await getCollection<DailyReport>('dailyReports');
    const users = await getCollection<User>('users');
    const schools = await getCollection<School>('schools');

    // Build attendance query
    let attendanceQuery: any = {};
    if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
      attendanceQuery.trainerId = userId;
    }
    if (schoolId && role !== 'ADMIN' && role !== 'ROBOCHAMPS_TEACHER') {
      const { ObjectId } = await import('mongodb');
      attendanceQuery.schoolId = typeof schoolId === 'string' ? (new ObjectId(schoolId) as any) : schoolId;
    } else if (schoolIdFilter) {
      const { ObjectId } = await import('mongodb');
      attendanceQuery.schoolId = new ObjectId(schoolIdFilter) as any;
    }
    if (startDate || endDate) {
      attendanceQuery.datetime = {};
      if (startDate) {
        attendanceQuery.datetime.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        attendanceQuery.datetime.$lte = end;
      }
    }

    // Build reports query
    let reportsQuery: any = {};
    if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
      reportsQuery.authorId = userId;
      reportsQuery.type = 'TRAINER_CLASS';
    } else if (role === 'TEACHER') {
      reportsQuery.authorId = userId;
      reportsQuery.type = 'TEACHER_TRAINING';
    }
    if (schoolId && role !== 'ADMIN' && role !== 'ROBOCHAMPS_TEACHER') {
      const { ObjectId } = await import('mongodb');
      reportsQuery.schoolId = typeof schoolId === 'string' ? (new ObjectId(schoolId) as any) : schoolId;
    } else if (schoolIdFilter) {
      const { ObjectId } = await import('mongodb');
      reportsQuery.schoolId = new ObjectId(schoolIdFilter) as any;
    }
    if (startDate || endDate) {
      reportsQuery.datetime = {};
      if (startDate) {
        reportsQuery.datetime.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        reportsQuery.datetime.$lte = end;
      }
    }

    // Fetch data
    const attendanceList = await attendanceRecords.find(attendanceQuery).sort({ datetime: -1 }).toArray();
    const reportsList = await reports.find(reportsQuery).sort({ datetime: -1 }).toArray();

    // Get all users and schools for enrichment
    const allUsers = await users.find({}).toArray();
    const allSchools = await schools.find({}).toArray();
    
    const userMap = new Map(allUsers.map(u => [u._id?.toString(), u]));
    const schoolMap = new Map(allSchools.map(s => [s._id?.toString(), s]));

    // Enrich attendance records
    const enrichedAttendance = attendanceList.map(record => {
      const trainer = userMap.get(record.trainerId?.toString() || '');
      const school = schoolMap.get(record.schoolId?.toString() || '');
      
      return {
        ...record,
        trainerName: trainer?.name || 'Unknown',
        trainerEmail: trainer?.email || 'Unknown',
        schoolName: school?.name || 'Unknown',
      };
    });

    // Enrich reports
    const enrichedReports = reportsList.map(report => {
      const author = userMap.get(report.authorId?.toString() || '');
      const school = report.schoolId ? schoolMap.get(report.schoolId?.toString() || '') : null;
      
      return {
        ...report,
        trainerName: author?.name || 'Unknown',
        trainerEmail: author?.email || 'Unknown',
        schoolName: school?.name || 'Unknown',
      };
    });

    // Filter by trainer name or email
    let filteredAttendance = enrichedAttendance;
    let filteredReports = enrichedReports;

    if (trainerNameFilter || trainerEmailFilter) {
      filteredAttendance = enrichedAttendance.filter(record => {
        if (trainerNameFilter && !record.trainerName.toLowerCase().includes(trainerNameFilter.toLowerCase())) {
          return false;
        }
        if (trainerEmailFilter && !record.trainerEmail.toLowerCase().includes(trainerEmailFilter.toLowerCase())) {
          return false;
        }
        return true;
      });

      filteredReports = enrichedReports.filter(report => {
        if (trainerNameFilter && !report.trainerName.toLowerCase().includes(trainerNameFilter.toLowerCase())) {
          return false;
        }
        if (trainerEmailFilter && !report.trainerEmail.toLowerCase().includes(trainerEmailFilter.toLowerCase())) {
          return false;
        }
        return true;
      });
    }

    // Combine records by matching date, trainer, and school
    // Group by date (same day), trainer, and school
    const combinedMap = new Map<string, {
      date: Date;
      trainerId: string;
      trainerName: string;
      trainerEmail: string;
      schoolId: string;
      schoolName: string;
      attendance?: any;
      reports: any[];
    }>();

    // Add attendance records
    filteredAttendance.forEach(attendance => {
      const dateKey = new Date(attendance.datetime).toDateString();
      const key = `${dateKey}_${attendance.trainerId}_${attendance.schoolId}`;
      
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          date: new Date(attendance.datetime),
          trainerId: attendance.trainerId?.toString() || '',
          trainerName: attendance.trainerName,
          trainerEmail: attendance.trainerEmail,
          schoolId: attendance.schoolId?.toString() || '',
          schoolName: attendance.schoolName,
          attendance: attendance,
          reports: [],
        });
      } else {
        const existing = combinedMap.get(key)!;
        // Keep the earliest attendance for the day
        if (new Date(attendance.datetime) < existing.date) {
          existing.attendance = attendance;
          existing.date = new Date(attendance.datetime);
        }
      }
    });

    // Add reports to combined records
    filteredReports.forEach(report => {
      const dateKey = new Date(report.datetime).toDateString();
      const reportSchoolId = report.schoolId?.toString() || '';
      const key = `${dateKey}_${report.authorId}_${reportSchoolId}`;
      
      if (combinedMap.has(key)) {
        combinedMap.get(key)!.reports.push(report);
      } else {
        // Create new entry for report-only records
        combinedMap.set(key, {
          date: new Date(report.datetime),
          trainerId: report.authorId?.toString() || '',
          trainerName: report.trainerName,
          trainerEmail: report.trainerEmail,
          schoolId: reportSchoolId,
          schoolName: report.schoolName,
          reports: [report],
        });
      }
    });

    // Convert to array and sort by date
    const combinedRecords = Array.from(combinedMap.values())
      .map(record => ({
        ...record,
        attendance: record.attendance ? {
          ...record.attendance,
          _id: record.attendance._id?.toString(),
          schoolId: record.attendance.schoolId?.toString(),
          trainerId: record.attendance.trainerId?.toString(),
        } : null,
        reports: record.reports.map(r => ({
          ...r,
          _id: r._id?.toString(),
          schoolId: r.schoolId?.toString(),
          authorId: r.authorId?.toString(),
        })),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ records: combinedRecords });
  } catch (error: any) {
    console.error('Get combined records error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch combined records' },
      { status: 500 }
    );
  }
}
