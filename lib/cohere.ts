import type { Message } from '@/lib/types'

interface CohereMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface CohereResponse {
  id: string
  finish_reason: 'COMPLETE' | 'STOP_SEQUENCE' | 'MAX_TOKENS' | 'TOOL_CALL' | 'ERROR'
  message: {
    role: 'assistant'
    content: Array<{
      type: 'text'
      text: string
    }>
  }
}

export class CohereClient {
  private apiKey: string
  private apiUrl = 'https://api.cohere.com/v2/chat'

  constructor() {
    const apiKey = process.env.COHERE_API_KEY
    if (!apiKey) {
      throw new Error('COHERE_API_KEY is not set')
    }
    this.apiKey = apiKey
  }

  async chat({ messages }: { messages: Message[] }): Promise<any> {
    try {
      const cohereMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-Name': 'cerebchat'
        },
        body: JSON.stringify({
          model: 'command-r-plus-08-2024',
          messages: cohereMessages,
          stream: false,
          temperature: 0.3,
          max_tokens: 2048
        })
      })

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.statusText}`)
      }

      const data: CohereResponse = await response.json()

      // Format response to match expected structure
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: data.message.content[0].text
          }
        }]
      }
    } catch (error) {
      console.error('Error in Cohere chat:', error)
      throw error
    }
  }
} 