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

    // Parse form data first
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const month = formData.get('month') as string;
    const yearStr = formData.get('year') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 });
    }

    if (!yearStr) {
      return NextResponse.json({ error: 'Year is required' }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid year format' }, { status: 400 });
    }

    // Validate month and year
    let validated;
    try {
      validated = uploadSchema.parse({ month, year });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }

    // Get school name (convert schoolId string to ObjectId)
    const { ObjectId } = await import('mongodb');
    const schools = await getCollection('schools');
    const schoolObjectId = new ObjectId(schoolId);
    const school = await schools.findOne({ _id: schoolObjectId as any });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 });
    }
    const schoolName = school.name || 'Unknown School';

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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Supabase URL not configured');
      return NextResponse.json(
        { error: 'File storage is not configured. NEXT_PUBLIC_SUPABASE_URL is missing.' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SECRET_KEY) {
      console.error('Supabase service role key not configured');
      return NextResponse.json(
        { error: 'File storage is not configured. SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is missing.' },
        { status: 500 }
      );
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json(
        { error: 'File storage is not configured. Supabase admin client failed to initialize.' },
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

    console.log('Attempting to upload to Supabase:', {
      bucket: 'combined-sheets',
      filePath,
      fileSize: file.size,
      fileType: file.type,
    });

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('combined-sheets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        name: uploadError.name,
      });
      
      // Provide more helpful error messages
      let errorMessage = `Failed to upload file: ${uploadError.message}`;
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('The resource was not found')) {
        errorMessage = 'Storage bucket "combined-sheets" not found. Please create it in Supabase dashboard.';
      } else if (uploadError.message?.includes('new row violates row-level security')) {
        errorMessage = 'Storage bucket access denied. Please check Supabase storage policies.';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    if (!uploadData) {
      console.error('Upload succeeded but no data returned');
      return NextResponse.json(
        { error: 'Upload succeeded but no data returned from storage' },
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

    console.error('Upload sheet error - Full details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload sheet';
    return NextResponse.json(
      { 
        error: errorMessage,
        // Include more details in development
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.stack : String(error)
        })
      },
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

    // Optional filters (only for admins)
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const schoolIdFilter = searchParams.get('schoolId');
    const schoolNameFilter = searchParams.get('schoolName');
    const trainerEmailFilter = searchParams.get('trainerEmail');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (role === 'ADMIN') {
      if (trainerId) {
        query.trainerId = trainerId;
      }
      if (schoolIdFilter) {
        query.schoolId = schoolIdFilter;
      }
      if (schoolNameFilter) {
        // Use regex for case-insensitive partial match
        query.schoolName = { $regex: schoolNameFilter, $options: 'i' };
      }
      if (trainerEmailFilter) {
        // Use regex for case-insensitive partial match
        query.trainerEmail = { $regex: trainerEmailFilter, $options: 'i' };
      }
    }
    
    if (month) {
      query.month = month;
    }
    if (year) {
      query.year = parseInt(year);
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.uploadedAt = {};
      if (startDate) {
        query.uploadedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.uploadedAt.$lte = end;
      }
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
