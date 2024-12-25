import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

if (!process.env.XAI_API_KEY) {
  throw new Error('XAI_API_KEY is required');
}

export class XAIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1'
    });
  }

  async chat({ 
    messages,
    temperature = 0.7,
    maxOutputTokens = 1000,
  }: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxOutputTokens?: number;
  }) {
    try {
      // Convert messages to OpenAI's expected format
      const formattedMessages: ChatCompletionMessageParam[] = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      const response = await this.client.chat.completions.create({
        model: 'grok-2-1212',
        messages: formattedMessages,
        temperature,
        max_tokens: maxOutputTokens,
        stream: false
      });

      return {
        choices: [{
          message: {
            role: 'assistant',
            content: response.choices[0].message.content || ''
          }
        }]
      };
    } catch (error) {
      console.error('X.AI API Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
} 