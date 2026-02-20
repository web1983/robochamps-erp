import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, AttendanceRecord, User, School } from '@/lib/db';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const schoolId = (session.user as any).schoolId;

    // Only trainers can mark attendance
    if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
      return NextResponse.json({ error: 'Only trainers can mark attendance' }, { status: 403 });
    }

    if (!schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 });
    }

    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const classLabel = formData.get('classLabel') as string;
    const lat = formData.get('lat') as string | null;
    const lng = formData.get('lng') as string | null;
    const accuracy = formData.get('accuracy') as string | null;

    if (!photo) {
      return NextResponse.json({ error: 'Photo is required' }, { status: 400 });
    }

    if (!classLabel) {
      return NextResponse.json({ error: 'Class label is required' }, { status: 400 });
    }

    // Upload photo to Cloudinary
    const photoUrl = await uploadImage(photo, 'robochamps-attendance');

    // Create attendance record
    const attendanceRecords = await getCollection<AttendanceRecord>('attendanceRecords');
    const now = new Date();
    
    const record: AttendanceRecord = {
      schoolId,
      trainerId: userId,
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

    const result = await attendanceRecords.insertOne(record);

    return NextResponse.json(
      {
        success: true,
        attendanceId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark attendance' },
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
      const trainer = userMap.get(record.trainerId?.toString() || '');
      const school = schoolMap.get(record.schoolId?.toString() || '');
      
      return {
        ...record,
        trainerName: trainer?.name || 'Unknown',
        trainerEmail: trainer?.email || 'Unknown',
        schoolName: school?.name || 'Unknown',
      };
    });

    return NextResponse.json({ 
      records: enrichedRecords.map(record => ({
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
