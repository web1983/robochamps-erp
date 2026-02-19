import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connection successful' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Check MongoDB URI and IP whitelist in Atlas'
      },
      { status: 500 }
    );
  }
}
