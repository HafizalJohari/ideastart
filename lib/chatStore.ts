'use client';

import { Language } from '@/components/language-selector'
import { CopywritingStyle } from '@/components/style-selector'
import { WritingTone } from '@/components/tone-selector'
import { PlatformType } from '@/components/platform-selector'
import { ModelType } from '@/components/model-selector'
import { Message, ChatMemory, Session } from '@/lib/types'

const DB_NAME = 'cerebchat-history';
const STORE_NAME = 'chat-sessions';
const MAX_MEMORY_TOKENS = 2000;
const MAX_CONTEXT_LENGTH = 10;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

if (!isBrowser) {
  console.warn('ChatStore is only available in browser environments');
}

// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase> {
  if (!isBrowser) {
    throw new Error('IndexedDB is only available in browser environments');
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('lastMessage', 'lastMessage', { unique: false });
      }
    };
  });
}

// Initialize chat memory
function initializeChatMemory(
  language: Language = 'en',
  style: CopywritingStyle = 'AIDA',
  tone: WritingTone = 'professional',
  platforms: PlatformType[] = [],
  model: ModelType = 'llama-3.3-70b'
): ChatMemory {
  return {
    context: [],
    keyPoints: [],
    userPreferences: {
      language,
      style,
      tone,
      platforms,
      model
    },
    lastInteraction: new Date(),
    memoryTokens: 0,
    maxMemoryTokens: MAX_MEMORY_TOKENS
  };
}

// Update chat memory with new information
function updateChatMemory(memory: ChatMemory, message: Message, keyPoints: string[] = []): ChatMemory {
  const updatedMemory = { ...memory };
  
  // Update context with the latest message
  updatedMemory.context = [...updatedMemory.context, message.content];
  if (updatedMemory.context.length > MAX_CONTEXT_LENGTH) {
    updatedMemory.context = updatedMemory.context.slice(-MAX_CONTEXT_LENGTH);
  }

  // Add new key points
  if (keyPoints.length > 0) {
    updatedMemory.keyPoints = [...updatedMemory.keyPoints, ...keyPoints];
  }

  // Update last interaction time
  updatedMemory.lastInteraction = new Date();

  // Estimate token count (rough estimation)
  updatedMemory.memoryTokens = estimateTokenCount(updatedMemory);

  // Trim memory if it exceeds the token limit
  if (updatedMemory.memoryTokens > updatedMemory.maxMemoryTokens) {
    trimMemory(updatedMemory);
  }

  return updatedMemory;
}

// Estimate token count (rough estimation)
function estimateTokenCount(memory: ChatMemory): number {
  const contextTokens = memory.context.reduce((acc, ctx) => acc + ctx.length / 4, 0);
  const keyPointsTokens = memory.keyPoints.reduce((acc, kp) => acc + kp.length / 4, 0);
  const preferencesTokens = JSON.stringify(memory.userPreferences).length / 4;
  
  return Math.ceil(contextTokens + keyPointsTokens + preferencesTokens);
}

// Trim memory to stay within token limits
function trimMemory(memory: ChatMemory): void {
  while (memory.memoryTokens > memory.maxMemoryTokens && memory.context.length > 0) {
    memory.context.shift(); // Remove oldest context
    memory.memoryTokens = estimateTokenCount(memory);
  }
}

// Extract key points from assistant's response
function extractKeyPoints(content: string): string[] {
  const keyPoints: string[] = [];
  
  // Extract information that seems important
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  for (const sentence of sentences) {
    if (
      sentence.toLowerCase().includes('important') ||
      sentence.toLowerCase().includes('key') ||
      sentence.toLowerCase().includes('must') ||
      sentence.toLowerCase().includes('should') ||
      sentence.toLowerCase().includes('recommend') ||
      sentence.toLowerCase().includes('prefer')
    ) {
      keyPoints.push(sentence.trim());
    }
  }

  return keyPoints;
}

// Save a chat session with memory
export async function saveChatSession(session: Session): Promise<void> {
  try {
    if (!isBrowser) {
      throw new Error('ChatStore is only available in browser environments');
    }

    // Initialize or update memory
    if (!session.memory) {
      session.memory = initializeChatMemory(
        session.language,
        session.style,
        session.tone,
        session.platforms,
        session.model
      );
    }

    // If there are new messages, update memory
    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      const keyPoints = extractKeyPoints(lastMessage.content);
      session.memory = updateChatMemory(session.memory, lastMessage, keyPoints);
    }

    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      // Convert Date objects to ISO strings for storage
      const sessionToStore = {
        ...session,
        timestamp: session.timestamp,
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp
        })),
        memory: session.memory && {
          ...session.memory,
          lastInteraction: session.memory.lastInteraction.toISOString()
        }
      };

      const request = store.put(sessionToStore);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving chat session:', error);
    throw error;
  }
}

// Load chat sessions with memory
export async function loadChatSessions(): Promise<Session[]> {
  try {
    if (!isBrowser) {
      throw new Error('ChatStore is only available in browser environments');
    }

    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Convert ISO strings back to Date objects and sort by timestamp
        const sessions = request.result
          .map(session => ({
            ...session,
            timestamp: session.timestamp,
            messages: session.messages.map((msg: Message & { timestamp: string }) => ({
              ...msg,
              timestamp: msg.timestamp
            })),
            memory: session.memory ? {
              ...session.memory,
              lastInteraction: new Date(session.memory.lastInteraction)
            } : initializeChatMemory(
              session.language,
              session.style,
              session.tone,
              session.platforms,
              session.model
            )
          }))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(sessions);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading chat sessions:', error);
    throw error;
  }
}

// Delete a chat session
export async function deleteChatSession(sessionId: string): Promise<void> {
  try {
    if (!isBrowser) {
      throw new Error('ChatStore is only available in browser environments');
    }

    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw error;
  }
}

// Search chat sessions
export async function searchChatSessions(query: string): Promise<Session[]> {
  try {
    const sessions = await loadChatSessions();
    const searchTerm = query.toLowerCase();

    return sessions.filter(session => {
      // Search in messages
      const hasMatchInMessages = session.messages.some(message =>
        message.content.toLowerCase().includes(searchTerm)
      );

      // Search in last message
      const hasMatchInLastMessage = session.lastMessage
        .toLowerCase()
        .includes(searchTerm);

      return hasMatchInMessages || hasMatchInLastMessage;
    });
  } catch (error) {
    console.error('Error searching chat sessions:', error);
    throw error;
  }
} 