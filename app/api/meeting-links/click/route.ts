import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, MeetingLink, MeetingLinkClick, School } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { meetingLinkId } = body;

    if (!meetingLinkId) {
      return NextResponse.json({ error: 'Meeting link ID is required' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const userName = session.user?.name || 'Unknown';
    const userEmail = session.user?.email || '';
    const schoolId = (session.user as any).schoolId;

    // Get school name if user has schoolId
    let schoolName = '';
    if (schoolId) {
      const schools = await getCollection<School>('schools');
      try {
        const school = await schools.findOne({ _id: new ObjectId(schoolId) as any });
        schoolName = school?.name || '';
      } catch (e) {
        // If schoolId is not a valid ObjectId, try as string
        const school = await schools.findOne({ _id: schoolId as any });
        schoolName = school?.name || '';
      }
    }

    // Record the click
    const clicks = await getCollection<MeetingLinkClick>('meetingLinkClicks');
    const click: MeetingLinkClick = {
      meetingLinkId,
      userId,
      userName,
      userEmail,
      schoolName: schoolName || undefined,
      clickedAt: new Date(),
    };
    await clicks.insertOne(click);

    // Update click count
    const meetingLinks = await getCollection<MeetingLink>('meetingLinks');
    await meetingLinks.updateOne(
      { _id: new ObjectId(meetingLinkId) as any },
      { $inc: { clickCount: 1 } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
