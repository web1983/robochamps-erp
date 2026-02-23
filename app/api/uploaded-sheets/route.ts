import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCollection, UploadedCombinedSheet } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const uploadSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  year: z.number().int().min(2000).max(2100),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const userName = (session.user as any).name || '';
    const userEmail = (session.user as any).email || '';
    const schoolId = (session.user as any).schoolId;

    // Only trainers can upload sheets
    if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
      return NextResponse.json(
        { error: 'Only trainers can upload combined sheets' },
        { status: 403 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School not found. Please contact admin to assign you to a school.' },
        { status: 400 }
      );
    }

    // Get school name
    const schools = await getCollection('schools');
    const school = await schools.findOne({ _id: schoolId as any });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 });
    }
    const schoolName = school.name || 'Unknown School';

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const month = formData.get('month') as string;
    const year = parseInt(formData.get('year') as string);

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Validate month and year
    const validated = uploadSchema.parse({ month, year });

    // Validate file type (PDF, Excel, or Image)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF, Excel, or Image files only.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'File storage is not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `combined-sheet-${userId}-${validated.month}-${Date.now()}.${fileExt}`;
    const filePath = `uploaded-sheets/${userId}/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('combined-sheets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('combined-sheets')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Save metadata to MongoDB
    const uploadedSheets = await getCollection<UploadedCombinedSheet>('uploadedCombinedSheets');
    const now = new Date();

    const uploadedSheet: UploadedCombinedSheet = {
      trainerId: userId,
      trainerName: userName,
      trainerEmail: userEmail,
      schoolId: schoolId.toString(),
      schoolName: schoolName,
      month: validated.month,
      year: validated.year,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: now,
      createdAt: now,
    };

    const result = await uploadedSheets.insertOne(uploadedSheet);

    return NextResponse.json(
      {
        success: true,
        sheet: {
          ...uploadedSheet,
          _id: result.insertedId.toString(),
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

    console.error('Upload sheet error:', error);
    return NextResponse.json(
      { error: 'Failed to upload sheet' },
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

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const schoolId = (session.user as any).schoolId;

    const uploadedSheets = await getCollection<UploadedCombinedSheet>('uploadedCombinedSheets');
    const query: any = {};

    // Filter by role
    if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
      // Trainers can only see their own sheets
      query.trainerId = userId;
    } else if (role === 'ADMIN') {
      // Admins can see all sheets
      // No filter needed
    } else if (role === 'TEACHER') {
      // Teachers can see sheets from their school
      if (schoolId) {
        query.schoolId = schoolId.toString();
      }
    }

    // Optional filters
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const schoolIdFilter = searchParams.get('schoolId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (trainerId && role === 'ADMIN') {
      query.trainerId = trainerId;
    }
    if (schoolIdFilter && role === 'ADMIN') {
      query.schoolId = schoolIdFilter;
    }
    if (month) {
      query.month = month;
    }
    if (year) {
      query.year = parseInt(year);
    }

    const sheets = await uploadedSheets
      .find(query)
      .sort({ uploadedAt: -1 })
      .toArray();

    return NextResponse.json({
      sheets: sheets.map((sheet: UploadedCombinedSheet) => ({
        ...sheet,
        _id: sheet._id?.toString(),
      })),
    });
  } catch (error) {
    console.error('Get uploaded sheets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploaded sheets' },
      { status: 500 }
    );
  }
}
