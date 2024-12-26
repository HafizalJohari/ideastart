import { fal } from '@fal-ai/client';

if (!process.env.FAL_KEY) {
  throw new Error('FAL_KEY is required');
}

// Initialize FAL AI client
fal.config({
  credentials: process.env.FAL_KEY,
});

export interface GenerateImageParams {
  prompt: string;
  negative_prompt?: string;
  image_size?: "square" | "portrait" | "landscape";
}

export interface GenerateImageResponse {
  images: { url: string }[];
  seed?: number;
}

interface FalImageResult {
  url: string;
  width: number;
  height: number;
}

interface FalApiResponse {
  data: {
    images: FalImageResult[];
    seed?: number;
  };
}

// Add interface for queue status
interface QueueStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  error?: string;
}

/**
 * Retry a function with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  // Initialize lastError with a default error
  let lastError: Error = new Error('Operation failed');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) break;
      
      // Wait with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      );
    }
  }
  
  throw lastError;
}

// Add timeout constant
const TIMEOUT_MS = 60000; // 1 minute timeout

// Add polling interval constant
const POLLING_INTERVAL_MS = 1000; // 1 second between status checks

/**
 * Generates an image using FAL AI's API
 */
export async function generateImage({
  prompt,
  negative_prompt = "ugly, disfigured, low quality, blurry, nsfw",
  image_size = "square"
}: GenerateImageParams): Promise<GenerateImageResponse> {
  let width = 1024;
  let height = 1024;

  // Adjust dimensions based on image size preference
  switch (image_size) {
    case "portrait":
      width = 768;
      height = 1024;
      break;
    case "landscape":
      width = 1024;
      height = 768;
      break;
  }

  try {
    console.log('🎨 Starting image generation with prompt:', prompt);

    // Submit the request with retry logic
    const { request_id } = await retry(() => 
      fal.queue.submit('fal-ai/flux/dev', {
        input: {
          prompt,
          negative_prompt,
          image_size: {
            width: 1920,
            height: 1080
          },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          seed: Math.floor(Math.random() * 10000000),
          scheduler: "DDIM",
          output_format: "jpeg"
        }
      })
    );

    console.log('📝 Image generation request submitted with ID:', request_id);

    // Add status polling with timeout
    const startTime = Date.now();
    
    while (Date.now() - startTime < TIMEOUT_MS) {
      const status = await fal.queue.status('fal-ai/flux/dev', {
        requestId: request_id
      }) as QueueStatus;

      console.log(`🔄 Request ${request_id} status:`, status.status);

      if (status.status === 'COMPLETED') {
        console.log(`✅ Request ${request_id} completed, fetching result...`);
        
        // Get the result once completed
        const result = await retry(() => 
          fal.queue.result('fal-ai/flux/dev', {
            requestId: request_id
          })
        ) as FalApiResponse;

        console.log(`🎉 Request ${request_id} successfully generated image`);

        return {
          images: result.data.images.map((img: FalImageResult) => ({ url: img.url })),
          seed: result.data.seed
        };
      }

      if (status.status === 'FAILED') {
        console.error(`❌ Request ${request_id} failed:`, status.error);
        throw new Error(`Image generation failed: ${status.error || 'Unknown error'}`);
      }

      // Wait before checking status again
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
    }

    console.error(`⏰ Request ${request_id} timed out after ${TIMEOUT_MS}ms`);
    throw new Error('Image generation timed out');
  } catch (error) {
    console.error('❌ Failed to generate image after retries:', error);
    throw new Error(
      error instanceof Error 
        ? `Image generation failed: ${error.message}`
        : 'Image generation failed with unknown error'
    );
  }
} 