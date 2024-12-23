'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Podcast, Plus, X, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { LanguageSelector, type Language } from '@/components/language-selector'
import { StyleSelector, type CopywritingStyle } from '@/components/style-selector'
import { ToneSelector, type WritingTone } from '@/components/tone-selector'
import { PlatformSelector, type PlatformType } from '@/components/platform-selector'
import { ModelSelector, type ModelType } from '@/components/model-selector'
import type { Session, Translations } from "@/lib/types"
import { translations } from "@/lib/translations"
import { ThemeToggle } from '@/components/theme-toggle'

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
  translations: any
  onLanguageChange: (language: Language) => void
  onStyleChange: (style: CopywritingStyle) => void
  onToneChange: (tone: WritingTone) => void
  onPlatformChange: (platforms: PlatformType[]) => void
  onModelChange: (model: ModelType) => void
  onSearchChange: (query: string) => void
  onCreateNewSession: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string, e?: React.MouseEvent) => void | Promise<void>
  showThemeToggle?: boolean
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
  showThemeToggle = false
}: SidebarProps) {
  return (
    <div className={cn(
      "relative transition-[width] duration-200 ease-in-out",
      isSidebarOpen ? "w-80" : "w-0"
    )}>
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 bg-background border-r transform transition-all duration-200 ease-in-out md:relative",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Settings</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={onModelChange}
              />
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <PlatformSelector
                selectedPlatforms={selectedPlatforms}
                onPlatformChange={onPlatformChange}
              />
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={onLanguageChange}
              />
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleChange={onStyleChange}
              />
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <ToneSelector
                selectedTone={selectedTone}
                onToneChange={onToneChange}
              />
            </div>

            {/* Theme Toggle */}
            {showThemeToggle && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme</label>
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute -right-4 top-1/2 -translate-y-1/2 hidden md:flex",
            "h-8 w-8 rounded-full bg-background border shadow-sm",
          )}
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
} 