import Cerebras from '@cerebras/cerebras_cloud_sdk'

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

interface CerebrasResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class CerebrasClient {
  private client: Cerebras

  constructor() {
    if (!process.env.NEXT_PUBLIC_CEREBRAS_API_KEY) {
      throw new Error('NEXT_PUBLIC_CEREBRAS_API_KEY is required')
    }

    this.client = new Cerebras({
      apiKey: process.env.NEXT_PUBLIC_CEREBRAS_API_KEY,
      maxRetries: 2,
      timeout: 60000 // 1 minute
    })
  }

  async chat({ messages }: { messages: Message[] }): Promise<ChatResponse> {
    try {
      const systemMessage = messages.find(m => m.role === 'system')?.content || ''
      const userMessage = messages.find(m => m.role === 'user')?.content || ''

      const response = await this.client.chat.completions.create({
        model: 'llama-3.3-70b',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      }) as CerebrasResponse

      return {
        choices: [
          {
            message: {
              content: response.choices[0].message.content
            }
          }
        ]
      }
    } catch (error) {
      console.error('Error in Cerebras chat:', error)
      throw error
    }
  }
}