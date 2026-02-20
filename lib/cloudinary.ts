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
      
      // Set a timeout (30 seconds)
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Cloudinary upload timeout: Upload took too long (30s limit)'));
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
              clearTimeout(timeout);
              resolved = true;
              
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
                } else if (error.http_code === 500) {
                  errorMessage = 'Cloudinary server error. Please try again later or check Cloudinary status.';
                } else if (error.message) {
                  // Check if error message contains HTML (indicates API error page)
                  if (error.message.includes('<!DOCTYPE') || error.message.includes('Server return invalid JSON')) {
                    errorMessage = 'Cloudinary API error. Please verify your Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are correct in Vercel environment variables.';
                  } else {
                    errorMessage = `Cloudinary upload failed: ${error.message}`;
                  }
                }
                
                reject(new Error(errorMessage));
              } else if (result?.secure_url) {
                resolve(result.secure_url);
              } else {
                reject(new Error('Upload failed: No URL returned from Cloudinary'));
              }
            } catch (callbackError: any) {
              console.error('Cloudinary callback error:', callbackError);
              reject(new Error(`Cloudinary callback error: ${callbackError.message || 'Unknown error'}`));
            }
          }
        );
        
        uploadStream.on('error', (streamError: any) => {
          if (resolved) return;
          clearTimeout(timeout);
          resolved = true;
          console.error('Cloudinary stream error:', streamError);
          reject(new Error(`Cloudinary stream error: ${streamError.message || 'Unknown error'}`));
        });
        
        uploadStream.end(buffer);
      } catch (streamSetupError: any) {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          console.error('Cloudinary stream setup error:', streamSetupError);
          reject(new Error(`Cloudinary stream setup failed: ${streamSetupError.message || 'Unknown error'}`));
        }
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
