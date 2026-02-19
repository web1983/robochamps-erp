import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, DailyReport } from '@/lib/db';
import { z } from 'zod';

const reportSchema = z.object({
  type: z.enum(['TEACHER_TRAINING', 'TRAINER_CLASS']),
  schoolId: z.string().optional(),
  classLabel: z.string().optional(),
  topics: z.string().min(1, 'Topics are required'),
  summary: z.string().min(1, 'Summary is required'),
  notes: z.string().optional(),
  datetime: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const schoolId = (session.user as any).schoolId;

    const body = await request.json();
    const validated = reportSchema.parse(body);

    // Validate permissions
    if (validated.type === 'TEACHER_TRAINING' && role !== 'TEACHER' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only teachers can create training reports' },
        { status: 403 }
      );
    }

    if (validated.type === 'TRAINER_CLASS' && role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only trainers can create class reports' },
        { status: 403 }
      );
    }

    // Use trainer's schoolId if not provided
    const finalSchoolId = validated.schoolId || (validated.type === 'TRAINER_CLASS' ? schoolId : undefined);

    const reports = await getCollection<DailyReport>('dailyReports');
    const now = new Date();
    
    const report: DailyReport = {
      type: validated.type,
      schoolId: finalSchoolId,
      authorId: userId,
      classLabel: validated.classLabel,
      topics: validated.topics,
      summary: validated.summary,
      notes: validated.notes,
      datetime: validated.datetime ? new Date(validated.datetime) : now,
      createdAt: now,
    };

    const result = await reports.insertOne(report);

    return NextResponse.json(
      {
        success: true,
        reportId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Report creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

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
    const type = searchParams.get('type') as 'TEACHER_TRAINING' | 'TRAINER_CLASS' | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportSchoolId = searchParams.get('schoolId');
    const trainerId = searchParams.get('trainerId');

    const reports = await getCollection<DailyReport>('dailyReports');
    const query: any = {};

    if (type) {
      query.type = type;
    }

    // Filter by author based on role
    if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
      query.authorId = userId;
      query.type = 'TRAINER_CLASS';
    } else if (role === 'TEACHER') {
      query.authorId = userId;
      query.type = 'TEACHER_TRAINING';
    } else if (trainerId) {
      query.authorId = trainerId;
    }

    if (schoolId && role !== 'ADMIN' && role !== 'TEACHER') {
      query.schoolId = schoolId;
    } else if (reportSchoolId) {
      query.schoolId = reportSchoolId;
    }

    if (startDate || endDate) {
      query.datetime = {};
      if (startDate) {
        query.datetime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.datetime.$lte = new Date(endDate);
      }
    }

    const reportList = await reports.find(query).sort({ datetime: -1 }).toArray();

    return NextResponse.json({ reports: reportList });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
