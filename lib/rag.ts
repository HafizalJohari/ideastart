import { encode } from 'gpt-tokenizer'
import { scrapeWebContent, chunkContent, storeWebContent, getStoredContent, getAllStoredContent } from './web'

interface RAGContext {
  context: string
  sources: string[]
}

// Add debug logging for RAG process
function logRAGDebug(message: string, data?: any) {
  console.log(`[RAG Debug] ${message}`, data ? data : '')
}

export async function generateRAGContext(
  query: string,
  urls: string[],
  maxTokens: number = 2000
): Promise<RAGContext> {
  try {
    logRAGDebug('Starting RAG context generation for query:', query)
    logRAGDebug('URLs to process:', urls)

    // Fetch and store content from all URLs
    const fetchPromises = urls.map(async (url) => {
      let content = getStoredContent(url)
      if (!content) {
        content = await scrapeWebContent(url)
        storeWebContent(content)
      }
      return content
    })

    const contents = await Promise.all(fetchPromises)

    logRAGDebug('Filtering valid scraped contents')
    const validContents = contents.filter((content): content is NonNullable<typeof content> => content !== null)
    
    logRAGDebug('Processing scraped contents:', {
      totalUrls: urls.length,
      successfulScrapes: validContents.length
    })

    if (validContents.length === 0) {
      logRAGDebug('No valid content was scraped from any URL')
      return { context: '', sources: [] }
    }

    // Chunk all content
    const allChunks = validContents.flatMap(content => 
      chunkContent(content.content).map(chunk => ({
        chunk,
        url: content.url,
        title: content.title
      }))
    )

    logRAGDebug('Total chunks created:', allChunks.length)

    // Simple relevance scoring (you might want to use a proper embedding model in production)
    const scoredChunks = allChunks.map(({ chunk, url, title }) => ({
      chunk,
      url,
      title,
      score: calculateRelevanceScore(query, chunk)
    }))

    // Sort by relevance and select top chunks that fit within token limit
    scoredChunks.sort((a, b) => b.score - a.score)

    let context = ''
    const usedSources = new Set<string>()
    let totalTokens = 0

    for (const { chunk, url, title } of scoredChunks) {
      const chunkTokens = encode(chunk).length
      if (totalTokens + chunkTokens > maxTokens) break

      context += `\n\nFrom ${title} (${url}):\n${chunk}`
      usedSources.add(url)
      totalTokens += chunkTokens
    }

    logRAGDebug('RAG context generation completed:', {
      contextLength: context.length,
      numberOfSources: Array.from(usedSources).length
    })

    return {
      context: context.trim(),
      sources: Array.from(usedSources)
    }
  } catch (error) {
    console.error('[RAG Error] Error in generateRAGContext:', error)
    logRAGDebug('RAG context generation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Failed to generate context: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Simple relevance scoring using keyword matching
// In production, you'd want to use proper embeddings and semantic search
function calculateRelevanceScore(query: string, text: string): number {
  const queryWords = new Set(
    query.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2)
  )

  const textWords = text.toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 2)

  let score = 0
  for (const word of textWords) {
    if (queryWords.has(word)) score++
  }

  return score / textWords.length
}

// Export utility functions
export { scrapeWebContent, storeWebContent, getStoredContent, getAllStoredContent, clearStoredContent } from './web' 