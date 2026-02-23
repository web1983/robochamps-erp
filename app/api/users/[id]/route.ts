import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, User } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'TEACHER', 'TRAINER_ROBOCHAMPS', 'TRAINER_SCHOOL']).optional(),
  schoolId: z.string().optional().nullable(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

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
    // Only admins can delete users
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { ObjectId } = await import('mongodb');
    const users = await getCollection<User>('users');
    
    const targetUserId = new ObjectId(params.id);
    
    // Prevent self-deletion
    if (userId === params.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await users.findOne({ _id: targetUserId as any });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const result = await users.deleteOne({ _id: targetUserId as any });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

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
    // Only admins can update users
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update users' }, { status: 403 });
    }

    const body = await request.json();
    
    // Check if this is a password-only update (backward compatibility)
    if (body.newPassword && !body.role && body.schoolId === undefined) {
      const validated = changePasswordSchema.parse(body);
      const { ObjectId } = await import('mongodb');
      const users = await getCollection<User>('users');
      
      const targetUserId = new ObjectId(params.id);
      
      // Check if user exists
      const user = await users.findOne({ _id: targetUserId as any });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Hash new password
      const passwordHash = await hashPassword(validated.newPassword);

      const result = await users.updateOne(
        { _id: targetUserId as any },
        {
          $set: {
            passwordHash,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully',
      });
    }

    // Full user update (role, school, optional password)
    const validated = updateUserSchema.parse(body);
    const { ObjectId } = await import('mongodb');
    const users = await getCollection<User>('users');
    const { getCollection: getSchoolCollection, School } = await import('@/lib/db');
    
    const targetUserId = new ObjectId(params.id);
    
    // Check if user exists
    const user = await users.findOne({ _id: targetUserId as any });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate school if provided
    let schoolId: string | undefined | null = validated.schoolId;
    if (schoolId !== undefined && schoolId !== null && schoolId !== '') {
      const schools = await getSchoolCollection<School>('schools');
      const school = await schools.findOne({
        _id: new ObjectId(schoolId) as any,
      });

      if (!school) {
        return NextResponse.json(
          { error: 'School not found' },
          { status: 400 }
        );
      }
      schoolId = school._id?.toString() || schoolId;
    } else if (schoolId === '') {
      schoolId = null;
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validated.role) {
      updateData.role = validated.role;
      // Update trainerType based on role
      if (validated.role === 'TRAINER_ROBOCHAMPS') {
        updateData.trainerType = 'ROBOCHAMPS';
      } else if (validated.role === 'TRAINER_SCHOOL') {
        updateData.trainerType = 'SCHOOL';
      } else {
        updateData.trainerType = null;
      }
    }

    if (schoolId !== undefined) {
      updateData.schoolId = schoolId || null;
    }

    if (validated.newPassword) {
      updateData.passwordHash = await hashPassword(validated.newPassword);
    }

    const result = await users.updateOne(
      { _id: targetUserId as any },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}
