import Anthropic from '@anthropic-ai/sdk'

type Role = 'user' | 'assistant'

export class AnthropicClient {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    })
  }

  async chat({ messages }: { messages: { role: string; content: string }[] }) {
    try {
      // Format messages for Claude
      const formattedMessages = messages.map(msg => ({
        role: (msg.role === 'system' ? 'assistant' : msg.role === 'user' ? 'user' : 'assistant') as Role,
        content: msg.content.replace(/<<HUMAN_CONVERSATION_START>>/g, '')
      }))

      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: formattedMessages,
        temperature: 0.7
      })

      // Extract text content from the response
      const content = response.content.find(block => block.type === 'text')
      if (!content || content.type !== 'text') {
        throw new Error('No text content in response')
      }

      // Clean up any remaining markers in the response
      const cleanedContent = content.text.replace(/<<HUMAN_CONVERSATION_START>>/g, '')

      return {
        choices: [
          {
            message: {
              content: cleanedContent
            }
          }
        ]
      }
    } catch (error) {
      console.error('Error in Anthropic chat:', error)
      throw error
    }
  }
}