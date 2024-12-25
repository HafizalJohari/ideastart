import { create } from 'zustand'
import type { Session, Message } from './types'
import { loadChatSessions, saveChatSession } from './chatStore'
import type { Language } from '@/components/language-selector'
import type { CopywritingStyle } from '@/components/style-selector'
import type { WritingTone } from '@/components/tone-selector'
import type { PlatformType } from '@/components/platform-selector'
import type { ModelType } from '@/components/model-selector'

interface ChatState {
  sessions: Session[]
  currentSessionId: string
  messages: Message[]
  selectedPlatforms: PlatformType[]
  selectedLanguage: Language
  selectedStyle: CopywritingStyle
  selectedTone: WritingTone
  selectedModel: ModelType
  searchQuery: string
  isPinned: boolean
  isRightSidebarOpen: boolean
  soundEnabled: boolean
  setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => void
  setCurrentSessionId: (id: string) => void
  setMessages: (messages: Message[]) => void
  setSelectedPlatforms: (platforms: PlatformType[]) => void
  setSelectedLanguage: (language: Language) => void
  setSelectedStyle: (style: CopywritingStyle) => void
  setSelectedTone: (tone: WritingTone) => void
  setSelectedModel: (model: ModelType) => void
  setSearchQuery: (query: string) => void
  setIsPinned: (isPinned: boolean) => void
  setIsRightSidebarOpen: (isOpen: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  createNewSession: () => void
  deleteSession: (id: string) => void
  addMessage: (message: Message) => void
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  currentSessionId: '',
  messages: [],
  selectedPlatforms: ['conversation'],
  selectedLanguage: 'en',
  selectedStyle: 'none',
  selectedTone: 'none',
  selectedModel: 'llama-3.3-70b',
  searchQuery: '',
  isPinned: false,
  isRightSidebarOpen: false,
  soundEnabled: true,

  setSessions: (sessions) => set((state) => ({
    sessions: typeof sessions === 'function' ? sessions(state.sessions) : sessions
  })),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setMessages: (messages) => set({ messages }),
  setSelectedPlatforms: (platforms) => set({ selectedPlatforms: platforms }),
  setSelectedLanguage: (language) => set({ selectedLanguage: language }),
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  setSelectedTone: (tone) => set({ selectedTone: tone }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsPinned: (isPinned) => set({ isPinned }),
  setIsRightSidebarOpen: (isOpen) => set({ isRightSidebarOpen: isOpen }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  createNewSession: () => {
    const newSession: Session = {
      id: Date.now().toString(),
      messages: [],
      model: 'llama-3.3-70b',
      platforms: ['conversation'],
      language: 'en',
      style: 'none',
      tone: 'none',
      lastMessage: '',
      timestamp: new Date().toISOString(),
      hasGreeted: false
    }
    set((state) => ({
      sessions: [newSession, ...state.sessions],
      currentSessionId: newSession.id
    }))
    saveChatSession(newSession)
  },

  deleteSession: async (id) => {
    set((state) => ({
      sessions: state.sessions.filter(s => s.id !== id),
      currentSessionId: state.currentSessionId === id ? '' : state.currentSessionId,
      messages: state.currentSessionId === id ? [] : state.messages
    }))
  },

  addMessage: (message) => {
    set((state) => {
      const newMessages = [...state.messages, message]
      const currentSession = state.sessions.find(s => s.id === state.currentSessionId)
      
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          messages: newMessages,
          lastMessage: message.content,
          timestamp: new Date().toISOString()
        }
        saveChatSession(updatedSession)
        
        return {
          messages: newMessages,
          sessions: state.sessions.map(s => 
            s.id === state.currentSessionId ? updatedSession : s
          )
        }
      }
      
      return { messages: newMessages }
    })
  }
})) 