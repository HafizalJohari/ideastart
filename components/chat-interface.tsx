'use client'

import { useState, type FormEvent, useEffect, useRef } from 'react'
import { Bot, Send, Sparkles, Menu, Plus, Trash2, Podcast, X, Search, ChevronLeft, ChevronRight, Mic, PenLine, Image, Gift, LightbulbIcon, Sliders, Twitch, Badge, Settings, Volume2, Trash, Download, Upload, RefreshCw, Code, FileText, Loader2, ImageIcon, ListChecks } from 'lucide-react'
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
import { ModelSelector, type ModelType, modelData } from '@/components/model-selector'
import { Sidebar } from '@/components/sidebar'
import type { Message as MessageType, Session, ChatState, ChatMemory } from '@/lib/types'
import { translations } from '@/lib/translations'
import { ChatHistory } from '@/components/chat-history'
import { useChatStore } from '@/lib/store'

interface ExtendedMessage extends Omit<MessageType, 'id' | 'timestamp'> {
  id: string
  timestamp: string
  style?: CopywritingStyle
  tone?: WritingTone
  platforms?: PlatformType[]
  model?: ModelType
  imageUrl?: string
  error?: boolean
}

type ExtendedSession = Session

const t = translations.en // Default to English

function MessageComponent({ message }: { message: ExtendedMessage }) {
  return (
    <div className={cn(
      "flex gap-3 p-4",
      message.role === 'assistant' ? "bg-muted/50" : "bg-background"
    )}>
      <div className="flex-1 space-y-2">
        <p className="text-sm">{message.content}</p>
        {message.imageUrl && (
          <img 
            src={message.imageUrl} 
            alt="Generated image"
            className="rounded-lg max-w-sm mt-2"
          />
        )}
        {message.role === 'assistant' && (
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
            {message.model && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5">
                Model: {message.model}
              </span>
            )}
            {message.platforms && message.platforms.length > 0 && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5">
                Platform: {message.platforms.join(', ')}
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
        )}
      </div>
      <CopyButton value={message.content} />
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

  // Global state from Zustand
  const {
    sessions,
    currentSessionId,
    messages,
    selectedPlatforms,
    selectedLanguage,
    selectedStyle,
    selectedTone,
    selectedModel,
    searchQuery,
    isPinned,
    isRightSidebarOpen,
    setSessions,
    setCurrentSessionId,
    setMessages,
    setSelectedPlatforms,
    setSelectedLanguage,
    setSelectedStyle,
    setSelectedTone,
    setSelectedModel,
    setSearchQuery,
    setIsPinned,
    setIsRightSidebarOpen,
    createNewSession,
    deleteSession,
    addMessage
  } = useChatStore()

  type QuickAction = 'create-image' | 'help-write' | 'surprise' | 'make-plan'

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)

      // Create user message
      const userMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: input,
        timestamp: new Date().toISOString(),
        platforms: selectedPlatforms,
        style: selectedStyle,
        tone: selectedTone,
        model: selectedModel
      }

      // Add user message to the chat
      addMessage(userMessage)

      // Clear input
      setInput('')

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '50px'
        setTextareaHeight('50px')
      }

      // Prepare request body
      const requestBody = {
        message: input,
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['conversation'],
        language: selectedLanguage || 'en',
        style: selectedStyle || 'none',
        tone: selectedTone || 'none',
        model: selectedModel || 'llama-3.3-70b',
        sessionId: currentSessionId,
        messages,
        directImageGeneration: selectedPlatforms.includes('imagePrompt')
      }

      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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
        imageUrl: data.imageUrl
      }
      addMessage(assistantMessage)

      // Auto scroll to bottom
      if (textareaRef.current) {
        textareaRef.current.style.height = '50px'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        setTextareaHeight(`${textareaRef.current.scrollHeight}px`)
      }

    } catch (error) {
      console.error('Error:', error)
      // Add error message
      const errorMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        platforms: selectedPlatforms,
        style: selectedStyle,
        tone: selectedTone,
        model: selectedModel,
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
      handleSubmit(e as unknown as FormEvent)
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
      id: Date.now().toString(),
      messages: [],
      model: 'llama-3.3-70b',
      platforms: ['conversation'],
      language: 'en',
      style: 'none',
      tone: 'none',
      lastMessage: '',
      timestamp: new Date().toISOString(), // Store as ISO string
      hasGreeted: false
    }

    // Add new session to sessions list
    setSessions((prev: Session[]) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)

    // Save the new session
    saveChatSession(newSession)
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

  return (
    <div className="flex h-screen overflow-hidden">
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
        onSelectSession={(id) => setCurrentSessionId(id)}
        onDeleteSession={async (id, e) => {
          e?.stopPropagation()
          if (id === currentSessionId) {
            handleNewChat()
          }
          await deleteChatSession(id)
          setSessions((prev: Session[]) => prev.filter((s: Session) => s.id !== id))
        }}
        showThemeToggle={true}
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
                </div>
              </div>
            ) : (
              messages.map((message: ExtendedMessage, index: number) => (
                <MessageComponent key={index} message={message} />
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder={t.typeMessage}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    // Auto-adjust height
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
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-4 h-8 w-8"
                disabled={isLoading || !input.trim()}
                onClick={(e) => handleSubmit(e)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
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

            <ChatHistory
              sessions={sessions}
              currentSessionId={currentSessionId}
              searchQuery={searchQuery}
              onSelectSession={(id) => setCurrentSessionId(id)}
              onDeleteSession={(id, e) => {/* handle delete session */}}
              onClearSearch={() => setSearchQuery('')}
              translations={t}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 