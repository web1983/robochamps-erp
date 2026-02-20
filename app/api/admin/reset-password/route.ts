import { NextRequest, NextResponse } from 'next/server';
import { getCollection, User } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  // Security: Require a secret key to prevent unauthorized access
  secretKey: z.string().min(1, 'Secret key is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

    // Security check: Only allow reset for specific admin email with secret key
    // In production, you should set this as an environment variable
    const ADMIN_SECRET = process.env.ADMIN_RESET_SECRET || 'robochamps-admin-reset-2024';
    
    if (validated.secretKey !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 403 }
      );
    }

    // Find user by email
    const users = await getCollection<User>('users');
    let user = await users.findOne({ 
      email: validated.email.toLowerCase() 
    });

    // If user doesn't exist, create admin user
    if (!user) {
      const { createUser } = await import('@/lib/auth');
      const now = new Date();
      
      user = await createUser({
        name: 'Admin User',
        email: validated.email.toLowerCase(),
        passwordHash: await hashPassword(validated.newPassword),
        role: 'ADMIN',
        createdAt: now,
        updatedAt: now,
      });
      
      return NextResponse.json({
        success: true,
        message: `Admin user created and password set for ${validated.email}`,
        created: true,
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(validated.newPassword);

    // Update password
    const { ObjectId } = await import('mongodb');
    const result = await users.updateOne(
      { _id: new ObjectId(user._id) as any },
      {
        $set: {
          passwordHash,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password updated successfully for ${validated.email}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
