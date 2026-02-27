import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, LateUploadRequest, LateUploadRequestStatus } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  year: z.number().int().min(2000).max(2100),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const userName = (session.user as any).name || '';
    const userEmail = (session.user as any).email || '';
    const schoolId = (session.user as any).schoolId;

    if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
      return NextResponse.json(
        { error: 'Only trainers can request late upload approval' },
        { status: 403 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School not found. Please contact admin to assign you to a school.' },
        { status: 400 }
      );
    }

    const body = await request.json();

    let validated;
    try {
      validated = requestSchema.parse({
        month: body.month,
        year: body.year,
        reason: body.reason,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }

    // Enforce that request is only needed/allowed after deadline
    const [requestYear, requestMonth] = validated.month.split('-').map(Number);
    const now = new Date();
    const deadline = new Date(requestYear, (requestMonth - 1) + 1, 5, 23, 59, 59, 999);

    if (now <= deadline) {
      return NextResponse.json(
        {
          error:
            'You can still upload this month\'s sheet directly. Late approval request is only needed after the 5th of next month.',
          code: 'BEFORE_DEADLINE',
        },
        { status: 400 }
      );
    }

    // Get school name
    const { ObjectId } = await import('mongodb');
    const schools = await getCollection('schools');
    const schoolObjectId = new ObjectId(schoolId);
    const school = await schools.findOne({ _id: schoolObjectId as any });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 });
    }
    const schoolName = school.name || 'Unknown School';

    const lateRequests = await getCollection<LateUploadRequest>('lateUploadRequests');

    // Check for existing request for this trainer + month
    const existing = await lateRequests.findOne({
      trainerId: userId,
      month: validated.month,
      year: validated.year,
    } as any);

    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json(
          {
            error: 'You already have a pending approval request for this month.',
            code: 'ALREADY_PENDING',
          },
          { status: 400 }
        );
      }

      if (existing.status === 'APPROVED') {
        return NextResponse.json(
          {
            error:
              'Your approval request for this month is already approved. You can upload the sheet now.',
            code: 'ALREADY_APPROVED',
          },
          { status: 400 }
        );
      }

      if (existing.status === 'REJECTED') {
        // Allow creating a new request if previous was rejected, but optional: block or allow one more
        // For now, allow a new request by not returning here.
      }
    }

    const nowDate = new Date();

    const newRequest: LateUploadRequest = {
      trainerId: userId,
      trainerName: userName,
      trainerEmail: userEmail,
      schoolId: schoolId.toString(),
      schoolName,
      month: validated.month,
      year: validated.year,
      reason: validated.reason,
      status: 'PENDING',
      createdAt: nowDate,
    };

    const result = await lateRequests.insertOne(newRequest as any);

    return NextResponse.json(
      {
        success: true,
        request: {
          ...newRequest,
          _id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create late upload request error:', error);
    return NextResponse.json(
      { error: 'Failed to create late upload request' },
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

    const lateRequests = await getCollection<LateUploadRequest>('lateUploadRequests');
    const query: any = {};

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as LateUploadRequestStatus | null;
    const month = searchParams.get('month');
    const trainerEmail = searchParams.get('trainerEmail');
    const schoolName = searchParams.get('schoolName');

    if (role === 'ADMIN') {
      // Admin can see all requests, with optional filters
      if (statusFilter) {
        query.status = statusFilter;
      }
      if (month) {
        query.month = month;
      }
      if (trainerEmail) {
        query.trainerEmail = { $regex: trainerEmail, $options: 'i' };
      }
      if (schoolName) {
        query.schoolName = { $regex: schoolName, $options: 'i' };
      }
    } else if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
      // Trainers can only see their own requests
      query.trainerId = userId;
    } else {
      return NextResponse.json(
        { error: 'Not allowed to view late upload requests' },
        { status: 403 }
      );
    }

    const requests = await lateRequests.find(query).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      requests: requests.map((req: LateUploadRequest) => ({
        ...req,
        _id: (req as any)._id?.toString(),
      })),
    });
  } catch (error) {
    console.error('Get late upload requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch late upload requests' },
      { status: 500 }
    );
  }
}

