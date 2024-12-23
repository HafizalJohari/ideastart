import OpenAI from 'openai'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class OpenAIClient {
  private client: OpenAI

  constructor() {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is required')
    }

    this.client = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      maxRetries: 3,
      timeout: 30000,
      dangerouslyAllowBrowser: true
    })
  }

  async chat({ messages, model = 'gpt-4' }: { messages: Message[], model?: string }): Promise<ChatResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
      })

      return {
        choices: [
          {
            message: {
              content: response.choices[0].message.content || '',
            },
          },
        ],
      }
    } catch (error) {
      console.error('Error in chat function:', error)
      throw error
    }
  }
}