import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, LateUploadRequest, LateUploadRequestStatus, User } from '@/lib/db';
import { canRequestLateUpload } from '@/lib/lateUploadDeadline';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  year: z.coerce.number().int().min(2000).max(2100),
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters'),
});

function formatZodError(error: z.ZodError): string {
  const first = error.errors[0];
  return first?.message || 'Invalid request data';
}

async function resolveTrainerSchoolId(
  userId: string,
  sessionSchoolId: string | undefined
): Promise<string | null> {
  if (sessionSchoolId) {
    return sessionSchoolId.toString();
  }
  const { ObjectId } = await import('mongodb');
  const users = await getCollection<User>('users');
  let user: User | null = null;
  try {
    user = await users.findOne({ _id: new ObjectId(userId) as any });
  } catch {
    user = await users.findOne({ _id: userId as any });
  }
  const fromDb = user?.schoolId;
  return fromDb != null ? fromDb.toString() : null;
}

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
    if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
      return NextResponse.json(
        { error: 'Only trainers can request late upload approval' },
        { status: 403 }
      );
    }

    const body = await request.json();

    let validated;
    try {
      const month = typeof body.month === 'string' ? body.month.trim() : body.month;
      const [yFromMonth] = typeof month === 'string' ? month.split('-') : [];
      validated = requestSchema.parse({
        month,
        year: body.year ?? (yFromMonth ? parseInt(yFromMonth, 10) : undefined),
        reason: typeof body.reason === 'string' ? body.reason : body.reason,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: formatZodError(error), details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }

    const schoolId = await resolveTrainerSchoolId(userId, (session.user as any).schoolId);
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School not found. Please contact admin to assign you to a school.' },
        { status: 400 }
      );
    }

    if (!canRequestLateUpload(validated.month)) {
      return NextResponse.json(
        {
          error:
            'You can still upload this month\'s sheet directly. Late approval is only needed after the 5th of the following month.',
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

