'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Podcast, Plus, X, Search, ChevronLeft, ChevronRight, Volume2, VolumeX, Download, Upload, RefreshCw, Trash2, Bug, FileText } from 'lucide-react'
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

interface SidebarProps {
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
  personas: UserPersona[]
  activePersonaId: string | null
  onPersonaChange: (id: string | null) => void
  onPersonaCreate: (persona: Omit<UserPersona, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) => void
  onPersonaEdit: (persona: UserPersona) => void
  onPersonaDelete: (id: string) => void
}

export function Sidebar({
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
  translations: t,
  onLanguageChange,
  onStyleChange,
  onToneChange,
  onPlatformChange,
  onModelChange,
  onSearchChange,
  onCreateNewSession,
  onSelectSession,
  onDeleteSession,
  personas,
  activePersonaId,
  onPersonaChange,
  onPersonaCreate,
  onPersonaEdit,
  onPersonaDelete
}: SidebarProps) {
  return (
    <div
      className={cn(
        "group/sidebar h-full w-80 flex-col bg-background overflow-hidden border-r",
        !isSidebarOpen && "w-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Ideon Tools</h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {/* Persona Selection */}
          <div className="pb-4 border-b">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Persona</h3>
            <PersonaSelector
              personas={personas}
              activePersonaId={activePersonaId}
              onPersonaChange={onPersonaChange}
              onPersonaCreate={onPersonaCreate}
              onPersonaEdit={onPersonaEdit}
              onPersonaDelete={onPersonaDelete}
            />
          </div>

          {/* Model Selection */}
          <div className="pb-4 border-b">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Model</h3>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
          </div>

          {/* Language Selection */}
          <div className="pb-4 border-b">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Language</h3>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>

          {/* Platform Selection */}
          <div className="pb-4 border-b">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Platforms</h3>
            <PlatformSelector
              selectedPlatforms={selectedPlatforms}
              onPlatformChange={onPlatformChange}
            />
          </div>

          {/* Style Selection */}
          <div className="pb-4 border-b">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Style</h3>
            <StyleSelector
              selectedStyle={selectedStyle}
              onStyleChange={onStyleChange}
            />
          </div>

          {/* Tone Selection */}
          <div className="pb-4 border-b">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Tone</h3>
            <ToneSelector
              selectedTone={selectedTone}
              onToneChange={onToneChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 