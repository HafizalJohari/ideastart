import { type NextRequest } from 'next/server'
import { type CopywritingStyle, copywritingStyles } from '@/components/style-selector'
import { type WritingTone, writingTones } from '@/components/tone-selector'
import { type Language } from '@/components/language-selector'
import { type PlatformType } from '@/components/platform-selector'
import { type ModelType } from '@/components/model-selector'
import { OpenAIClient } from '@/lib/openai'
import { AnthropicClient } from '@/lib/anthropic'
import { CerebrasClient } from '@/lib/cerebras'
import { fal } from "@fal-ai/client"

// Configure FAL.ai client
if (!process.env.FAL_KEY) {
  throw new Error('FAL_KEY is required')
}

fal.config({
  credentials: process.env.FAL_KEY
})

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface FalImageResponse {
  data: {
    images: Array<{
      url: string
    }>
  }
}

interface QueueStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  error?: string
  logs?: Array<{ message: string }>
}

async function generateImage(prompt: string): Promise<string> {
  const maxRetries = 3
  const timeout = 60000 // 60 seconds
  const pollInterval = 2000 // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating image attempt ${attempt}/${maxRetries}:`, prompt)
      
      // Submit the request
      const { request_id } = await fal.queue.submit("fal-ai/flux-pro", {
        input: {
          prompt,
          aspect_ratio: "9:16", // Set vertical aspect ratio
          num_inference_steps: 35, // Increased for better quality
          guidance_scale: 7.5, // Increased for better prompt adherence
          num_images: 1,
          safety_tolerance: "2",
          output_format: "jpeg",
          raw: false // Enable post-processing for better results
        }
      })

      console.log('Request submitted with ID:', request_id)

      // Poll for completion
      const startTime = Date.now()
      while (Date.now() - startTime < timeout) {
        // Check status
        const status = await fal.queue.status("fal-ai/flux-pro", {
          requestId: request_id,
          logs: true
        }) as QueueStatus

        if (status.logs) {
          status.logs.forEach(log => console.log('FAL.ai log:', log.message))
        }

        if (status.status === 'COMPLETED') {
          // Get the result
          const result = await fal.queue.result("fal-ai/flux-pro", {
            requestId: request_id
          }) as FalImageResponse

          const imageUrl = result.data?.images?.[0]?.url
          if (!imageUrl) {
            throw new Error('No image URL in response')
          }

          console.log('Successfully generated image')
          return imageUrl
        } else if (status.status === 'FAILED') {
          throw new Error(`Image generation failed: ${status.error || 'Unknown error'}`)
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }

      throw new Error('Image generation timed out')
    } catch (error) {
      console.error(`Error generating image (attempt ${attempt}/${maxRetries}):`, error)
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to generate image after ${maxRetries} attempts`)
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  throw new Error('Failed to generate image') // Fallback error
}

function formatResponse(content: string): string {
  if (!content) return ''
  
  // Remove any markdown formatting
  let formattedContent = content
    .replace(/[*_~`]/g, '') // Remove markdown formatting characters
    .replace(/#{1,6}\s/g, '') // Remove heading markers
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to plain text
    .trim()

  // Ensure platform sections are clearly separated
  formattedContent = formattedContent
    .split('\n')
    .map(line => {
      // Add extra spacing around platform headers
      if (line.startsWith('- ') && line.includes(':')) {
        return `\n${line}\n`
      }
      return line
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Clean up excessive line breaks again

  return formattedContent
}

const platformData = {
  twitter: {
    name: 'Twitter/X',
    instructions: 'Concise, engaging content within 280 characters, using appropriate hashtags'
  },
  linkedin: {
    name: 'LinkedIn',
    instructions: 'Professional tone, industry insights, and business-focused content'
  },
  facebook: {
    name: 'Facebook',
    instructions: 'Conversational, community-focused content with emotional engagement'
  },
  instagram: {
    name: 'Instagram',
    instructions: 'Visually descriptive content, engaging captions, and relevant hashtags'
  },
  tiktok: {
    name: 'TikTok',
    instructions: 'Trendy, short-form content ideas with viral potential'
  },
  threads: {
    name: 'Threads',
    instructions: 'Conversational, community-focused content similar to Twitter but more casual'
  },
  snapchat: {
    name: 'Snapchat',
    instructions: 'Casual, fun, and ephemeral content ideas'
  },
  youtube: {
    name: 'YouTube',
    instructions: 'Detailed video content ideas, scripts, or descriptions'
  },
  voiceover: {
    name: 'Voiceover',
    instructions: 'Natural, conversational scripts optimized for audio delivery'
  },
  emailMarketing: {
    name: 'Email Marketing',
    instructions: 'Compelling subject lines and personalized email content'
  },
  blogArticle: {
    name: 'Blog Article',
    instructions: 'Well-structured, SEO-friendly article outlines or content'
  },
  imagePrompt: {
    name: 'Image Prompt',
    instructions: 'Create a detailed, descriptive prompt for image generation that captures the visual elements, style, composition, and mood of the request'
  },
  conversation: {
    name: 'Conversation',
    instructions: 'Natural, conversational responses optimized for chat interactions'
  }
} as const

interface RequestBody {
  message: string
  platforms: PlatformType[]
  language: Language
  style: CopywritingStyle
  tone: WritingTone
  model: ModelType
  sessionId?: string
  messages?: Message[]
  directImageGeneration?: boolean
}

export async function POST(req: Request) {
  try {
    const {
      message,
      platforms,
      language,
      style,
      tone,
      model,
      sessionId,
      messages,
      directImageGeneration
    } = (await req.json()) as RequestBody

    // Handle direct image generation without LLM processing
    if (directImageGeneration && platforms.includes('imagePrompt')) {
      const imageUrl = await generateImage(message)
      return Response.json({ imageUrl })
    }

    // Build system message for AI
    const languageInstructions = language === 'en' 
      ? '' 
      : `Please respond in ${language} language.`

    const styleInstructions = style && style !== 'none' && copywritingStyles[style]
      ? `Please structure your response using the ${copywritingStyles[style].name} framework: ${copywritingStyles[style].description}`
      : ''

    const toneInstructions = tone && tone !== 'none' && writingTones[tone]
      ? `Please maintain a ${writingTones[tone].name} tone: ${writingTones[tone].description}`
      : ''

    const platformInstructions = platforms
      .map(platform => platformData[platform as keyof typeof platformData]?.instructions || '')
      .filter(Boolean)
      .join('\n')

    const systemMessage = `You are an expert in front desk and customer relations, specializing in creating engaging content for multiple platforms.

${languageInstructions}

${styleInstructions}

${toneInstructions}

${platformInstructions}

Please generate content optimized for the following platforms:
${platforms.map(platform => platformData[platform as keyof typeof platformData]?.name || platform).join('\n')}

When responding, please structure your response clearly for each platform when multiple are selected${style && style !== 'none' ? `, following the ${copywritingStyles[style].name} framework` : ''} in a plain text format.`

    // Get AI response based on model
    let response
    if (model.startsWith('gpt-')) {
      const openai = new OpenAIClient()
      response = await openai.chat({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        model
      })
    } else if (model === 'claude-3-5-haiku-20241022') {
      const anthropic = new AnthropicClient()
      response = await anthropic.chat({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ]
      })
    } else {
      const cerebras = new CerebrasClient()
      response = await cerebras.chat({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ]
      })
    }

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from AI')
    }

    // Format the response to ensure plain text
    const formattedResponse = formatResponse(response.choices[0].message.content)

    if (!formattedResponse) {
      throw new Error('Empty response from AI')
    }

    // Then, handle image generation if imagePrompt is selected
    let imageUrl: string | undefined
    if (platforms.includes('imagePrompt') && !directImageGeneration) {
      try {
        imageUrl = await generateImage(formattedResponse)
      } catch (error) {
        console.error('Error generating image:', error)
      }
    }

    return Response.json({
      response: formattedResponse,
      imageUrl
    })

  } catch (error) {
    console.error('Error in chat API:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
