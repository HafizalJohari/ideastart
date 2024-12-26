'use client';

import type { Session, Message } from '@/lib/types'
import { chatMemory } from '@/lib/chatMemory'

// Safe localStorage access
const getLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage
  }
  return null
}

// Load chat sessions from localStorage
export const loadChatSessions = (): Session[] => {
  try {
    const storage = getLocalStorage()
    if (!storage) return []
    
    const sessions = JSON.parse(storage.getItem('chat_sessions') || '[]') as Session[]
    return sessions
  } catch (error) {
    console.error('Error loading chat sessions:', error)
    return []
  }
}

// Save chat session to localStorage
export const saveChatSession = (session: Session) => {
  try {
    const storage = getLocalStorage()
    if (!storage) return
    
    const sessions = loadChatSessions()
    const existingIndex = sessions.findIndex(s => s.id === session.id)
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.unshift(session)
    }
    
    storage.setItem('chat_sessions', JSON.stringify(sessions))
  } catch (error) {
    console.error('Error saving chat session:', error)
  }
}

// Delete chat session from localStorage
export const deleteChatSession = (sessionId: string) => {
  try {
    const storage = getLocalStorage()
    if (!storage) return
    
    const sessions = loadChatSessions()
    const updatedSessions = sessions.filter(s => s.id !== sessionId)
    storage.setItem('chat_sessions', JSON.stringify(updatedSessions))
    
    // Also clear the chat memory for this session
    chatMemory.clear(sessionId)
  } catch (error) {
    console.error('Error deleting chat session:', error)
  }
}

// Search chat sessions
export const searchChatSessions = (query: string): Session[] => {
  try {
    const sessions = loadChatSessions()
    if (!query) return sessions

    return sessions.filter(session => {
      // Search in session name
      if (session.name.toLowerCase().includes(query.toLowerCase())) {
        return true
      }
      
      // Search in session's last message
      if (session.lastMessage?.toLowerCase().includes(query.toLowerCase())) {
        return true
      }
      
      // Search in chat memory
      const messages = chatMemory.load(session.id)
      return messages.some(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      )
    })
  } catch (error) {
    console.error('Error searching chat sessions:', error)
    return []
  }
} 