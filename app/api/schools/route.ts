import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCollection, School } from '@/lib/db';
import { z } from 'zod';

const schoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  locationText: z.string().min(1, 'Location is required'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schools = await getCollection<School>('schools');
    const allSchools = await schools.find({}).sort({ name: 1 }).toArray();

    return NextResponse.json({
      schools: allSchools.map(school => ({
        ...school,
        _id: school._id?.toString(),
      }))
    });
  } catch (error: any) {
    console.error('Get schools error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    // Only admins and teachers can create schools
    if (role !== 'ADMIN' && role !== 'ROBOCHAMPS_TEACHER') {
      return NextResponse.json({ error: 'Only admins and teachers can create schools' }, { status: 403 });
    }

    const body = await request.json();
    const validated = schoolSchema.parse(body);

    const schools = await getCollection<School>('schools');
    
    // Check if school already exists
    const existingSchool = await schools.findOne({
      name: validated.name,
      locationText: validated.locationText,
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: 'School with this name and location already exists' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const now = new Date();
    
    const school: School = {
      name: validated.name,
      locationText: validated.locationText,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await schools.insertOne(school);

    return NextResponse.json(
      {
        success: true,
        school: {
          ...school,
          _id: result.insertedId.toString(),
        },
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

    console.error('Create school error:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}
