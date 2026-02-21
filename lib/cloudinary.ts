import { v2 as cloudinary } from 'cloudinary';

// Lazy configuration - only configure when actually needed
function ensureCloudinaryConfig() {
  const config = cloudinary.config();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  // Always reconfigure to ensure we have the latest env vars
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // Always use HTTPS
    });
    console.log('Cloudinary configured with cloud_name:', cloudName);
    console.log('Cloudinary API key (first 4 chars):', apiKey.substring(0, 4));
    console.log('Cloudinary API secret (length):', apiSecret.length);
  }
}

export async function uploadImage(file: File | Blob, folder: string = 'robochamps-attendance'): Promise<string> {
  try {
    // Check environment variables first
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      const missing = [];
      if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
      if (!apiKey) missing.push('CLOUDINARY_API_KEY');
      if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
      throw new Error(`Cloudinary is not configured. Missing: ${missing.join(', ')}. Please add these environment variables in Vercel.`);
    }
    
    // Log credential info (without exposing secrets)
    console.log('Cloudinary upload: Starting...');
    console.log('Cloudinary cloud_name:', cloudName);
    console.log('Cloudinary API key (first 4):', apiKey.substring(0, 4));
    console.log('Cloudinary API secret (length):', apiSecret.length);
    
    // Configure Cloudinary
    ensureCloudinaryConfig();
    
    // Read file as buffer
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (bufferError: any) {
      throw new Error(`Failed to read file: ${bufferError.message || 'Unknown error'}`);
    }
    
    const buffer = Buffer.from(arrayBuffer);
    console.log('Cloudinary upload: File size:', buffer.length, 'bytes');
    
    // Convert buffer to base64 data URI for direct upload
    const base64String = buffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64String}`;
    
    console.log('Cloudinary upload: Attempting direct upload...');
    
    // Use direct upload method instead of stream (more reliable)
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
        timeout: 30000, // 30 second timeout
      });
      
      if (result?.secure_url) {
        console.log('Cloudinary upload: Success! URL:', result.secure_url);
        return result.secure_url;
      } else {
        throw new Error('Upload failed: No URL returned from Cloudinary');
      }
    } catch (uploadError: any) {
      console.error('Cloudinary direct upload error:', uploadError);
      console.error('Cloudinary error details:', {
        http_code: uploadError.http_code,
        message: uploadError.message,
        name: uploadError.name,
        error: uploadError.error
      });
      
      // Provide more helpful error messages
      let errorMessage = 'Cloudinary upload failed';
      if (uploadError.http_code === 401) {
        errorMessage = 'Cloudinary authentication failed. Please check your API credentials in Vercel environment variables.';
      } else if (uploadError.http_code === 400) {
        errorMessage = `Cloudinary upload failed: ${uploadError.message || 'Invalid request'}`;
      } else if (uploadError.http_code === 500 || uploadError.message?.includes('Server return invalid JSON')) {
        errorMessage = 'Cloudinary API error (500). Please verify your Cloudinary credentials are correct in Vercel: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. The API is returning an error page, which usually means invalid credentials.';
      } else if (uploadError.message) {
        // Check if error message contains HTML (indicates API error page)
        if (uploadError.message.includes('<!DOCTYPE') || uploadError.message.includes('Server return invalid JSON')) {
          errorMessage = 'Cloudinary API error. Please verify your Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are correct in Vercel environment variables.';
        } else {
          errorMessage = `Cloudinary upload failed: ${uploadError.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('Cloudinary upload function error:', error);
    throw error; // Re-throw to be caught by caller
  }
}

export function getCloudinarySignature(folder: string = 'robochamps-attendance') {
  ensureCloudinaryConfig();
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error('CLOUDINARY_API_SECRET is not set');
  }
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    apiSecret
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}
