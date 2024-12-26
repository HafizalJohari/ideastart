import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModelType } from '@/components/model-selector'
import type { Language } from '@/components/language-selector'
import type { CopywritingStyle } from '@/components/style-selector'
import type { WritingTone } from '@/components/tone-selector'
import type { PlatformType } from '@/components/platform-selector'
import type { Message, Session } from '@/lib/types'
import { chatMemory } from '@/lib/chatMemory'

interface ChatState {
  // Session management
  sessions: Session[]
  currentSessionId: string
  messages: Message[]
  
  // Settings
  selectedModel: ModelType
  selectedLanguage: Language
  selectedStyle: CopywritingStyle
  selectedTone: WritingTone
  selectedPlatforms: PlatformType[]
  searchQuery: string
  isPinned: boolean
  isRightSidebarOpen: boolean
  soundEnabled: boolean

  // Actions
  setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => void
  setCurrentSessionId: (id: string) => void
  setMessages: (messages: Message[]) => void
  setSelectedModel: (model: ModelType) => void
  setSelectedLanguage: (language: Language) => void
  setSelectedStyle: (style: CopywritingStyle) => void
  setSelectedTone: (tone: WritingTone) => void
  setSelectedPlatforms: (platforms: PlatformType[]) => void
  setSearchQuery: (query: string) => void
  setIsPinned: (isPinned: boolean) => void
  setIsRightSidebarOpen: (isOpen: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  
  // Chat memory actions
  addMessage: (message: Message) => void
  clearMessages: () => void
  loadSessionMessages: (sessionId: string) => void
  createNewSession: () => void
  deleteSession: (id: string) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      currentSessionId: '',
      messages: [],
      selectedModel: 'llama-3.3-70b',
      selectedLanguage: 'en',
      selectedStyle: 'none',
      selectedTone: 'none',
      selectedPlatforms: ['conversation'],
      searchQuery: '',
      isPinned: false,
      isRightSidebarOpen: false,
      soundEnabled: true,

      // Basic setters
      setSessions: (sessions) => set((state) => ({
        sessions: typeof sessions === 'function' ? sessions(state.sessions) : sessions
      })),
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
      setMessages: (messages) => set({ messages }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setSelectedLanguage: (language) => set({ selectedLanguage: language }),
      setSelectedStyle: (style) => set({ selectedStyle: style }),
      setSelectedTone: (tone) => set({ selectedTone: tone }),
      setSelectedPlatforms: (platforms) => set({ selectedPlatforms: platforms }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setIsPinned: (isPinned) => set({ isPinned }),
      setIsRightSidebarOpen: (isOpen) => set({ isRightSidebarOpen: isOpen }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      // Chat memory actions
      addMessage: (message) => {
        const { currentSessionId, messages, sessions } = get()
        const newMessages = [...messages, message]
        
        // Update messages in state and memory
        set({ messages: newMessages })
        chatMemory.save(currentSessionId, newMessages)

        // Update session with last message info
        if (currentSessionId) {
          const updatedSessions = sessions.map(session => {
            if (session.id === currentSessionId) {
              return {
                ...session,
                lastMessage: message.content,
                lastMessageTimestamp: message.timestamp,
                updatedAt: new Date().toISOString()
              }
            }
            return session
          })
          set({ sessions: updatedSessions })
        }
      },

      clearMessages: () => {
        const { currentSessionId } = get()
        set({ messages: [] })
        chatMemory.clear(currentSessionId)
      },

      loadSessionMessages: (sessionId) => {
        const messages = chatMemory.load(sessionId)
        set({ messages, currentSessionId: sessionId })
      },

      createNewSession: () => {
        const { sessions } = get()
        const newSession: Session = {
          id: crypto.randomUUID(),
          name: `Chat ${sessions.length + 1}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set({
          sessions: [newSession, ...sessions],
          currentSessionId: newSession.id,
          messages: []
        })
      },

      deleteSession: (id) => {
        const { sessions, currentSessionId } = get()
        const newSessions = sessions.filter(s => s.id !== id)
        chatMemory.clear(id)
        
        // If deleting current session, switch to the first available session or create a new one
        if (id === currentSessionId) {
          if (newSessions.length > 0) {
            const messages = chatMemory.load(newSessions[0].id)
            set({
              sessions: newSessions,
              currentSessionId: newSessions[0].id,
              messages
            })
          } else {
            const newSession: Session = {
              id: crypto.randomUUID(),
              name: 'Chat 1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            set({
              sessions: [newSession],
              currentSessionId: newSession.id,
              messages: []
            })
          }
        } else {
          set({ sessions: newSessions })
        }
      }
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        selectedModel: state.selectedModel,
        selectedLanguage: state.selectedLanguage,
        selectedStyle: state.selectedStyle,
        selectedTone: state.selectedTone,
        selectedPlatforms: state.selectedPlatforms,
        soundEnabled: state.soundEnabled
      })
    }
  )
) 