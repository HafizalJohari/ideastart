'use client'

import { useState, type FormEvent, useEffect, useRef } from 'react'
import { Bot, Send, Sparkles, Menu, Plus, Trash2, Podcast, X, Search, ChevronLeft, ChevronRight, Mic, PenLine, Image, Gift, LightbulbIcon, Sliders, Twitch, Badge, Settings, Volume2, Trash, Download, Upload, RefreshCw, Code, FileText, Loader2, ImageIcon, ListChecks, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { loadChatSessions, saveChatSession, deleteChatSession, searchChatSessions } from '@/lib/chatStore'
import { PlatformSelector, type PlatformType, platformData } from '@/components/platform-selector'
import { LanguageSelector, type Language } from '@/components/language-selector'
import { StyleSelector, type CopywritingStyle, copywritingStyles } from '@/components/style-selector'
import { ToneSelector, type WritingTone, writingTones } from '@/components/tone-selector'
import { CopyButton } from '@/components/copy-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ModelSelector, type ModelType, models } from '@/components/model-selector'
import { Sidebar } from '@/components/sidebar'
import type { Message as MessageType, Session, ChatState, ChatMemory, UserPersona } from '@/lib/types'
import { translations } from '@/lib/translations'
import { ChatHistory } from '@/components/chat-history'
import { useChatStore } from '@/lib/store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ExtendedMessage extends Omit<MessageType, 'id' | 'timestamp'> {
  id: string
  timestamp: string
  style?: CopywritingStyle
  tone?: WritingTone
  platforms?: PlatformType[]
  model?: ModelType
  imageUrl?: string
  error?: boolean
  sources?: string[]
}

type ExtendedSession = Session

const t = translations.en // Default to English

function MessageComponent({ message }: { message: ExtendedMessage }) {
  // Split content into platform sections if it contains multiple platforms
  const splitContent = () => {
    if (message.role === 'user') {
      return [{ platform: 'user', content: message.content }]
    }

    if (!message.content) return []

    // Split content by platform sections
    const sections = message.content.split(/\n(?=🐦|💼|👥|📸|🎵|🧵|👻|🎥|🎙️|📧|📝|🎨)/)
    return sections.map(section => {
      const match = section.match(/^(🐦|💼|👥|📸|🎵|🧵|👻|🎥|🎙️|📧|📝|🎨)\s*([^:\n]+)(?:[:|\n])([\s\S]+)/)
      if (match) {
        const [, emoji, platform, content] = match
        return { platform, emoji, content: content.trim() }
      }
      return { platform: 'conversation', content: section.trim() }
    }).filter(section => section.content)
  }

  const sections = splitContent()

  return (
    <div className="space-y-4 py-4">
      {message.role === 'user' ? (
        // User message bubble
        <div className="flex justify-end mb-4">
          <div className="flex gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground max-w-[80%]">
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            <CopyButton value={message.content} />
          </div>
        </div>
      ) : (
        // Assistant message bubbles - one per platform
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-1 flex gap-3 px-4 py-3 rounded-lg bg-muted/50">
                <div className="flex-1 space-y-2">
                  {section.platform !== 'conversation' && (
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                      {section.emoji} {section.platform}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{section.content}</p>
                </div>
                <CopyButton value={section.content} />
              </div>
            </div>
          ))}
          {/* Show image in a separate bubble if it exists */}
          {message.imageUrl && (
            <div className="flex gap-3">
              <div className="flex-1 flex gap-3 px-4 py-3 rounded-lg bg-muted/50">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    🎨 Generated Image
                  </div>
                  <img 
                    src={message.imageUrl} 
                    alt="Generated image"
                    className="rounded-lg w-full max-w-2xl mt-2"
                  />
                </div>
              </div>
            </div>
          )}
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 px-4 text-xs text-muted-foreground">
            {message.model && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5">
                Model: {message.model}
              </span>
            )}
            {message.style && message.style !== 'none' && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5">
                Style: {message.style}
              </span>
            )}
            {message.tone && message.tone !== 'none' && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5">
                Tone: {message.tone}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatInterface() {
  // Local state
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [textareaHeight, setTextareaHeight] = useState('50px')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [webUrls, setWebUrls] = useState<string[]>([])
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [useMarkdown, setUseMarkdown] = useState(true)

  // Global state from Zustand
  const {
    messages,
    sessions,
    currentSessionId,
    selectedModel,
    selectedLanguage,
    selectedStyle,
    selectedTone,
    selectedPlatforms,
    searchQuery,
    isPinned,
    isRightSidebarOpen,
    soundEnabled,
    personas,
    activePersonaId,
    setSessions,
    setCurrentSessionId,
    setMessages,
    setSelectedModel,
    setSelectedLanguage,
    setSelectedStyle,
    setSelectedTone,
    setSelectedPlatforms,
    setSearchQuery,
    setIsPinned,
    setIsRightSidebarOpen,
    setSoundEnabled,
    createNewSession,
    deleteSession,
    addMessage,
    loadSessionMessages,
    addPersona,
    updatePersona,
    deletePersona,
    setActivePersonaId
  } = useChatStore()

  // Function to play notification sound
  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Error playing notification sound:', error)
      })
    }
  }

  type QuickAction = 'create-image' | 'help-write' | 'surprise' | 'make-plan' | 'generate-content'

  const handleQuickAction = (action: QuickAction) => {
    switch (action) {
      case 'create-image':
        setSelectedPlatforms(['imagePrompt'])
        setInput('Generate an image of ')
        break
      case 'help-write':
        setSelectedPlatforms(['conversation'])
        setInput('Help me write ')
        break
      case 'surprise':
        setSelectedPlatforms(['conversation'])
        setInput('Surprise me with something interesting about ')
        break
      case 'make-plan':
        setSelectedPlatforms(['conversation'])
        setInput('Make a plan for ')
        break
      case 'generate-content':
        setSelectedPlatforms(['conversation'])
        setInput('Generate content for ')
        break
    }
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model)
    // Save the preference or update the current session if needed
    if (currentSessionId) {
      const updatedSessions = sessions.map((session: Session) => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            model
          }
        }
        return session
      })
      setSessions(updatedSessions)
    }
  }

  // Load chat memory when component mounts or session changes
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId)
    }
  }, [currentSessionId, loadSessionMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Add user message first
      const userMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: newMessage,
        timestamp: new Date().toISOString(),
        platforms: selectedPlatforms,
        style: selectedStyle,
        tone: selectedTone,
        model: selectedModel
      }
      addMessage(userMessage)

      // Get active persona
      const activePersona = personas.find(p => p.id === activePersonaId)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          platforms: selectedPlatforms,
          language: selectedLanguage,
          style: selectedStyle,
          tone: selectedTone,
          model: selectedModel,
          messages: messages.slice(-10),
          directImageGeneration: selectedPlatforms.length === 1 && selectedPlatforms[0] === 'imagePrompt',
          webUrls: webUrls,
          useMarkdown,
          persona: activePersona // Add persona to the request
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || '',
        timestamp: new Date().toISOString(),
        platforms: selectedPlatforms,
        style: selectedStyle,
        tone: selectedTone,
        model: selectedModel,
        imageUrl: data.imageUrl,
        sources: data.sources
      }

      addMessage(assistantMessage)
      playNotificationSound()

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })

      // Add error message
      const errorMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        error: true
      }

      addMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleNewChat = () => {
    // Clear current session and messages
    setCurrentSessionId('')
    setMessages([])
    setInput('')
    
    // Reset to default settings
    setSelectedPlatforms(['conversation'])
    setSelectedLanguage('en')
    setSelectedStyle('none')
    setSelectedTone('none')
    setSelectedModel('llama-3.3-70b')

    // Reset textarea height
    setTextareaHeight('50px')
    
    // Focus on textarea after clearing
    if (textareaRef.current) {
      textareaRef.current.focus()
    }

    // Create a new session
    const newSession: Session = {
      id: crypto.randomUUID(),
      name: `Chat ${(sessions || []).length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: 'llama-3.3-70b',
      platforms: ['conversation'],
      language: 'en',
      style: 'none',
      tone: 'none'
    }

    // Add new session to sessions list and save it
    setSessions((prev: Session[]) => [newSession, ...(prev || [])])
    setCurrentSessionId(newSession.id)
  }

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsRightSidebarOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsRightSidebarOpen(false)
    }
  }

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId)
  }

  const handleCreateSession = () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      name: `Chat ${(sessions || []).length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: 'llama-3.3-70b',
      platforms: ['conversation'],
      language: 'en',
      style: 'none',
      tone: 'none'
    }
    setSessions((prev: Session[]) => [newSession, ...(prev || [])])
    setCurrentSessionId(newSession.id)
  }

  // Data management functions
  const handleExportChats = () => {
    try {
      const data = {
        sessions,
        messages,
        settings: {
          selectedModel,
          selectedLanguage,
          selectedStyle,
          selectedTone,
          selectedPlatforms,
          soundEnabled
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cerebchat-export-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: 'Success',
        description: 'Chat data exported successfully',
      })
    } catch (error) {
      console.error('Error exporting chats:', error)
      toast({
        title: 'Error',
        description: 'Failed to export chat data',
        variant: 'destructive'
      })
    }
  }

  const handleImportChats = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        const text = await file.text()
        const data = JSON.parse(text)

        // Validate imported data
        if (!data.sessions || !Array.isArray(data.sessions)) {
          throw new Error('Invalid import file format')
        }

        // Import sessions and messages
        setSessions(data.sessions)
        if (data.messages) setMessages(data.messages)

        // Import settings if available
        if (data.settings) {
          setSelectedModel(data.settings.selectedModel || 'llama-3.3-70b')
          setSelectedLanguage(data.settings.selectedLanguage || 'en')
          setSelectedStyle(data.settings.selectedStyle || 'none')
          setSelectedTone(data.settings.selectedTone || 'none')
          setSelectedPlatforms(data.settings.selectedPlatforms || ['conversation'])
          setSoundEnabled(data.settings.soundEnabled ?? true)
        }

        toast({
          title: 'Success',
          description: 'Chat data imported successfully',
        })
      } catch (error) {
        console.error('Error importing chats:', error)
        toast({
          title: 'Error',
          description: 'Failed to import chat data',
          variant: 'destructive'
        })
      }
    }
    input.click()
  }

  const handleResetSettings = () => {
    // Reset all settings to defaults
    setSelectedModel('llama-3.3-70b')
    setSelectedLanguage('en')
    setSelectedStyle('none')
    setSelectedTone('none')
    setSelectedPlatforms(['conversation'])
    setSoundEnabled(true)
    setDebugMode(false)

    toast({
      title: 'Success',
      description: 'Settings reset to defaults',
    })
  }

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      // Clear all data
      setSessions([])
      setMessages([])
      setCurrentSessionId('')
      handleResetSettings()

      // Clear local storage
      localStorage.clear()

      toast({
        title: 'Success',
        description: 'All data cleared successfully',
      })
    }
  }

  // Function to toggle debug mode
  const handleDebugModeToggle = () => {
    setDebugMode(!debugMode)
  }

  // Add URL input handler
  const handleAddUrl = (url: string) => {
    if (url && !webUrls.includes(url)) {
      setWebUrls([...webUrls, url])
    }
  }

  // Add URL removal handler
  const handleRemoveUrl = (urlToRemove: string) => {
    setWebUrls(webUrls.filter(url => url !== urlToRemove))
  }

  // Add URL input component
  const UrlInput = () => (
    <div className="flex flex-col gap-2 p-2 border-t">
      <div className="flex items-center gap-2">
        <Input
          type="url"
          placeholder="Enter URL for context..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const input = e.target as HTMLInputElement
              handleAddUrl(input.value)
              input.value = ''
            }
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowUrlInput(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {webUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {webUrls.map((url, index) => (
            <div
              key={index}
              className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-1"
            >
              <span className="truncate max-w-[200px]">{url}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => handleRemoveUrl(url)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const handlePersonaEdit = (persona: UserPersona) => {
    updatePersona(persona.id, persona)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Audio element for notification sound */}
      <audio ref={audioRef} src="/media/modern_notification_.mp3" />

      {/* Left Sidebar - Settings */}
      <Sidebar
        isSidebarOpen={leftSidebarOpen}
        toggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        selectedLanguage={selectedLanguage}
        selectedStyle={selectedStyle}
        selectedTone={selectedTone}
        selectedPlatforms={selectedPlatforms}
        selectedModel={selectedModel}
        searchQuery={searchQuery}
        sessions={sessions}
        currentSessionId={currentSessionId}
        translations={t}
        onLanguageChange={setSelectedLanguage}
        onStyleChange={setSelectedStyle}
        onToneChange={setSelectedTone}
        onPlatformChange={setSelectedPlatforms}
        onModelChange={handleModelChange}
        onSearchChange={setSearchQuery}
        onCreateNewSession={handleNewChat}
        onSelectSession={setCurrentSessionId}
        onDeleteSession={handleDeleteSession}
        showThemeToggle={true}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        debugMode={debugMode}
        onDebugModeToggle={handleDebugModeToggle}
        onExportChats={handleExportChats}
        onImportChats={handleImportChats}
        onResetSettings={handleResetSettings}
        onClearAllData={handleClearAllData}
        useMarkdown={useMarkdown}
        onMarkdownToggle={() => setUseMarkdown(!useMarkdown)}
        personas={personas}
        activePersonaId={activePersonaId}
        onPersonaChange={setActivePersonaId}
        onPersonaCreate={addPersona}
        onPersonaEdit={handlePersonaEdit}
        onPersonaDelete={deletePersona}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="md:hidden"
                size="icon"
                variant="ghost"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleNewChat}
                className="flex items-center gap-2"
                size="sm"
                variant="ghost"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {/* Right side of header - can be used for other features */}
            </div>
          </div>
        </header>

        <div className="flex flex-col h-[calc(100%-3.5rem)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('create-image')}
                    className="flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Create image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('help-write')}
                    className="flex items-center gap-2"
                  >
                    <PenLine className="w-4 h-4" />
                    Help me write
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('surprise')}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Surprise me
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('make-plan')}
                    className="flex items-center gap-2"
                  >
                    <ListChecks className="w-4 h-4" />
                    Make a plan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction('generate-content')}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate content
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((message: ExtendedMessage, index: number) => (
                <MessageComponent key={index} message={message} />
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t">
            {showUrlInput && <UrlInput />}
            <div className="p-4">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    placeholder={t.typeMessage}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      if (textareaRef.current) {
                        textareaRef.current.style.height = '50px'
                        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
                        setTextareaHeight(`${textareaRef.current.scrollHeight}px`)
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    style={{ height: textareaHeight }}
                    className="min-h-[50px] w-full resize-none"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="h-8 w-8"
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add web URLs for context (RAG)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    disabled={isLoading || !input.trim()}
                    className="h-8 w-8"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Chat History */}
      <div 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Hover Area */}
        <div className={cn(
          "fixed right-0 top-0 w-4 h-screen z-30",
          isPinned ? "hidden" : "block"
        )} />

        <div className={cn(
          "relative transition-[width] duration-200 ease-in-out",
          isRightSidebarOpen ? "w-80" : "w-0"
        )}>
          <div className={cn(
            "fixed inset-y-0 right-0 z-40 w-80 bg-background border-l transform transition-all duration-200 ease-in-out md:relative",
            isRightSidebarOpen ? "translate-x-0" : "translate-x-full"
          )}>
            {/* Pin Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute -left-4 top-4 hidden md:flex",
                "h-8 w-8 rounded-full bg-background border shadow-sm",
              )}
              onClick={() => setIsPinned(!isPinned)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                style={{
                  transform: isPinned ? 'rotate(-45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
            </Button>

            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchChats}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <ChatHistory
              sessions={sessions}
              currentSessionId={currentSessionId}
              searchQuery={searchQuery}
              onSelectSession={(id) => {
                setCurrentSessionId(id)
                // Load the selected session's messages from chat memory
                loadSessionMessages(id)
              }}
              onDeleteSession={async (id, e) => {
                e?.stopPropagation()
                if (id === currentSessionId) {
                  handleNewChat()
                }
                deleteSession(id)
                setSessions(prev => prev.filter(s => s.id !== id))
              }}
              onClearSearch={() => setSearchQuery('')}
              translations={t}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 