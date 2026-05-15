import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, User } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { findSchoolById, normalizeSchoolId } from '@/lib/teacherSchoolScope';
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
    
    const targetUserId = new ObjectId(params.id);
    
    // Check if user exists
    const user = await users.findOne({ _id: targetUserId as any });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const effectiveRole = validated.role ?? user.role;
    const needsSchool =
      effectiveRole === 'TEACHER' ||
      effectiveRole === 'TRAINER_ROBOCHAMPS' ||
      effectiveRole === 'TRAINER_SCHOOL';

    const existingSchoolId = normalizeSchoolId(user.schoolId);
    const incomingSchoolId =
      validated.schoolId !== undefined ? normalizeSchoolId(validated.schoolId) : undefined;

    let resolvedSchoolId: string | null = existingSchoolId;

    if (incomingSchoolId !== undefined) {
      if (!incomingSchoolId) {
        if (needsSchool) {
          return NextResponse.json({ error: 'Please select a school for this role' }, { status: 400 });
        }
        resolvedSchoolId = null;
      } else {
        const school = await findSchoolById(incomingSchoolId);
        if (!school) {
          return NextResponse.json({ error: 'School not found. Refresh and try again.' }, { status: 400 });
        }
        resolvedSchoolId = normalizeSchoolId(school._id) ?? incomingSchoolId;
      }
    }

    if (needsSchool && !resolvedSchoolId) {
      return NextResponse.json({ error: 'Please select a school for this role' }, { status: 400 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validated.role) {
      updateData.role = validated.role;
      if (validated.role === 'TRAINER_ROBOCHAMPS') {
        updateData.trainerType = 'ROBOCHAMPS';
      } else if (validated.role === 'TRAINER_SCHOOL') {
        updateData.trainerType = 'SCHOOL';
      } else {
        updateData.trainerType = null;
      }
    }

    if (!needsSchool) {
      updateData.schoolId = null;
    } else {
      updateData.schoolId = resolvedSchoolId;
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
