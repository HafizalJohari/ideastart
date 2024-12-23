import Anthropic from '@anthropic-ai/sdk'

export class AnthropicClient {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    })
  }

  async chat({ messages }: { messages: { role: string; content: string }[] }) {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      })

      // Extract text content from the response
      const content = response.content.find(block => block.type === 'text')
      if (!content || content.type !== 'text') {
        throw new Error('No text content in response')
      }

      return {
        choices: [
          {
            message: {
              content: content.text
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