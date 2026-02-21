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

    // Log credential info (without exposing secrets)
    console.log('Cloudinary test: cloud_name:', cloudName);
    console.log('Cloudinary test: API key (first 4):', apiKey.substring(0, 4));
    console.log('Cloudinary test: API secret (length):', apiSecret.length);

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // Test connection by trying to ping Cloudinary API
    try {
      console.log('Cloudinary test: Attempting ping...');
      const result = await cloudinary.api.ping();
      console.log('Cloudinary test: Ping successful!', result);
      
      return NextResponse.json({
        success: true,
        message: 'Cloudinary credentials are valid!',
        cloudName: cloudName,
        apiKey: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set',
        apiSecret: apiSecret ? `Set (${apiSecret.length} characters)` : 'Not set',
        pingResult: result,
      });
    } catch (apiError: any) {
      console.error('Cloudinary API test error:', apiError);
      console.error('Cloudinary API test error details:', {
        http_code: apiError.http_code,
        message: apiError.message,
        name: apiError.name,
        error: apiError.error
      });
      
      let errorMessage = 'Cloudinary API test failed';
      if (apiError.http_code === 401) {
        errorMessage = 'Invalid Cloudinary credentials. Please check your API_KEY and API_SECRET. Make sure you copied the FULL API secret from Cloudinary dashboard.';
      } else if (apiError.http_code === 404) {
        errorMessage = 'Invalid Cloudinary cloud name. Please check your CLOUDINARY_CLOUD_NAME.';
      } else if (apiError.http_code === 500) {
        errorMessage = 'Cloudinary server error (500). Your credentials might be invalid or there might be a service issue. Please verify all three credentials are correct in Vercel.';
      } else if (apiError.message) {
        if (apiError.message.includes('<!DOCTYPE') || apiError.message.includes('Server return invalid JSON')) {
          errorMessage = 'Cloudinary returned an HTML error page. This usually means invalid credentials. Please verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are correct in Vercel.';
        } else {
          errorMessage = `Cloudinary error: ${apiError.message}`;
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          http_code: apiError.http_code,
          details: apiError.message,
          cloudName: cloudName,
          apiKey: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set',
          apiSecret: apiSecret ? `Set (${apiSecret.length} characters)` : 'Not set',
          troubleshooting: {
            step1: 'Go to https://cloudinary.com/console and verify your credentials',
            step2: 'Make sure you copied the FULL API secret (usually 40+ characters)',
            step3: 'In Vercel, check that all three variables are set correctly',
            step4: 'Redeploy after updating environment variables',
          }
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
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
