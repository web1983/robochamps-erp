import { NextRequest, NextResponse } from 'next/server';
import { getCollection, School } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Make this endpoint public so signup page can use it
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'School code is required' },
        { status: 400 }
      );
    }

    const schools = await getCollection<School>('schools');
    const school = await schools.findOne({
      schoolCode: code.toUpperCase().trim(),
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found with this code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      school: {
        ...school,
        _id: school._id?.toString(),
      },
    });
  } catch (error: any) {
    console.error('Get school by code error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch school' },
      { status: 500 }
    );
  }
}
