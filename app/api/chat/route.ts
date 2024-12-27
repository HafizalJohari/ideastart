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
import { generateRAGContext } from '@/lib/rag'

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

function formatResponse(content: string, useMarkdown: boolean = true): string {
  if (!content) return ''
  
  // If plaintext is requested, just clean up the spacing and return
  if (!useMarkdown) {
    return content
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '$2') // Remove code block markers
      .replace(/`([^`]+)`/g, '$1') // Remove inline code markers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
      .replace(/^>/gm, '') // Remove quote markers
      .trim()
  }
  
  // Clean up the text and normalize spacing
  let formattedContent = content
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
    .trim()

  // Format code blocks with syntax highlighting style
  formattedContent = formattedContent
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang ? lang.toUpperCase() : 'CODE'
      return `\`\`\`${lang || ''}\n${code.trim()}\n\`\`\``
    })

  // Format inline code
  formattedContent = formattedContent.replace(/`([^`]+)`/g, '`$1`')

  // Platform emojis mapping
  const platformEmojis: Record<string, string> = {
    'Twitter/X': '🐦',
    'LinkedIn': '💼',
    'Facebook': '👥',
    'Instagram': '📸',
    'TikTok': '🎵',
    'Threads': '🧵',
    'Snapchat': '👻',
    'YouTube': '🎥',
    'Voiceover': '🎙️',
    'Email Marketing': '📧',
    'Blog Article': '📝',
    'Image Prompt': '🎨'
  }

  // Split content by platform sections and format each
  const sections = formattedContent.split(/(?=### |\n(?=For \w+:))/g)
  
  return sections
    .map(section => {
      // Check if this is a platform section
      const platformMatch = section.match(/^(?:### |\nFor )([^:\n]+)(?:[:|\n])([\s\S]+)/i)
      
      if (platformMatch) {
        const [, platform, content] = platformMatch
        const emoji = platformEmojis[platform.trim()] || '📄'
        const cleanContent = content.trim()
          .replace(/^- /gm, '• ') // Convert bullet points to dots
          .replace(/^(\d+)\. /gm, '$1. ') // Keep numbered lists clean
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
          .replace(/^>/gm, '│ ') // Format quotes with a simple line

        return `\n${emoji} ${platform.trim()}\n${cleanContent}\n`
      }
      
      // Return non-platform content as is
      return section.trim()
    })
    .filter(Boolean)
    .join('\n\n')
    .trim()
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
  webUrls?: string[]
  useMarkdown?: boolean
}

// Add debug logging for RAG process
function logRAGDebug(message: string, data?: any) {
  console.log(`[RAG Debug] ${message}`, data ? data : '')
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
      directImageGeneration = false,
      webUrls = [],
      useMarkdown = true
    } = await req.json()

    logRAGDebug('Request received with web URLs:', webUrls)

    // If web URLs are provided, generate RAG context
    let ragContext = ''
    let ragSources: string[] = []
    if (webUrls.length > 0) {
      try {
        logRAGDebug('Starting RAG context generation')
        logRAGDebug('User message:', message)
        logRAGDebug('Processing URLs:', webUrls)

        const { context, sources } = await generateRAGContext(message, webUrls)
        
        logRAGDebug('RAG context generated successfully:', {
          contextLength: context.length,
          numberOfSources: sources.length
        })
        logRAGDebug('Generated context:', context)
        logRAGDebug('Sources used:', sources)

        ragContext = context
        ragSources = sources
      } catch (error) {
        console.error('[RAG Error] Error generating RAG context:', error)
        logRAGDebug('RAG generation failed with error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        // Continue without RAG if there's an error
      }
    }

    // If it's a direct image generation request and ONLY imagePrompt is selected, bypass the LLM
    if (directImageGeneration && platforms.length === 1 && platforms.includes('imagePrompt')) {
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

    // Handle case where imagePrompt is selected along with other platforms
    let imageUrl: string | undefined
    if (platforms.includes('imagePrompt')) {
      try {
        const imageResponse = await generateImage({ prompt: message })
        imageUrl = imageResponse.images[0]?.url
      } catch (error) {
        console.error('Error generating image:', error)
        // Continue with text generation even if image fails
      }
    }

    // Build system message for AI
    const languageInstructions = language === 'en' 
      ? '' 
      : `You MUST respond in ${language} language. Translate ALL content to ${language}, including platform-specific content, hashtags, and any other text. Do not use any English in your response except for technical terms or brand names that should remain in English.`

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

    const systemMessage = `You are an expert in creating engaging content${platforms.length === 1 && platforms[0] === 'conversation' ? ' for natural conversations' : ' for multiple platforms'}.

${languageInstructions}

${styleInstructions}

${toneInstructions}

${platformInstructions}

${ragContext ? `\nRelevant context from provided web sources:\n${ragContext}\n\nPlease use this context to inform your response while maintaining accuracy and citing sources when appropriate.` : ''}

${platforms.length === 1 && platforms[0] === 'conversation' 
  ? `Please provide a natural, conversational response in ${language === 'en' ? 'English' : language} language in a clear, well-structured format. When sharing code, use proper code blocks with language specification.`
  : `Please generate content optimized for the following platforms ONLY:
${platforms.map((platform: PlatformType) => platformData[platform as keyof typeof platformData]?.name || platform).join('\n')}

Important Instructions:
1. Structure your response with clear sections for each platform.
2. If Image Prompt is one of the platforms, create a dedicated section starting with "Image Prompt:" followed by a detailed visual description.
3. For all other platforms, create separate sections starting with the platform name followed by a colon.
4. Use clear formatting:
   - For code blocks, use triple backticks with language specification: \`\`\`language
   - For inline code, use single backticks: \`code\`
   - Use ** for emphasis
   - Use * for subtle emphasis
   - Use > for quotes or notable content
   - Use - for bullet points
   - Use 1. 2. 3. for numbered lists
5. ONLY generate content for the specifically requested platforms listed above.
6. Do not include any other platforms in your response.
7. Ensure ALL content is translated to ${language === 'en' ? 'English' : language} language, including hashtags and platform-specific content.`}

Please structure your response ${platforms.length === 1 && platforms[0] === 'conversation' ? 'as a natural conversation' : 'clearly for each requested platform'}${style && style !== 'none' ? `, following the ${copywritingStyles[style as keyof typeof copywritingStyles].name} framework` : ''}.

Remember: The ENTIRE response must be in ${language === 'en' ? 'English' : language} language.`

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
    const formattedResponse = formatResponse(response.choices[0].message.content, useMarkdown)

    if (!formattedResponse) {
      throw new Error('Empty response from AI')
    }

    return Response.json({
      response: formattedResponse,
      imageUrl,
      model,
      platforms,
      style,
      tone,
      language,
      sources: ragSources
    })

  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
