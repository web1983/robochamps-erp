import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const missing = [];
    if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing environment variables',
          missing,
          message: `Please add these environment variables in Vercel: ${missing.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // Test connection by trying to ping Cloudinary API
    // We'll use a simple API call to verify credentials
    try {
      // Try to get account details (this requires valid credentials)
      const result = await cloudinary.api.ping();
      
      return NextResponse.json({
        success: true,
        message: 'Cloudinary credentials are valid!',
        cloudName: cloudName,
        apiKey: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set',
        apiSecret: apiSecret ? 'Set (hidden)' : 'Not set',
        pingResult: result,
      });
    } catch (apiError: any) {
      console.error('Cloudinary API test error:', apiError);
      
      let errorMessage = 'Cloudinary API test failed';
      if (apiError.http_code === 401) {
        errorMessage = 'Invalid Cloudinary credentials. Please check your API_KEY and API_SECRET.';
      } else if (apiError.http_code === 404) {
        errorMessage = 'Invalid Cloudinary cloud name. Please check your CLOUDINARY_CLOUD_NAME.';
      } else if (apiError.http_code === 500) {
        errorMessage = 'Cloudinary server error. Your credentials might be invalid or there might be a service issue.';
      } else if (apiError.message) {
        errorMessage = `Cloudinary error: ${apiError.message}`;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          http_code: apiError.http_code,
          details: apiError.message,
          cloudName: cloudName,
          apiKey: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set',
          apiSecret: apiSecret ? 'Set (hidden)' : 'Not set',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Cloudinary test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test Cloudinary configuration',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
