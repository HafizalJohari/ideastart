import Groq from 'groq-sdk'
import { Message } from './types'

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class GroqClient {
  private client: Groq

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set')
    }
    this.client = new Groq({ apiKey })
  }

  async sendMessage(messages: Message[]): Promise<any> {
    try {
      const groqMessages = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }))

      const completion = await this.client.chat.completions.create({
        messages: groqMessages,
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1,
        stream: false
      })

      // Format response to match expected structure
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: completion.choices[0]?.message?.content || ''
          }
        }]
      }
    } catch (error) {
      console.error('Error in Groq chat:', error)
      throw new Error(error instanceof Error ? error.message : 'Unknown error in Groq chat')
    }
  }
} 