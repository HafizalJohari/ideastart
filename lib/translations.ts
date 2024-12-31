import type { Translations } from '@/lib/types'

export const translations: Record<string, Translations> = {
  en: {
    // Chat interface
    chatHistory: 'Chat History',
    searchChats: 'Search chats...',
    selectStyle: 'Select style',
    selectTone: 'Select tone',
    selectPlatforms: 'Select platforms',
    selectModel: 'Select model',
    newChat: 'New Chat',
    send: 'Send',
    stop: 'Stop',
    regenerate: 'Regenerate',
    deleteChat: 'Delete chat',
    clearChat: 'Clear chat',
    typeMessage: 'Type your message...',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    model: 'Model',
    soundEnabled: 'Sound enabled',
    darkMode: 'Dark mode',
    
    // Quick actions
    surpriseMe: 'Surprise me',
    makePlan: 'Make a plan',
    generateContent: 'Generate content',
    
    // File handling
    uploadFile: 'Upload file',
    removeFile: 'Remove file',
    addFile: 'Add file',
    deleteFile: 'Delete file',
    
    // Project management
    projects: 'Projects',
    addProject: 'Add project',
    editProject: 'Edit project',
    deleteProject: 'Delete project',
    addFolder: 'Add folder',
    deleteFolder: 'Delete folder',
    
    // Persona management
    personas: 'Personas',
    addPersona: 'Add persona',
    editPersona: 'Edit persona',
    deletePersona: 'Delete persona',
    
    // Status messages
    noChatsFound: 'No chats found',
    noChatsYet: 'No chats yet',
    startNewChat: 'Start a new chat',
    loading: 'Loading...',
    error: 'An error occurred',
    
    // Navigation
    back: 'Back',
    next: 'Next'
  }
} 