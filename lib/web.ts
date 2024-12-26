import { load } from 'cheerio'
import { encode } from 'gpt-tokenizer'

interface WebContent {
  url: string
  title: string
  content: string
  timestamp: string
}

export async function scrapeWebContent(url: string): Promise<WebContent> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = load(html)

    // Remove unwanted elements
    $('script, style, noscript, iframe, img, svg, video, audio, [style*="display:none"]').remove()

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled'

    // Extract main content
    const content = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()

    // Truncate content if it's too long (max ~4000 tokens)
    const tokens = encode(content)
    const truncatedContent = tokens.length > 4000 
      ? decode(tokens.slice(0, 4000))
      : content

    return {
      url,
      title,
      content: truncatedContent,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error scraping web content:', error)
    throw new Error(`Failed to scrape content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Simple text chunking for context windows
export function chunkContent(text: string, maxChunkLength: number = 1000): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/)

  let currentChunk = ''
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkLength) {
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim())

  return chunks
}

// Store scraped content in memory (you might want to use a proper database in production)
const webContentStore: Map<string, WebContent> = new Map()

export function storeWebContent(content: WebContent): void {
  webContentStore.set(content.url, content)
}

export function getStoredContent(url: string): WebContent | undefined {
  return webContentStore.get(url)
}

export function getAllStoredContent(): WebContent[] {
  return Array.from(webContentStore.values())
}

export function clearStoredContent(): void {
  webContentStore.clear()
} 