import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser, hashPassword, isFirstUser } from '@/lib/auth';
import { getCollection, School } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  schoolId: z.string().optional(), // Optional for first user (admin)
  location: z.string().optional(), // Optional for first user (admin)
  trainerType: z.enum(['ROBOCHAMPS', 'SCHOOL']).optional(), // Optional for first user (admin)
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await getUserByEmail(validated.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Determine role (first user becomes ADMIN, others become trainers)
    const firstUser = await isFirstUser();
    const role = firstUser ? 'ADMIN' : (validated.trainerType === 'ROBOCHAMPS' ? 'TRAINER_ROBOCHAMPS' : 'TRAINER_SCHOOL');

    // For non-admin users, school is required
    if (!firstUser && !validated.schoolId) {
      return NextResponse.json(
        { error: 'School is required' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    let schoolId: string | undefined = undefined;

    // Find school by ID (only if schoolId is provided)
    if (validated.schoolId) {
      const schools = await getCollection<School>('schools');
      const { ObjectId } = await import('mongodb');
      const school = await schools.findOne({
        _id: new ObjectId(validated.schoolId) as any,
      });

      if (!school) {
        return NextResponse.json(
          { error: 'School not found' },
          { status: 400 }
        );
      }

      schoolId = school._id?.toString() || validated.schoolId;
    }

    // Create user
    const user = await createUser({
      name: validated.fullName,
      email: validated.email.toLowerCase(),
      passwordHash,
      role,
      schoolId,
      trainerType: firstUser ? undefined : validated.trainerType,
    });

    return NextResponse.json(
      {
        success: true,
        message: firstUser
          ? 'Account created successfully. You are now the admin.'
          : 'Account created successfully. Please login.',
        userId: user._id,
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

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
