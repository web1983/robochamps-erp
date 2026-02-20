import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, MeetingLink } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const meetingLinkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create meeting links' }, { status: 403 });
    }

    const body = await request.json();
    const validated = meetingLinkSchema.parse(body);

    const meetingLinks = await getCollection<MeetingLink>('meetingLinks');
    const now = new Date();

    const meetingLink: MeetingLink = {
      title: validated.title,
      url: validated.url,
      description: validated.description,
      createdBy: (session.user as any).id,
      isActive: validated.isActive !== undefined ? validated.isActive : true,
      clickCount: 0,
      scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : undefined,
      scheduledTime: validated.scheduledTime || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const result = await meetingLinks.insertOne(meetingLink);

    return NextResponse.json(
      {
        success: true,
        meetingLink: { ...meetingLink, _id: result.insertedId.toString() },
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

    console.error('Create meeting link error:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting link' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetingLinks = await getCollection<MeetingLink>('meetingLinks');
    const links = await meetingLinks.find({ isActive: true }).sort({ 
      scheduledDate: 1, // Sort by scheduled date (upcoming first)
      createdAt: -1 
    }).toArray();

    return NextResponse.json({ 
      meetingLinks: links.map((link: MeetingLink) => ({
        ...link,
        _id: link._id?.toString(),
        scheduledDate: link.scheduledDate ? link.scheduledDate.toISOString().split('T')[0] : undefined,
        scheduledTime: link.scheduledTime,
      }))
    });
  } catch (error: any) {
    console.error('Get meeting links error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meeting links' },
      { status: 500 }
    );
  }
}
