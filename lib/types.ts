import { PlatformType } from '@/components/platform-selector'
import { Language } from '@/components/language-selector'
import { CopywritingStyle } from '@/components/style-selector'
import { WritingTone } from '@/components/tone-selector'
import { ModelType } from '@/components/model-selector'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  platforms?: PlatformType[]
  style?: CopywritingStyle
  tone?: WritingTone
  model?: ModelType
  imageUrl?: string
  error?: boolean
  sources?: string[]
}

export interface Session {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  language?: Language
  model?: ModelType
  platforms?: PlatformType[]
  style?: CopywritingStyle
  tone?: WritingTone
  lastMessage?: string
}

export interface ChatState {
  messages: Message[]
  sessions: Session[]
  currentSessionId: string | null
  selectedModel: ModelType
  selectedLanguage: Language
  selectedStyle: CopywritingStyle
  selectedTone: WritingTone
  selectedPlatforms: PlatformType[]
  searchQuery: string
  isPinned: boolean
  isRightSidebarOpen: boolean
  soundEnabled: boolean
}

export interface ChatMemory {
  messages: Message[]
  context?: string
}

export interface UserPersona {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface ProjectFile {
  id: string
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface ProjectFolder {
  id: string
  name: string
  files: ProjectFile[]
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  instructions?: string
  folders: ProjectFolder[]
  createdAt: string
  updatedAt: string
  allowFileAccess?: boolean
}

export interface Translations {
  // Chat interface
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
  deleteChat: string
  clearChat: string
  typeMessage: string
  
  // Settings
  settings: string
  language: string
  model: string
  soundEnabled: string
  darkMode: string
  
  // Quick actions
  surpriseMe: string
  makePlan: string
  generateContent: string
  
  // File handling
  uploadFile: string
  removeFile: string
  addFile: string
  deleteFile: string
  
  // Project management
  projects: string
  addProject: string
  editProject: string
  deleteProject: string
  addFolder: string
  deleteFolder: string
  
  // Persona management
  personas: string
  addPersona: string
  editPersona: string
  deletePersona: string
  
  // Status messages
  noChatsFound: string
  noChatsYet: string
  startNewChat: string
  loading: string
  error: string
  
  // Navigation
  back: string
  next: string
  
  [key: string]: string // Allow any string key for additional translations
} 