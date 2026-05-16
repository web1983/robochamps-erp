import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, AttendanceRecord, DailyReport, User, School } from '@/lib/db';
import { schoolScopeFilter } from '@/lib/teacherSchoolScope';
import { idEqualsClause, toIdString } from '@/lib/matchMongoId';

const SESSION_MATCH_MS = 3 * 60 * 60 * 1000;
const TIGHT_TIME_MATCH_MS = 20 * 60 * 1000;

function normalizeClassLabel(label?: string | null): string {
  return (label || '').trim().toLowerCase();
}

type CombinedEntry = {
  date: Date;
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  schoolId: string;
  schoolName: string;
  attendance?: Record<string, unknown>;
  reports: Record<string, unknown>[];
};

function findAttendanceForReport(
  report: Record<string, unknown>,
  attendances: Record<string, unknown>[],
  usedAttendanceIds: Set<string>
): Record<string, unknown> | null {
  const trainerId = toIdString(report.authorId);
  const schoolId = toIdString(report.schoolId);
  const reportTime = new Date(report.datetime as string | Date).getTime();
  const reportLabel = normalizeClassLabel(report.classLabel as string | undefined);

  let labelMatch: Record<string, unknown> | null = null;
  let labelMatchDiff = Infinity;
  let timeMatch: Record<string, unknown> | null = null;
  let timeMatchDiff = Infinity;

  for (const att of attendances) {
    const attId = toIdString(att._id);
    if (!attId || usedAttendanceIds.has(attId)) continue;
    if (toIdString(att.trainerId) !== trainerId) continue;
    if (toIdString(att.schoolId) !== schoolId) continue;

    const diff = Math.abs(new Date(att.datetime as string | Date).getTime() - reportTime);
    if (diff > SESSION_MATCH_MS) continue;

    if (normalizeClassLabel(att.classLabel as string | undefined) === reportLabel && diff < labelMatchDiff) {
      labelMatch = att;
      labelMatchDiff = diff;
    }
    if (diff < TIGHT_TIME_MATCH_MS && diff < timeMatchDiff) {
      timeMatch = att;
      timeMatchDiff = diff;
    }
  }

  return labelMatch ?? timeMatch;
}

export const dynamic = 'force-dynamic';

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

    const attendanceClauses: Record<string, unknown>[] = [];
    const reportsClauses: Record<string, unknown>[] = [];

    if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
      const trainerClause = idEqualsClause('trainerId', userId);
      const authorClause = idEqualsClause('authorId', userId);
      if (trainerClause) attendanceClauses.push(trainerClause);
      if (authorClause) reportsClauses.push(authorClause);
      reportsClauses.push({ type: 'TRAINER_CLASS' });
    } else if (role === 'TEACHER') {
      if (!schoolId) {
        return NextResponse.json({ records: [] });
      }
      attendanceClauses.push({ schoolId: schoolScopeFilter(schoolId) as unknown });
      reportsClauses.push({ type: 'TRAINER_CLASS', schoolId: schoolScopeFilter(schoolId) as unknown });
    }

    if (schoolId && role !== 'ADMIN' && role !== 'ROBOCHAMPS_TEACHER' && role !== 'TEACHER') {
      const schoolClause = idEqualsClause('schoolId', schoolId);
      if (schoolClause) {
        attendanceClauses.push(schoolClause);
        reportsClauses.push(schoolClause);
      }
    } else if (schoolIdFilter) {
      const filterClause = idEqualsClause('schoolId', schoolIdFilter);
      if (filterClause) {
        attendanceClauses.push(filterClause);
        reportsClauses.push(filterClause);
      }
    }

    if (startDate || endDate) {
      const datetimeRange: Record<string, Date> = {};
      if (startDate) {
        datetimeRange.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        datetimeRange.$lte = end;
      }
      attendanceClauses.push({ datetime: datetimeRange });
      reportsClauses.push({ datetime: datetimeRange });
    }

    const attendanceQuery =
      attendanceClauses.length > 0 ? { $and: attendanceClauses } : {};
    const reportsQuery = reportsClauses.length > 0 ? { $and: reportsClauses } : {};

    // Fetch data
    const attendanceList = await attendanceRecords.find(attendanceQuery).sort({ datetime: -1 }).toArray();
    const reportsList = await reports.find(reportsQuery).sort({ datetime: -1 }).toArray();

    // Get all users and schools for enrichment
    const allUsers = await users.find({}).toArray();
    const allSchools = await schools.find({}).toArray();
    
    const userMap = new Map(allUsers.map((u: User) => [u._id?.toString(), u]));
    const schoolMap = new Map(allSchools.map((s: School) => [s._id?.toString(), s]));

    // Enrich attendance records
    const enrichedAttendance = attendanceList.map((record: AttendanceRecord) => {
      const trainer = userMap.get(record.trainerId?.toString() || '') as User | undefined;
      const school = schoolMap.get(record.schoolId?.toString() || '') as School | undefined;
      
      return {
        ...record,
        trainerName: trainer?.name || 'Unknown',
        trainerEmail: trainer?.email || 'Unknown',
        schoolName: school?.name || 'Unknown',
      };
    });

    // Enrich reports
    const enrichedReports = reportsList.map((report: DailyReport) => {
      const author = userMap.get(report.authorId?.toString() || '') as User | undefined;
      const school = report.schoolId ? (schoolMap.get(report.schoolId?.toString() || '') as School | undefined) : null;
      
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
      filteredAttendance = enrichedAttendance.filter((record: any) => {
        if (trainerNameFilter && !record.trainerName.toLowerCase().includes(trainerNameFilter.toLowerCase())) {
          return false;
        }
        if (trainerEmailFilter && !record.trainerEmail.toLowerCase().includes(trainerEmailFilter.toLowerCase())) {
          return false;
        }
        return true;
      });

      filteredReports = enrichedReports.filter((report: any) => {
        if (trainerNameFilter && !report.trainerName.toLowerCase().includes(trainerNameFilter.toLowerCase())) {
          return false;
        }
        if (trainerEmailFilter && !report.trainerEmail.toLowerCase().includes(trainerEmailFilter.toLowerCase())) {
          return false;
        }
        return true;
      });
    }

    // One combined row per class session (aligned with session history), not per calendar day
    const usedAttendanceIds = new Set<string>();
    const combinedEntries: CombinedEntry[] = [];

    const reportsSorted = [...filteredReports].sort(
      (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );

    for (const report of reportsSorted) {
      const matchedAttendance = findAttendanceForReport(
        report,
        filteredAttendance,
        usedAttendanceIds
      );
      if (matchedAttendance) {
        usedAttendanceIds.add(toIdString(matchedAttendance._id));
      }

      const when = new Date(report.datetime);
      combinedEntries.push({
        date: when,
        trainerId: toIdString(report.authorId),
        trainerName: report.trainerName as string,
        trainerEmail: report.trainerEmail as string,
        schoolId: toIdString(report.schoolId),
        schoolName: report.schoolName as string,
        attendance: matchedAttendance ?? undefined,
        reports: [report],
      });
    }

    const attendanceSorted = [...filteredAttendance].sort(
      (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );

    for (const attendance of attendanceSorted) {
      const attId = toIdString(attendance._id);
      if (attId && usedAttendanceIds.has(attId)) continue;

      combinedEntries.push({
        date: new Date(attendance.datetime),
        trainerId: toIdString(attendance.trainerId),
        trainerName: attendance.trainerName as string,
        trainerEmail: attendance.trainerEmail as string,
        schoolId: toIdString(attendance.schoolId),
        schoolName: attendance.schoolName as string,
        attendance,
        reports: [],
      });
    }

    const combinedRecords = combinedEntries
      .map((record: any) => ({
        ...record,
        attendance: record.attendance ? {
          ...record.attendance,
          _id: record.attendance._id?.toString(),
          schoolId: record.attendance.schoolId?.toString(),
          trainerId: record.attendance.trainerId?.toString(),
        } : null,
        reports: record.reports.map((r: any) => ({
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
