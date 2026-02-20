import { v2 as cloudinary } from 'cloudinary';

// Lazy configuration - only configure when actually needed
function ensureCloudinaryConfig() {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
      api_key: process.env.CLOUDINARY_API_KEY || '',
      api_secret: process.env.CLOUDINARY_API_SECRET || '',
    });
  }
}

export async function uploadImage(file: File | Blob, folder: string = 'robochamps-attendance'): Promise<string> {
  try {
    ensureCloudinaryConfig();
    
    // Check if Cloudinary is configured
    const config = cloudinary.config();
    const cloudName = config.cloud_name || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = config.api_key || process.env.CLOUDINARY_API_KEY;
    const apiSecret = config.api_secret || process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      const missing = [];
      if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
      if (!apiKey) missing.push('CLOUDINARY_API_KEY');
      if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
      throw new Error(`Cloudinary is not configured. Missing: ${missing.join(', ')}. Please add these environment variables in Vercel.`);
    }
    
    // Reconfigure if needed
    if (!config.cloud_name) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
    
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (bufferError: any) {
      throw new Error(`Failed to read file: ${bufferError.message || 'Unknown error'}`);
    }
    
    const buffer = Buffer.from(arrayBuffer);

    // Wrap in Promise with timeout to prevent hanging
    return new Promise((resolve, reject) => {
      let resolved = false;
      let rejectionHandled = false;
      
      // Helper to safely reject only once
      const safeReject = (error: Error) => {
        if (!resolved && !rejectionHandled) {
          rejectionHandled = true;
          resolved = true;
          clearTimeout(timeout);
          reject(error);
        }
      };
      
      // Helper to safely resolve only once
      const safeResolve = (url: string) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(url);
        }
      };
      
      // Set a timeout (30 seconds)
      const timeout = setTimeout(() => {
        if (!resolved) {
          safeReject(new Error('Cloudinary upload timeout: Upload took too long (30s limit)'));
        }
      }, 30000);
      
      try {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (resolved) return; // Already handled
            
            try {
              if (error) {
                console.error('Cloudinary upload error:', error);
                console.error('Cloudinary error details:', {
                  http_code: error.http_code,
                  message: error.message,
                  name: error.name,
                  error: error.error
                });
                
                // Provide more helpful error messages
                let errorMessage = 'Cloudinary upload failed';
                if (error.http_code === 401) {
                  errorMessage = 'Cloudinary authentication failed. Please check your API credentials in Vercel environment variables.';
                } else if (error.http_code === 400) {
                  errorMessage = `Cloudinary upload failed: ${error.message || 'Invalid request'}`;
                } else if (error.http_code === 500 || error.message?.includes('Server return invalid JSON')) {
                  // HTML error page indicates credential or configuration issue
                  errorMessage = 'Cloudinary API error (500). Please verify your Cloudinary credentials are correct in Vercel: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. The API is returning an error page, which usually means invalid credentials.';
                } else if (error.message) {
                  // Check if error message contains HTML (indicates API error page)
                  if (error.message.includes('<!DOCTYPE') || error.message.includes('Server return invalid JSON')) {
                    errorMessage = 'Cloudinary API error. Please verify your Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are correct in Vercel environment variables.';
                  } else {
                    errorMessage = `Cloudinary upload failed: ${error.message}`;
                  }
                }
                
                safeReject(new Error(errorMessage));
              } else if (result?.secure_url) {
                safeResolve(result.secure_url);
              } else {
                safeReject(new Error('Upload failed: No URL returned from Cloudinary'));
              }
            } catch (callbackError: any) {
              console.error('Cloudinary callback error:', callbackError);
              safeReject(new Error(`Cloudinary callback error: ${callbackError.message || 'Unknown error'}`));
            }
          }
        );
        
        uploadStream.on('error', (streamError: any) => {
          if (resolved) return;
          console.error('Cloudinary stream error:', streamError);
          console.error('Cloudinary stream error details:', {
            code: streamError.code,
            message: streamError.message,
            name: streamError.name
          });
          
          // Check for specific error codes
          let errorMessage = 'Cloudinary stream error';
          if (streamError.code === 'ECONNREFUSED' || streamError.code === 'ENOTFOUND') {
            errorMessage = 'Cannot connect to Cloudinary. Please check your network connection and Cloudinary credentials.';
          } else if (streamError.code === 'ETIMEDOUT') {
            errorMessage = 'Cloudinary connection timeout. Please try again.';
          } else if (streamError.message) {
            errorMessage = `Cloudinary stream error: ${streamError.message}`;
          }
          
          safeReject(new Error(errorMessage));
        });
        
        // Note: 'close' event fires after stream ends, which is normal
        // We don't need to handle it as an error since the callback handles success/failure
        
        uploadStream.end(buffer);
      } catch (streamSetupError: any) {
        console.error('Cloudinary stream setup error:', streamSetupError);
        safeReject(new Error(`Cloudinary stream setup failed: ${streamSetupError.message || 'Unknown error'}`));
      }
    });
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
