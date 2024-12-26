import { Message } from '@/lib/types'

const CHAT_MEMORY_KEY = 'chat_memory'
const MAX_MESSAGES_PER_SESSION = 100

interface ChatMemorySession {
  id: string
  messages: Message[]
  lastUpdated: number
}

interface ChatMemoryStore {
  [sessionId: string]: ChatMemorySession
}

// Safe localStorage access
const getLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage
  }
  return null
}

// Load chat memory from localStorage
export const loadChatMemory = (sessionId: string): Message[] => {
  try {
    const storage = getLocalStorage()
    if (!storage) return []
    
    const store = JSON.parse(storage.getItem(CHAT_MEMORY_KEY) || '{}') as ChatMemoryStore
    return store[sessionId]?.messages || []
  } catch (error) {
    console.error('Error loading chat memory:', error)
    return []
  }
}

// Save messages to chat memory
export const saveChatMemory = (sessionId: string, messages: Message[]) => {
  try {
    const storage = getLocalStorage()
    if (!storage) return
    
    const store = JSON.parse(storage.getItem(CHAT_MEMORY_KEY) || '{}') as ChatMemoryStore
    
    // Trim messages if they exceed the maximum
    const trimmedMessages = messages.slice(-MAX_MESSAGES_PER_SESSION)
    
    store[sessionId] = {
      id: sessionId,
      messages: trimmedMessages,
      lastUpdated: Date.now()
    }
    
    storage.setItem(CHAT_MEMORY_KEY, JSON.stringify(store))
  } catch (error) {
    console.error('Error saving chat memory:', error)
  }
}

// Clear chat memory for a session
export const clearChatMemory = (sessionId: string) => {
  try {
    const storage = getLocalStorage()
    if (!storage) return
    
    const store = JSON.parse(storage.getItem(CHAT_MEMORY_KEY) || '{}') as ChatMemoryStore
    delete store[sessionId]
    storage.setItem(CHAT_MEMORY_KEY, JSON.stringify(store))
  } catch (error) {
    console.error('Error clearing chat memory:', error)
  }
}

// Get summary of chat memory
export const getChatMemorySummary = (sessionId: string): string => {
  const messages = loadChatMemory(sessionId)
  if (messages.length === 0) return ''

  const lastMessages = messages.slice(-3) // Get last 3 messages for summary
  return lastMessages
    .map(msg => `${msg.role}: ${msg.content.slice(0, 50)}...`)
    .join('\n')
}

// Export memory management utilities
export const chatMemory = {
  load: loadChatMemory,
  save: saveChatMemory,
  clear: clearChatMemory,
  getSummary: getChatMemorySummary
} 