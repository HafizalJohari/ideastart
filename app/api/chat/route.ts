import { type NextRequest } from 'next/server'
import { type CopywritingStyle, copywritingStyles } from '@/components/style-selector'
import { type WritingTone, writingTones } from '@/components/tone-selector'
import { type Language } from '@/components/language-selector'
import { type PlatformType } from '@/components/platform-selector'
import { type ModelType } from '@/components/model-selector'
import { OpenAIClient } from '@/lib/openai'
import { AnthropicClient } from '@/lib/anthropic'
import { CerebrasClient } from '@/lib/cerebras'
import { generateImage, type GenerateImageResponse } from '@/lib/falai'
import { GeminiClient } from '@/lib/gemini'
import { XAIClient } from '@/lib/xai'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface FalImage {
  url: string
  width: number
  height: number
  content_type: string
}

interface FalQueueStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  logs?: Array<{ message: string }>
  error?: string
}

interface FalResult {
  data: {
    images: Array<{
      url: string
      width: number
      height: number
    }>
  }
  requestId: string
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

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      platforms = ['conversation'],
      language = 'en',
      style = 'none',
      tone = 'none',
      model = 'llama-3.3-70b',
      messages = [],
      directImageGeneration = false
    } = await req.json()

    // If it's a direct image generation request, bypass the LLM
    if (directImageGeneration && platforms.includes('imagePrompt')) {
      console.log('Generating image directly from prompt:', message)
      
      try {
        const imageResponse = await generateImage({ prompt: message })
        const imageUrl = imageResponse.images[0]?.url
        
        if (!imageUrl) {
          throw new Error('No image URL in response')
        }

        return Response.json({
          response: message,
          imageUrl,
          model,
          platforms,
          style,
          tone,
          language
        })

      } catch (error) {
        console.error('Error generating image:', error)
        throw error
      }
    }

    // Build system message for AI
    const languageInstructions = language === 'en' 
      ? '' 
      : `Please respond in ${language} language.`

    const styleInstructions = style && style !== 'none' && copywritingStyles[style as keyof typeof copywritingStyles]
      ? `Please structure your response using the ${copywritingStyles[style as keyof typeof copywritingStyles].name} framework: ${copywritingStyles[style as keyof typeof copywritingStyles].description}`
      : ''

    const toneInstructions = tone && tone !== 'none' && writingTones[tone as keyof typeof writingTones]
      ? `Please maintain a ${writingTones[tone as keyof typeof writingTones].name} tone: ${writingTones[tone as keyof typeof writingTones].description}`
      : ''

    const platformInstructions = platforms
      .map((platform: PlatformType) => platformData[platform as keyof typeof platformData]?.instructions || '')
      .filter(Boolean)
      .join('\n')

    const systemMessage = `You are an expert in front desk and customer relations, specializing in creating engaging content for multiple platforms.

${languageInstructions}

${styleInstructions}

${toneInstructions}

${platformInstructions}

Please generate content optimized for the following platforms:
${platforms.map((platform: PlatformType) => platformData[platform as keyof typeof platformData]?.name || platform).join('\n')}

When responding, please structure your response clearly for each platform when multiple are selected${style && style !== 'none' ? `, following the ${copywritingStyles[style as keyof typeof copywritingStyles].name} framework` : ''} in a plain text format.`

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
    } else if (model.startsWith('gemini-')) {
      const gemini = new GeminiClient()
      response = await gemini.chat({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ]
      })
    } else if (model === 'grok-2-1212') {
      const xai = new XAIClient()
      response = await xai.chat({
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

    // Handle image generation after chat response
    let imageUrl: string | undefined
    if (platforms.includes('imagePrompt') && !directImageGeneration) {
      try {
        const imageResponse = await generateImage({ prompt: formattedResponse })
        imageUrl = imageResponse.images[0]?.url
      } catch (error) {
        console.error('Error generating image:', error)
        // Don't throw here, just log the error and continue without the image
      }
    }

    return Response.json({
      response: formattedResponse,
      imageUrl
    })

  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}