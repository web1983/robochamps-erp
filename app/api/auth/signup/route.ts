import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser, hashPassword, isFirstUser } from '@/lib/auth';
import { getCollection, School } from '@/lib/db';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  schoolId: z.string().min(1, 'School is required'),
  location: z.string().min(1, 'Location is required'),
  trainerType: z.enum(['ROBOCHAMPS', 'SCHOOL']),
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

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Find school by ID
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

    // Create user
    const user = await createUser({
      name: validated.fullName,
      email: validated.email.toLowerCase(),
      passwordHash,
      role,
      schoolId: school._id?.toString() || validated.schoolId,
      trainerType: validated.trainerType,
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
