import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, MeetingLink, MeetingLinkClick, School } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can view stats' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const email = searchParams.get('email');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const meetingLinkId = searchParams.get('meetingLinkId');

    // Get all meeting links
    const meetingLinks = await getCollection<MeetingLink>('meetingLinks');
    const links = await meetingLinks.find({}).sort({ 
      scheduledDate: 1, // Upcoming meetings first
      createdAt: -1 
    }).toArray();

    // Get school name if filtering by schoolId
    let schoolNameFilter: string | null = null;
    if (schoolId) {
      const { ObjectId } = await import('mongodb');
      const schools = await getCollection<School>('schools');
      const school = await schools.findOne({ _id: new ObjectId(schoolId) as any });
      if (school) {
        schoolNameFilter = school.name;
      }
    }

    // Build query for clicks
    const query: any = {};
    if (schoolNameFilter) {
      query.schoolName = { $regex: schoolNameFilter, $options: 'i' };
    }
    if (email) {
      query.userEmail = { $regex: email, $options: 'i' };
    }
    if (meetingLinkId) {
      query.meetingLinkId = meetingLinkId;
    }
    if (startDate || endDate) {
      query.clickedAt = {};
      if (startDate) {
        query.clickedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.clickedAt.$lte = end;
      }
    }

    // Get filtered clicks
    const clicks = await getCollection<MeetingLinkClick>('meetingLinkClicks');
    const allClicks = await clicks.find(query).sort({ clickedAt: -1 }).toArray();

    // Get recent clicks (last 100 for display)
    const recentClicks = allClicks.slice(0, 100).map(click => ({
      ...click,
      _id: click._id?.toString(),
    }));

    return NextResponse.json({
      meetingLinks: links.map(link => ({
        ...link,
        _id: link._id?.toString(),
        scheduledDate: link.scheduledDate ? link.scheduledDate.toISOString().split('T')[0] : undefined,
        scheduledTime: link.scheduledTime,
      })),
      recentClicks,
      totalClicks: allClicks.length,
      filteredClicks: allClicks.map(click => ({
        ...click,
        _id: click._id?.toString(),
      })),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
