import { ModelType } from '@/components/model-selector'
import { Language } from '@/components/language-selector'
import { CopywritingStyle } from '@/components/style-selector'
import { WritingTone } from '@/components/tone-selector'
import { PlatformType } from '@/components/platform-selector'

export interface Message {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: string
  error?: boolean
}

export interface Session {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  model?: ModelType
  language?: Language
  style?: CopywritingStyle
  tone?: WritingTone
  platforms?: PlatformType[]
  lastMessage?: string
  lastMessageTimestamp?: string
}

export interface ChatMemory {
  messages: Message[]
  context?: string
  summary?: string
}

export interface UserPersona {
  id: string
  name: string
  role: string
  industry?: string
  interests?: string[]
  tone?: string
  background?: string
  goals?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ChatState {
  messages: Message[]
  context?: string
  loading: boolean
  error?: string
  personas: UserPersona[]
  activePersonaId: string | null
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
  typeMessage: string
  [key: string]: string
} 