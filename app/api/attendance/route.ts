import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, AttendanceRecord, User, School } from '@/lib/db';
import { uploadImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max

// Global error handler wrapper
function withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error: any) {
      console.error('API Route Error Handler:', error);
      console.error('Error type:', typeof error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Always return JSON, never HTML
      return NextResponse.json(
        {
          error: error?.message || 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  };
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async (req: NextRequest) => {
    // Wrap everything to ensure JSON is always returned
    try {
    console.log('Attendance POST: Starting...');
    
    // Ensure we can parse the request
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError: any) {
      console.error('Attendance POST: Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error. Please try logging in again.' },
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('Attendance POST: Session:', session ? 'exists' : 'missing');
    
    if (!session || !(session.user as any).id) {
      console.log('Attendance POST: Unauthorized - no session or user id');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const schoolId = (session.user as any).schoolId;
    
    console.log('Attendance POST: User:', { userId, role, schoolId });

    // Only trainers can mark attendance
    if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
      console.log('Attendance POST: Forbidden - not a trainer');
      return NextResponse.json({ error: 'Only trainers can mark attendance' }, { status: 403 });
    }

    if (!schoolId) {
      console.log('Attendance POST: Bad request - no schoolId');
      return NextResponse.json({ error: 'School not found. Please contact admin to assign you to a school.' }, { status: 400 });
    }

    console.log('Attendance POST: Parsing form data...');
    let formData;
    let photo: File | null = null;
    let classLabel: string = '';
    let lat: string | null = null;
    let lng: string | null = null;
    let accuracy: string | null = null;
    
    try {
      formData = await req.formData();
      photo = formData.get('photo') as File;
      classLabel = formData.get('classLabel') as string;
      lat = formData.get('lat') as string | null;
      lng = formData.get('lng') as string | null;
      accuracy = formData.get('accuracy') as string | null;
    } catch (formError: any) {
      console.error('Attendance POST: Form data parsing error:', formError);
      return NextResponse.json(
        { error: 'Failed to parse form data. Please ensure all fields are provided.' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Attendance POST: Form data:', { 
      hasPhoto: !!photo, 
      photoSize: photo?.size, 
      classLabel,
      hasLocation: !!(lat && lng)
    });

    if (!photo) {
      console.log('Attendance POST: Bad request - no photo');
      return NextResponse.json({ error: 'Photo is required' }, { status: 400 });
    }

    if (!classLabel) {
      console.log('Attendance POST: Bad request - no classLabel');
      return NextResponse.json({ error: 'Class label is required' }, { status: 400 });
    }

    // Upload photo to Cloudinary
    console.log('Attendance POST: Uploading to Cloudinary...');
    let photoUrl: string;
    try {
      photoUrl = await uploadImage(photo, 'robochamps-attendance');
      console.log('Attendance POST: Cloudinary upload successful:', photoUrl);
    } catch (uploadError: any) {
      console.error('Attendance POST: Cloudinary upload error:', uploadError);
      console.error('Attendance POST: Upload error details:', {
        message: uploadError.message,
        stack: uploadError.stack,
        name: uploadError.name
      });
      return NextResponse.json(
        { error: `Photo upload failed: ${uploadError.message || 'Please check Cloudinary configuration in Vercel environment variables'}` },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create attendance record
    console.log('Attendance POST: Creating database record...');
    let attendanceRecords;
    try {
      attendanceRecords = await getCollection<AttendanceRecord>('attendanceRecords');
    } catch (dbError: any) {
      console.error('Attendance POST: Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const now = new Date();
    let ObjectId;
    try {
      const mongodb = await import('mongodb');
      ObjectId = mongodb.ObjectId;
    } catch (importError: any) {
      console.error('Attendance POST: MongoDB import error:', importError);
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Convert schoolId and trainerId to ObjectId if they're strings
    let schoolIdObj: any;
    let trainerIdObj: any;
    
    try {
      schoolIdObj = typeof schoolId === 'string' ? new ObjectId(schoolId) as any : schoolId;
      trainerIdObj = typeof userId === 'string' ? new ObjectId(userId) as any : userId;
      console.log('Attendance POST: ObjectId conversion successful');
    } catch (idError: any) {
      console.error('Attendance POST: ObjectId conversion error:', idError);
      return NextResponse.json(
        { error: `Invalid user or school ID: ${idError.message}` },
        { status: 400 }
      );
    }
    
    const record: AttendanceRecord = {
      schoolId: schoolIdObj,
      trainerId: trainerIdObj,
      classLabel,
      datetime: now,
      photoUrl,
      ...(lat && lng && {
        geo: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          accuracy: accuracy ? parseFloat(accuracy) : undefined,
          capturedAt: now,
        },
      }),
      createdAt: now,
    };

    console.log('Attendance POST: Inserting record into database...');
    let result;
    try {
      result = await attendanceRecords.insertOne(record);
      console.log('Attendance POST: Database insert successful:', result.insertedId);
    } catch (dbError: any) {
      console.error('Attendance POST: Database insert error:', dbError);
      console.error('Attendance POST: DB error details:', {
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      });
      return NextResponse.json(
        { error: `Failed to save attendance: ${dbError.message || 'Database error. Please check MongoDB connection.'}` },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Attendance POST: Success!');
    return NextResponse.json(
      {
        success: true,
        attendanceId: result.insertedId.toString(),
      },
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    } catch (error: any) {
      console.error('Attendance POST: Inner catch error:', error);
      console.error('Attendance POST: Error stack:', error.stack);
      console.error('Attendance POST: Error name:', error.name);
      console.error('Attendance POST: Error message:', error.message);
      
      // Always return JSON, never HTML
      return NextResponse.json(
        { 
          error: error.message || 'Failed to mark attendance. Please check server logs.',
          code: 'ATTENDANCE_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      );
    }
  })(request);
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const trainerId = searchParams.get('trainerId');
    const schoolIdFilter = searchParams.get('schoolId');
    const trainerNameFilter = searchParams.get('trainerName');
    const trainerEmailFilter = searchParams.get('trainerEmail');

    const attendanceRecords = await getCollection<AttendanceRecord>('attendanceRecords');
    const users = await getCollection<User>('users');
    const schools = await getCollection<School>('schools');
    
    let query: any = {};

    // Admins and teachers can see all, trainers see only their own
    if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
      query.trainerId = userId;
    } else if (trainerId) {
      query.trainerId = trainerId;
    }

    if (schoolId && role !== 'ADMIN' && role !== 'ROBOCHAMPS_TEACHER') {
      const { ObjectId } = await import('mongodb');
      query.schoolId = typeof schoolId === 'string' ? (new ObjectId(schoolId) as any) : schoolId;
    } else if (schoolIdFilter) {
      const { ObjectId } = await import('mongodb');
      query.schoolId = new ObjectId(schoolIdFilter) as any;
    }

    if (startDate || endDate) {
      query.datetime = {};
      if (startDate) {
        query.datetime.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.datetime.$lte = end;
      }
    }

    // Get all records first
    let records = await attendanceRecords.find(query).sort({ datetime: -1 }).toArray();

    // Get all users and schools for filtering
    const allUsers = await users.find({}).toArray();
    const allSchools = await schools.find({}).toArray();
    
    const userMap = new Map(allUsers.map((u: User) => [u._id?.toString(), u]));
    const schoolMap = new Map(allSchools.map((s: School) => [s._id?.toString(), s]));

    // Filter by trainer name or email (school filtering is done via query)
    if (trainerNameFilter || trainerEmailFilter) {
      records = records.filter((record: AttendanceRecord) => {
        const trainer = userMap.get(record.trainerId?.toString() || '') as User | undefined;
        
        if (trainerNameFilter && trainer) {
          if (!trainer.name.toLowerCase().includes(trainerNameFilter.toLowerCase())) {
            return false;
          }
        }
        
        if (trainerEmailFilter && trainer) {
          if (!trainer.email.toLowerCase().includes(trainerEmailFilter.toLowerCase())) {
            return false;
          }
        }
        
        return true;
      });
    }

    // Enrich records with trainer and school info
    const enrichedRecords = records.map((record: AttendanceRecord) => {
      const trainer = userMap.get(record.trainerId?.toString() || '') as User | undefined;
      const school = schoolMap.get(record.schoolId?.toString() || '') as School | undefined;
      
      return {
        ...record,
        trainerName: trainer?.name || 'Unknown',
        trainerEmail: trainer?.email || 'Unknown',
        schoolName: school?.name || 'Unknown',
      };
    });

    return NextResponse.json({ 
      records: enrichedRecords.map((record: any) => ({
        ...record,
        _id: record._id?.toString(),
        schoolId: record.schoolId?.toString(),
        trainerId: record.trainerId?.toString(),
      }))
    });
  } catch (error: any) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}
