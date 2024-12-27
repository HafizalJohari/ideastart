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
  soundEnabled: boolean
  onSoundToggle: () => void
  useMarkdown: boolean
  onMarkdownToggle: () => void
  debugMode?: boolean
  onDebugModeToggle?: () => void
  onExportChats?: () => void
  onImportChats?: () => void
  onResetSettings?: () => void
  onClearAllData?: () => void
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
  showThemeToggle = false,
  soundEnabled,
  onSoundToggle,
  useMarkdown,
  onMarkdownToggle,
  debugMode = false,
  onDebugModeToggle,
  onExportChats,
  onImportChats,
  onResetSettings,
  onClearAllData,
}: SidebarProps) {
  React.useEffect(() => {
    const header = document.getElementById('sidebar-header')
    if (header) {
      const updateHeaderHeight = () => {
        const height = header.offsetHeight
        document.documentElement.style.setProperty('--header-height', `${height}px`)
      }

      // Initial measurement
      updateHeaderHeight()

      // Setup resize observer
      const resizeObserver = new ResizeObserver(updateHeaderHeight)
      resizeObserver.observe(header)

      return () => {
        resizeObserver.disconnect()
        document.documentElement.style.removeProperty('--header-height')
      }
    }
  }, [])

  return (
    <div className={cn(
      "relative transition-[width] duration-200 ease-in-out",
      isSidebarOpen ? "w-80" : "w-0"
    )}>
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 bg-background border-r transform transition-all duration-200 ease-in-out md:relative flex flex-col h-full",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center p-4 border-b shrink-0" id="sidebar-header">
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
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

            {/* Interface Section */}
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-4">Interface</h2>
              
              <div className="space-y-4">
                {/* Sound Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                    <span className="text-sm">Sound Notifications</span>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={onSoundToggle}
                    aria-label="Toggle sound notifications"
                  />
                </div>

                {/* Markdown Formatting */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm">Markdown Formatting</span>
                      <span className="text-xs text-muted-foreground">Enable rich text formatting</span>
                    </div>
                  </div>
                  <Switch
                    checked={useMarkdown}
                    onCheckedChange={onMarkdownToggle}
                    aria-label="Toggle markdown formatting"
                  />
                </div>

                {/* Theme Toggle */}
                {showThemeToggle && (
                  <ThemeToggle />
                )}
              </div>
            </div>

            {/* Data Section */}
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-4">Data</h2>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onExportChats}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Chats
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onImportChats}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Chats
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onResetSettings}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Settings
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={onClearAllData}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </div>
            </div>

            {/* Advanced Section */}
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-4">Advanced</h2>
              
              <div className="space-y-4">
                {/* Debug Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm">Debug Mode</span>
                      <span className="text-xs text-muted-foreground">Show technical information</span>
                    </div>
                  </div>
                  <Switch
                    checked={debugMode}
                    onCheckedChange={onDebugModeToggle}
                    aria-label="Toggle debug mode"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute -right-5 hidden md:flex",
            "top-[calc(var(--header-height,_4rem)_+_0.5rem)]",
            "h-8 w-8 rounded-full bg-background border shadow-md",
            "hover:bg-accent hover:border-border",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          )}
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
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