import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, LateUploadRequest, LateUploadRequestStatus } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const adminId = (session.user as any).id;
    const adminName = (session.user as any).name || 'Admin';

    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update late upload requests' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const status: LateUploadRequestStatus = body.status;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const { ObjectId } = await import('mongodb');
    const lateRequests = await getCollection<LateUploadRequest>('lateUploadRequests');

    const requestId = new ObjectId(params.id);

    const existing = await lateRequests.findOne({ _id: requestId as any });
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const now = new Date();

    await lateRequests.updateOne(
      { _id: requestId as any },
      {
        $set: {
          status,
          decidedAt: now,
          decidedByAdminId: adminId,
          decidedByAdminName: adminName,
        },
      }
    );

    const updated = await lateRequests.findOne({ _id: requestId as any });

    return NextResponse.json({
      success: true,
      request: {
        ...updated,
        _id: (updated as any)?._id?.toString(),
      },
    });
  } catch (error) {
    console.error('Update late upload request error:', error);
    return NextResponse.json(
      { error: 'Failed to update late upload request' },
      { status: 500 }
    );
  }
}

