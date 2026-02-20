import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, School } from '@/lib/db';
import { z } from 'zod';

const schoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  locationText: z.string().min(1, 'Location is required'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    // Only admins and teachers can update schools
    if (role !== 'ADMIN' && role !== 'ROBOCHAMPS_TEACHER') {
      return NextResponse.json({ error: 'Only admins and teachers can update schools' }, { status: 403 });
    }

    const body = await request.json();
    const validated = schoolSchema.parse(body);

    const { ObjectId } = await import('mongodb');
    const schools = await getCollection<School>('schools');
    
    // Check if school exists
    const schoolId = new ObjectId(params.id);
    const existingSchool = await schools.findOne({ _id: schoolId as any });

    if (!existingSchool) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Check if another school with the same name and location exists
    const duplicateSchool = await schools.findOne({
      name: validated.name,
      locationText: validated.locationText,
      _id: { $ne: schoolId as any },
    });

    if (duplicateSchool) {
      return NextResponse.json(
        { error: 'School with this name and location already exists' },
        { status: 400 }
      );
    }

    const now = new Date();
    
    const result = await schools.updateOne(
      { _id: schoolId as any },
      {
        $set: {
          name: validated.name,
          locationText: validated.locationText,
          updatedAt: now,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const updatedSchool = await schools.findOne({ _id: schoolId as any });

    return NextResponse.json({
      success: true,
      school: {
        ...updatedSchool,
        _id: updatedSchool?._id?.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update school error:', error);
    return NextResponse.json(
      { error: 'Failed to update school' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    // Only admins can delete schools
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete schools' }, { status: 403 });
    }

    const { ObjectId } = await import('mongodb');
    const schools = await getCollection<School>('schools');
    const users = await getCollection('users');
    
    const schoolId = new ObjectId(params.id);
    
    // Check if school exists
    const school = await schools.findOne({ _id: schoolId as any });
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Check if any users are associated with this school
    const usersWithSchool = await users.countDocuments({ schoolId: params.id });
    if (usersWithSchool > 0) {
      return NextResponse.json(
        { error: `Cannot delete school. ${usersWithSchool} user(s) are associated with this school.` },
        { status: 400 }
      );
    }

    const result = await schools.deleteOne({ _id: schoolId as any });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'School deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete school error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete school' },
      { status: 500 }
    );
  }
}
