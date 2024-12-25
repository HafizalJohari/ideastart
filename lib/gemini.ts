import { GoogleGenerativeAI } from "@google/generative-ai";

// Check for API key at initialization and assert its type
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any; // TODO: Add proper type from Google's types

  constructor() {
    // TypeScript now knows GEMINI_API_KEY is definitely a string
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        candidateCount: 1,
      }
    });
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
    temperature = 0.7,
    maxOutputTokens = 1000,
  }: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxOutputTokens?: number;
  }) {
    try {
      // Get the system message and user message
      const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
      const userMessage = messages.find(msg => msg.role === 'user')?.content || '';

      // Extract platforms from system message
      const platformsMatch = systemMessage.match(/Please generate content optimized for the following platforms:\n([\s\S]*?)\n\nWhen/);
      const platforms = platformsMatch 
        ? platformsMatch[1].split('\n').map(p => p.trim())
        : ['conversation'];

      // Combine system instructions with user message
      const prompt = systemMessage 
        ? `${systemMessage}\n\nUser: ${userMessage}\n\nPlease format your response with clear platform sections using markdown-style formatting.`
        : `${userMessage}\n\nPlease format your response with clear platform sections using markdown-style formatting.`;

      // Generate content directly instead of using chat
      const result = await this.model.generateContent(prompt);
      const response = this.formatMarkupResponse(
        result.response.text(),
        platforms
      );

      // Return in the expected format
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: response
          }
        }]
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
} 