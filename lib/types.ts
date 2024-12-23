import { Language } from '@/components/language-selector'
import { CopywritingStyle } from '@/components/style-selector'
import { WritingTone } from '@/components/tone-selector'
import { PlatformType } from '@/components/platform-selector'
import { ModelType } from '@/components/model-selector'

export interface Message {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: string
  imageUrl?: string
}

export interface ChatMemory {
  context: string[]
  keyPoints: string[]
  userPreferences: {
    language: Language
    style?: CopywritingStyle | undefined
    tone?: WritingTone | undefined
    platforms: PlatformType[]
    model: ModelType
  }
  lastInteraction: Date
  memoryTokens: number
  maxMemoryTokens: number
}

export interface Session {
  id: string
  messages: Message[]
  model: ModelType
  platforms: PlatformType[]
  language: Language
  style: CopywritingStyle
  tone: WritingTone
  lastMessage: string
  timestamp: string
  hasGreeted: boolean
  memory?: ChatMemory
}

export interface ChatState {
  sessions: Session[]
  currentSessionId: string | null
  isLoading: boolean
  error: string | null
}

export interface Translations {
  chatHistory: string
  searchChats: string
  selectStyle: string
  selectTone: string
  selectPlatforms: string
  selectModel: string
  newChat: string
  send: string
  stop: string
  regenerate: string
  clearChat: string
  language: string
  english: string
  malay: string
  copyToClipboard: string
  copied: string
  deleteChat: string
  confirmDelete: string
  yes: string
  no: string
  noChats: string
  noResults: string
  clearSearch: string
  close: string
  settings: string
  hideSettings: string
  showSettings: string
  theme: string
  light: string
  dark: string
  system: string
  model: string
  content: string
  aiModel: string
  voiceInput: string
  createImage: string
  helpWrite: string
  surpriseMe: string
  makePlan: string
  whatHelp: string
  [key: string]: string
} 