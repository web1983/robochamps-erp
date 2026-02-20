import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, User, School } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    // Only admins can view all users
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can view users' }, { status: 403 });
    }

    const users = await getCollection<User>('users');
    const schools = await getCollection<School>('schools');
    
    const allUsers = await users.find({}).sort({ createdAt: -1 }).toArray();
    const allSchools = await schools.find({}).toArray();
    
    const schoolMap = new Map(allSchools.map((s: School) => [s._id?.toString(), s]));

    // Remove password hash and enrich with school name
    const usersList = allUsers.map((user: User) => {
      const school = user.schoolId ? (schoolMap.get(user.schoolId?.toString() || '') as School | undefined) : null;
      return {
        _id: user._id?.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId?.toString(),
        schoolName: school?.name || 'N/A',
        trainerType: user.trainerType,
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json({ users: usersList });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
