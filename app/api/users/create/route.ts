import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, User } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'TEACHER', 'TRAINER_ROBOCHAMPS', 'TRAINER_SCHOOL']),
  schoolId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    // Only admins can create users
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    const users = await getCollection<User>('users');
    
    // Check if user already exists
    const existingUser = await users.findOne({ email: validated.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    const now = new Date();
    const newUser: User = {
      name: validated.name,
      email: validated.email,
      passwordHash,
      role: validated.role,
      schoolId: validated.schoolId || undefined,
      trainerType: validated.role === 'TRAINER_ROBOCHAMPS' || validated.role === 'TRAINER_SCHOOL' 
        ? (validated.role === 'TRAINER_ROBOCHAMPS' ? 'ROBOCHAMPS' : 'SCHOOL')
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const result = await users.insertOne(newUser);

    return NextResponse.json(
      {
        success: true,
        user: {
          _id: result.insertedId.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          schoolId: newUser.schoolId,
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

    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
