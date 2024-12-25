'use client';

import type { Session } from './types'

const STORAGE_KEY = 'chat_sessions'

export async function loadChatSessions(): Promise<Session[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading chat sessions:', error)
    return []
  }
}

export async function saveChatSession(session: Session): Promise<void> {
  try {
    const sessions = await loadChatSessions()
    const existingIndex = sessions.findIndex(s => s.id === session.id)
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.unshift(session)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch (error) {
    console.error('Error saving chat session:', error)
  }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  try {
    const sessions = await loadChatSessions()
    const filtered = sessions.filter(s => s.id !== sessionId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting chat session:', error)
  }
}

export async function searchChatSessions(query: string): Promise<Session[]> {
  try {
    const sessions = await loadChatSessions()
    if (!query) return sessions
    
    const lowerQuery = query.toLowerCase()
    return sessions.filter(session => 
      session.lastMessage?.toLowerCase().includes(lowerQuery) ||
      session.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      )
    )
  } catch (error) {
    console.error('Error searching chat sessions:', error)
    return []
  }
} 