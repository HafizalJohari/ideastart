import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModelType } from '@/components/model-selector'
import type { Language } from '@/components/language-selector'
import type { CopywritingStyle } from '@/components/style-selector'
import type { WritingTone } from '@/components/tone-selector'
import type { PlatformType } from '@/components/platform-selector'
import type { Message, Session, UserPersona } from '@/lib/types'
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
  loading: boolean
  error: string | undefined
  personas: UserPersona[]
  activePersonaId: string | null

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

  // Persona management
  setPersonas: (personas: UserPersona[]) => void
  setActivePersonaId: (id: string | null) => void
  addPersona: (persona: Omit<UserPersona, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => void
  updatePersona: (id: string, updates: Partial<UserPersona>) => void
  deletePersona: (id: string) => void

  // Migration function for language code
  migrateLanguageCode: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [] as Session[],
      currentSessionId: '',
      messages: [] as Message[],
      selectedModel: 'llama-3.3-70b',
      selectedLanguage: 'en',
      selectedStyle: 'none',
      selectedTone: 'none',
      selectedPlatforms: ['conversation'] as PlatformType[],
      searchQuery: '',
      isPinned: false,
      isRightSidebarOpen: false,
      soundEnabled: true,
      loading: false,
      error: undefined,
      personas: [] as UserPersona[],
      activePersonaId: null,

      // Migration function for language code
      migrateLanguageCode: () => {
        const { sessions } = get()
        const updatedSessions = sessions.map(session => ({
          ...session,
          language: session.language === 'ms' ? 'ms' : session.language
        })) as Session[]
        set({ 
          sessions: updatedSessions,
          selectedLanguage: get().selectedLanguage === 'ms' ? 'ms' : get().selectedLanguage
        })
      },

      // Basic setters
      setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => 
        set((state) => ({
          sessions: typeof sessions === 'function' ? sessions(state.sessions) : sessions
        })),
      setCurrentSessionId: (id: string) => set({ currentSessionId: id }),
      setMessages: (messages: Message[]) => set({ messages }),
      setSelectedModel: (model: ModelType) => set({ selectedModel: model }),
      setSelectedLanguage: (language: Language) => set({ selectedLanguage: language }),
      setSelectedStyle: (style: CopywritingStyle) => set({ selectedStyle: style }),
      setSelectedTone: (tone: WritingTone) => set({ selectedTone: tone }),
      setSelectedPlatforms: (platforms: PlatformType[]) => set({ selectedPlatforms: platforms }),
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setIsPinned: (isPinned: boolean) => set({ isPinned }),
      setIsRightSidebarOpen: (isOpen: boolean) => set({ isRightSidebarOpen: isOpen }),
      setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),

      // Chat memory actions
      addMessage: (message: Message) => {
        const { currentSessionId, messages, sessions } = get()
        const newMessages = [...(messages || []), message]
        
        // Update messages in state and memory
        set({ messages: newMessages })
        chatMemory.save(currentSessionId, newMessages)

        // Update session with last message info
        if (currentSessionId) {
          const updatedSessions = (sessions || []).map(session => {
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

      loadSessionMessages: (sessionId: string) => {
        const messages = chatMemory.load(sessionId)
        set({ messages: messages || [], currentSessionId: sessionId })
      },

      createNewSession: () => {
        const { sessions } = get()
        const newSession: Session = {
          id: crypto.randomUUID(),
          name: `Chat ${(sessions || []).length + 1}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set({
          sessions: [newSession, ...(sessions || [])],
          currentSessionId: newSession.id,
          messages: []
        })
      },

      deleteSession: (id: string) => {
        const { sessions, currentSessionId } = get()
        const currentSessions = sessions || []
        const newSessions = currentSessions.filter(s => s.id !== id)
        chatMemory.clear(id)
        
        // If deleting current session, switch to the first available session or create a new one
        if (id === currentSessionId) {
          if (newSessions.length > 0) {
            const messages = chatMemory.load(newSessions[0].id)
            set({
              sessions: newSessions,
              currentSessionId: newSessions[0].id,
              messages: messages || []
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
      },

      // Persona management actions
      setPersonas: (personas: UserPersona[]) => set({ personas }),
      setActivePersonaId: (id: string | null) => set({ activePersonaId: id }),
      
      addPersona: (personaData) => {
        const newPersona: UserPersona = {
          ...personaData,
          id: crypto.randomUUID(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set((state) => ({
          personas: [...(state.personas || []), newPersona],
          activePersonaId: newPersona.id
        }))
      },

      updatePersona: (id: string, updates: Partial<UserPersona>) => {
        set((state) => ({
          personas: (state.personas || []).map((persona) =>
            persona.id === id
              ? { ...persona, ...updates, updatedAt: new Date().toISOString() }
              : persona
          )
        }))
      },

      deletePersona: (id: string) => {
        set((state) => ({
          personas: (state.personas || []).filter((persona) => persona.id !== id),
          activePersonaId: state.activePersonaId === id ? null : state.activePersonaId
        }))
      }
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        sessions: state.sessions || [],
        currentSessionId: state.currentSessionId,
        selectedModel: state.selectedModel,
        selectedLanguage: state.selectedLanguage,
        selectedStyle: state.selectedStyle,
        selectedTone: state.selectedTone,
        selectedPlatforms: state.selectedPlatforms,
        soundEnabled: state.soundEnabled,
        personas: state.personas || [],
        activePersonaId: state.activePersonaId
      })
    }
  )
) 