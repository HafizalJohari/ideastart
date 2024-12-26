import { encode } from 'gpt-tokenizer'
import { scrapeWebContent, chunkContent, storeWebContent, getStoredContent, getAllStoredContent } from './web'

interface RAGContext {
  context: string
  sources: string[]
}

export async function generateRAGContext(
  query: string,
  urls: string[],
  maxTokens: number = 2000
): Promise<RAGContext> {
  try {
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

    // Chunk all content
    const allChunks = contents.flatMap(content => 
      chunkContent(content.content).map(chunk => ({
        chunk,
        url: content.url,
        title: content.title
      }))
    )

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

    return {
      context: context.trim(),
      sources: Array.from(usedSources)
    }
  } catch (error) {
    console.error('Error generating RAG context:', error)
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