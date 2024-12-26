import { load } from 'cheerio'
import { encode } from 'gpt-tokenizer'

interface WebContent {
  url: string
  title: string
  content: string
  timestamp: string
}

// Helper function to decode tokens back to text
function decodeTokens(tokens: number[]): string {
  // Simple implementation - in production you might want to use a proper decoder
  return tokens.map(token => String.fromCharCode(token)).join('')
}

// Add debug logging for web scraping
function logWebDebug(message: string, data?: any) {
  console.log(`[Web Scraping Debug] ${message}`, data ? data : '')
}

export async function scrapeWebContent(url: string): Promise<WebContent> {
  try {
    logWebDebug('Starting web scraping for URL:', url)

    const response = await fetch(url)
    if (!response.ok) {
      const error = `Failed to fetch URL: ${response.statusText}`
      logWebDebug('Fetch failed:', { url, status: response.status, statusText: response.statusText })
      throw new Error(error)
    }

    logWebDebug('Successfully fetched URL:', { url, status: response.status })
    const html = await response.text()
    logWebDebug('Retrieved HTML content:', { url, htmlLength: html.length })

    const $ = load(html)
    logWebDebug('Loaded HTML with Cheerio')

    // Remove unwanted elements
    $('script, style, noscript, iframe, img, svg, video, audio, [style*="display:none"]').remove()
    logWebDebug('Removed unwanted elements from HTML')

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled'
    logWebDebug('Extracted title:', { url, title })

    // Extract main content
    const content = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
    
    logWebDebug('Extracted main content:', { 
      url, 
      contentLength: content.length,
      firstChars: content.substring(0, 100) + '...'
    })

    // Truncate content if it's too long
    const tokens = encode(content)
    logWebDebug('Tokenized content:', { 
      url, 
      tokenCount: tokens.length 
    })

    const truncatedContent = tokens.length > 4000 
      ? content.slice(0, 4000)
      : content

    if (tokens.length > 4000) {
      logWebDebug('Content truncated:', { 
        url, 
        originalLength: content.length, 
        truncatedLength: truncatedContent.length 
      })
    }

    const webContent = {
      url,
      title,
      content: truncatedContent,
      timestamp: new Date().toISOString()
    }

    logWebDebug('Successfully scraped web content:', { 
      url,
      titleLength: title.length,
      contentLength: truncatedContent.length,
      timestamp: webContent.timestamp
    })

    return webContent
  } catch (error) {
    console.error('[Web Scraping Error] Error scraping web content:', error)
    logWebDebug('Scraping failed:', {
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
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