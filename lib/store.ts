import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, Message } from '@/lib/types'
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

  // Actions
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
  
  // Complex actions
  createNewSession: () => void
  deleteSession: (id: string) => void
  addMessage: (message: Message) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
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
      isRightSidebarOpen: true,

      // Simple actions
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

      // Complex actions
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
          timestamp: new Date(),
          hasGreeted: false
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
          messages: [],
          selectedPlatforms: ['conversation'],
          selectedLanguage: 'en',
          selectedStyle: 'none',
          selectedTone: 'none',
          selectedModel: 'llama-3.3-70b'
        }))
      },

      deleteSession: (id) => {
        const { currentSessionId, createNewSession } = get()
        
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== id)
        }))

        if (id === currentSessionId) {
          createNewSession()
        }
      },

      addMessage: (message) => {
        set((state) => {
          const updatedMessages = [...state.messages, message]
          
          // Update the current session
          const updatedSessions = state.sessions.map(session => {
            if (session.id === state.currentSessionId) {
              return {
                ...session,
                messages: updatedMessages,
                lastMessage: message.content,
                timestamp: new Date()
              }
            }
            return session
          })

          return {
            messages: updatedMessages,
            sessions: updatedSessions
          }
        })
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        messages: state.messages,
        selectedModel: state.selectedModel,
        isPinned: state.isPinned
      })
    }
  )
) 