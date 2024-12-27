'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Podcast, Plus, X, Search, ChevronLeft, ChevronRight, Volume2, VolumeX, Download, Upload, RefreshCw, Trash2, Bug, FileText, Bot } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { LanguageSelector, type Language } from '@/components/language-selector'
import { StyleSelector, type CopywritingStyle } from '@/components/style-selector'
import { ToneSelector, type WritingTone } from '@/components/tone-selector'
import { PlatformSelector, type PlatformType } from '@/components/platform-selector'
import { ModelSelector, type ModelType } from '@/components/model-selector'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import type { Session, Translations, UserPersona } from "@/lib/types"
import { translations } from "@/lib/translations"
import { ThemeToggle } from '@/components/theme-toggle'
import { PersonaSelector } from '@/components/persona-selector'

interface ToolsSidebarProps {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  selectedLanguage: Language
  selectedStyle: CopywritingStyle
  selectedTone: WritingTone
  selectedPlatforms: PlatformType[]
  selectedModel: ModelType
  searchQuery: string
  sessions: Session[]
  currentSessionId: string
  translations: Record<string, string>
  onLanguageChange: (language: Language) => void
  onStyleChange: (style: CopywritingStyle) => void
  onToneChange: (tone: WritingTone) => void
  onPlatformChange: (platforms: PlatformType[]) => void
  onModelChange: (model: ModelType) => void
  onSearchChange: (query: string) => void
  onCreateNewSession: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  showThemeToggle?: boolean
  soundEnabled: boolean
  onSoundToggle: () => void
  debugMode: boolean
  onDebugModeToggle: () => void
  onExportChats: () => void
  onImportChats: () => void
  onResetSettings: () => void
  onClearAllData: () => void
  useMarkdown: boolean
  onMarkdownToggle: () => void
  personas: UserPersona[]
  activePersonaId: string | null
  onPersonaChange: (id: string | null) => void
  onPersonaCreate: (persona: Omit<UserPersona, 'id'>) => void
  onPersonaEdit: (persona: UserPersona) => void
  onPersonaDelete: (id: string) => void
}

export function ToolsSidebar({
  isSidebarOpen,
  toggleSidebar,
  selectedLanguage,
  selectedStyle,
  selectedTone,
  selectedPlatforms,
  selectedModel,
  searchQuery,
  sessions,
  currentSessionId,
  translations,
  onLanguageChange,
  onStyleChange,
  onToneChange,
  onPlatformChange,
  onModelChange,
  onSearchChange,
  onCreateNewSession,
  onSelectSession,
  onDeleteSession,
  showThemeToggle,
  soundEnabled,
  onSoundToggle,
  debugMode,
  onDebugModeToggle,
  onExportChats,
  onImportChats,
  onResetSettings,
  onClearAllData,
  useMarkdown,
  onMarkdownToggle,
  personas,
  activePersonaId,
  onPersonaChange,
  onPersonaCreate,
  onPersonaEdit,
  onPersonaDelete
}: ToolsSidebarProps) {
  return (
    <div
      className={cn(
        "group/sidebar relative flex h-full flex-col overflow-hidden border-r bg-background duration-300",
        isSidebarOpen ? "w-80" : "w-0"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <span className="font-semibold">Tools</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Rest of the component */}
    </div>
  )
} 