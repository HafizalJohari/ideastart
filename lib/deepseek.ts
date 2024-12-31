import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

// Check for API key at initialization and assert its type
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY as string;
if (!DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is required');
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export class DeepSeekClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(useBeta: boolean = false) {
    this.baseUrl = useBeta ? 'https://api.deepseek.com/beta' : 'https://api.deepseek.com/v1';
    this.headers = {
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  private formatPlatformResponse(content: string, platform: string): string {
    return `- ${platform}:\n${content}\n`;
  }

  private formatMarkupResponse(text: string, platforms: string[]): string {
    if (platforms.length <= 1) return text;

    // Split response by platform markers if they exist
    const platformSections = text.split(/(?=For \w+:)/);
    
    if (platformSections.length > 1) {
      // Response already has platform sections
      return platformSections.join('\n');
    } else {
      // Create platform sections
      return platforms
        .map(platform => this.formatPlatformResponse(text, platform))
        .join('\n');
    }
  }

  async chat({ 
    
    messages,
    temperature = 1.3,
    maxTokens = 4096,
    platforms = [],
    responseFormat,
    functions,
  }: {
    messages: Array<ChatCompletionMessageParam>;
    temperature?: number;
    maxTokens?: number;
    platforms?: string[];
    responseFormat?: { type: 'json_object' };
    functions?: Array<{
      name: string;
      description?: string;
      parameters: Record<string, any>;
    }>;
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: 'DeepSeek-V3', //deepseek-chat
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature,
          max_tokens: maxTokens,
          response_format: responseFormat,
          functions,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`DeepSeek API error: ${error.message || response.statusText}`);
      }

      const data = await response.json() as DeepSeekResponse;
      const content = data.choices[0]?.message?.content || '';
      
      const formattedContent = platforms.length > 0 
        ? this.formatMarkupResponse(content, platforms)
        : content;

      return {
        choices: [
          {
            message: {
              content: formattedContent,
              role: data.choices[0]?.message?.role || 'assistant'
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error in DeepSeek chat:', error);
      throw error;
    }
  }
} 