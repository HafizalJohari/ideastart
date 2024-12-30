'use client'

import { useState, type FormEvent, useEffect, useRef } from 'react'
import { Bot, Send, Sparkles, Menu, Plus, Trash2, Podcast, X, Search, ChevronLeft, ChevronRight, Mic, PenLine, Image, Gift, LightbulbIcon, Sliders, Twitch, Badge, Settings, Volume2, Trash, Download, Upload, RefreshCw, Code, FileText, Loader2, ImageIcon, ListChecks, Globe, FileCode, MessageSquare, Instagram as InstagramIcon, Twitter as TwitterIcon, Facebook as FacebookIcon, Copy, Check } from 'lucide-react'
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
import type { Message as MessageType, Session, ChatState, ChatMemory, UserPersona, Project, ProjectFile } from '@/lib/types'
import { translations } from '@/lib/translations'
import { ChatHistory } from '@/components/chat-history'
import { useChatStore } from '@/lib/store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { CodeUploadDialog } from '@/components/code-upload-dialog'
import { AdvancedSettingsDialog } from '@/components/advanced-settings-dialog'
import { useTheme } from "next-themes"

// Constants
const MAX_LENGTH = 8192 // Cerebras model limit

interface CodeComponentProps {
  node?: any
  inline?: boolean
  className?: string
  children: React.ReactNode
}

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
    const sections = message.content.split(/\n(?=[A-Za-z]+(?:\/[A-Za-z]+)?:)/)
    return sections.map(section => {
      const match = section.match(/^([A-Za-z]+(?:\/[A-Za-z]+)?):?\s*([\s\S]+)/)
      if (match) {
        const [, platformName, content] = match
        const platform = platformName.toLowerCase().replace('/', '') as PlatformType
        return { platform, content: content.trim() }
      }
      return { platform: 'conversation' as PlatformType, content: section.trim() }
    }).filter(section => section.content)
  }

  const sections = splitContent()

  const components: Components = {
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      const code = String(children).replace(/\n$/, '')

      return match ? (
        <div className="relative my-4 rounded-lg bg-black/90 p-4">
          <div className="absolute right-4 top-4 flex items-center space-x-2">
            <span className="text-xs text-zinc-400">{language.toUpperCase()}</span>
            <CopyButton value={String(children)} variant="ghost" className="text-xs text-zinc-400 hover:bg-zinc-800" />
          </div>
          <div className="overflow-x-auto pt-4">
            <SyntaxHighlighter
              language={language}
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: 0,
                background: 'transparent'
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      ) : (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>
      )
    },
    // Add styles for other markdown elements
    p({ children }) {
      return <p className="mb-4 last:mb-0">{children}</p>
    },
    ul({ children }) {
      return <ul className="mb-4 list-disc pl-8 last:mb-0">{children}</ul>
    },
    ol({ children }) {
      return <ol className="mb-4 list-decimal pl-8 last:mb-0">{children}</ol>
    },
    li({ children }) {
      return <li className="mb-2 last:mb-0">{children}</li>
    },
    blockquote({ children }) {
      return <blockquote className="mt-4 border-l-4 border-zinc-700/50 pl-4 italic">{children}</blockquote>
    },
    h1({ children }) {
      return <h1 className="mb-4 text-2xl font-bold">{children}</h1>
    },
    h2({ children }) {
      return <h2 className="mb-3 text-xl font-bold">{children}</h2>
    },
    h3({ children }) {
      return <h3 className="mb-2 text-lg font-bold">{children}</h3>
    }
  }

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
                      {platformData[section.platform as keyof typeof platformData]?.emoji}{' '}
                      {platformData[section.platform as keyof typeof platformData]?.title || section.platform}
                    </div>
                  )}
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={components}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
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
                    <ImageIcon className="h-4 w-4" /> Generated Image
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
  const [codeFiles, setCodeFiles] = useState<{name: string, content: string}[]>([])
  const [showCodeUpload, setShowCodeUpload] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [isRightSidebarHovered, setIsRightSidebarHovered] = useState(false)

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
    setActivePersonaId,
    migrateLanguageCode
  } = useChatStore()

  // Theme state
  const { theme, setTheme } = useTheme()
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  // Run language code migration on mount
  useEffect(() => {
    migrateLanguageCode()
  }, [migrateLanguageCode])

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
    
    // Calculate total context length including history
    const contextLength = messages.slice(-10).reduce((acc, msg) => acc + msg.content.length, 0) + newMessage.length
    const MAX_LENGTH = 8192 // Cerebras model limit

    if (contextLength > MAX_LENGTH) {
      toast({
        title: "Message Too Long",
        description: `Total context length (${contextLength} chars) exceeds limit of ${MAX_LENGTH}. Please reduce your message or start a new chat.`,
        variant: "destructive",
      })
      return
    }

    setInput('')
    setIsLoading(true)

    try {
      // Get active project
      const activeProject = projects.find(p => p.id === activeProjectId)
      
      // Keep the original model selection
      const effectiveModel = selectedModel

      // Add user message first
      const userMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: newMessage,
        timestamp: new Date().toISOString(),
        platforms: selectedPlatforms,
        style: selectedStyle,
        tone: selectedTone,
        model: effectiveModel
      }
      addMessage(userMessage)

      // Get active persona
      const activePersona = personas.find(p => p.id === activePersonaId)

      // Get project files if access is allowed
      const projectFiles = activeProject?.allowFileAccess ? 
        activeProject.folders.flatMap(folder => 
          folder.files.map(file => ({
            name: file.name,
            content: file.content
          }))
        ) : []

      // Send request for each platform
      const responses = await Promise.all(selectedPlatforms.map(async platform => {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: newMessage,
            platforms: [platform], // Send one platform at a time
            language: selectedLanguage,
            style: selectedStyle,
            tone: selectedTone,
            model: effectiveModel,
            messages: messages.slice(-10),
            directImageGeneration: platform === 'imagePrompt', // Enable image generation for imagePrompt
            webUrls: webUrls,
            useMarkdown,
            persona: activePersona,
            codeFiles: codeFiles,
            projectInstructions: activeProject?.instructions,
            projectFiles: projectFiles
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return {
          platform,
          data: await response.json()
        }
      }))

      // Combine responses from all platforms
      const combinedResponse = responses.map(({ platform, data }) => {
        const platformInfo = platformData[platform as keyof typeof platformData]
        if (platform === 'imagePrompt' && data.imageUrl) {
          return `Image Prompt:\n${data.response}`
        }
        return `${platformInfo?.title || platform}:\n${data.response}`
      }).join('\n\n')

      // Add assistant message with combined responses
      const assistantMessage: ExtendedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: combinedResponse,
        timestamp: new Date().toISOString(),
        platforms: selectedPlatforms,
        style: selectedStyle,
        tone: selectedTone,
        model: effectiveModel,
        imageUrl: responses.find(r => r.platform === 'imagePrompt')?.data.imageUrl,
        sources: responses.flatMap(r => r.data.sources || [])
      }

      addMessage(assistantMessage)
      playNotificationSound()

      // Clear code files after successful request
      setCodeFiles([])
      setShowCodeUpload(false)

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
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
    setIsRightSidebarHovered(true)
    if (!isPinned) {
      setIsRightSidebarOpen(true)
    }
  }

  const handleMouseLeave = () => {
    setIsRightSidebarHovered(false)
    if (!isPinned) {
      setIsRightSidebarOpen(false)
    }
  }

  const handlePinToggle = () => {
    const newPinState = !isPinned
    setIsPinned(newPinState)
    setIsRightSidebarOpen(newPinState)
  }

  useEffect(() => {
    if (isPinned) {
      setIsRightSidebarOpen(true)
    } else if (!isRightSidebarHovered) {
      setIsRightSidebarOpen(false)
    }
  }, [isPinned, isRightSidebarHovered, setIsRightSidebarOpen])

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
    const chatData = {
      messages,
      sessions,
      settings: {
        soundEnabled,
        useMarkdown,
        selectedLanguage,
        selectedStyle,
        selectedTone,
        selectedModel,
        selectedPlatforms
      }
    }
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cerebchat-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportChats = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const text = await file.text()
          const data = JSON.parse(text)
          
          // Import messages and sessions
          data.messages?.forEach((msg: MessageType) => addMessage(msg))
          data.sessions?.forEach((session: Session) => saveChatSession(session))
          
          // Import settings
          if (data.settings) {
            setSoundEnabled(data.settings.soundEnabled ?? true)
            setUseMarkdown(data.settings.useMarkdown ?? true)
            setSelectedLanguage(data.settings.selectedLanguage ?? 'en')
            setSelectedStyle(data.settings.selectedStyle ?? 'default')
            setSelectedTone(data.settings.selectedTone ?? 'default')
            setSelectedModel(data.settings.selectedModel ?? 'gpt-4')
            setSelectedPlatforms(data.settings.selectedPlatforms ?? [])
          }
          
          toast({
            title: 'Import Successful',
            description: 'Your chat history and settings have been imported.'
          })
        } catch (error) {
          console.error('Import error:', error)
          toast({
            title: 'Import Failed',
            description: 'There was an error importing your data. Please check the file format.',
            variant: 'destructive'
          })
        }
      }
    }
    input.click()
  }

  const handleResetSettings = () => {
    // Reset all settings to defaults
    setSoundEnabled(true)
    setUseMarkdown(true)
    setSelectedLanguage('en')
    setSelectedStyle('none')
    setSelectedTone('professional')
    setSelectedModel('gpt-4')
    setSelectedPlatforms([])
    
    toast({
      title: 'Settings Reset',
      description: 'All settings have been restored to their default values.'
    })
  }

  const handleClearAllData = () => {
    // Clear all messages and sessions
    setMessages([])
    setSessions([])
    setCurrentSessionId('')
    
    // Reset settings
    handleResetSettings()
    
    toast({
      title: 'Data Cleared',
      description: 'All chat history and settings have been cleared.',
      variant: 'destructive'
    })
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

  // Handle code file upload
  const handleCodeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newCodeFiles: {name: string, content: string}[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type === 'text/plain' || file.name.endsWith('.js') || file.name.endsWith('.ts') || 
          file.name.endsWith('.jsx') || file.name.endsWith('.tsx') || file.name.endsWith('.py') ||
          file.name.endsWith('.java') || file.name.endsWith('.cpp') || file.name.endsWith('.c') ||
          file.name.endsWith('.html') || file.name.endsWith('.css') || file.name.endsWith('.json')) {
        try {
          const content = await file.text()
          newCodeFiles.push({
            name: file.name,
            content: content
          })
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error)
          toast({
            title: 'Error',
            description: `Failed to read file ${file.name}`,
            variant: 'destructive'
          })
        }
      }
    }

    if (newCodeFiles.length > 0) {
      setCodeFiles(prev => [...prev, ...newCodeFiles])
      toast({
        title: 'Success',
        description: `${newCodeFiles.length} code file(s) uploaded successfully`
      })
    }
  }

  // Handle code file removal
  const handleRemoveCodeFile = (fileName: string) => {
    setCodeFiles(prev => prev.filter(file => file.name !== fileName))
  }

  // Code files upload component
  const CodeFilesUpload = () => (
    <div className="flex flex-col gap-2 p-2 border-t">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.txt"
          multiple
          onChange={handleCodeFileUpload}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCodeUpload(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {codeFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {codeFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-1"
            >
              <span className="truncate max-w-[200px]">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => handleRemoveCodeFile(file.name)}
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

  const showCodeUploadButton = selectedPlatforms.includes('codeDocumentation')

  // Add project handlers
  const handleProjectCreate = (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      folders: [],
      allowFileAccess: false,
      instructions: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setProjects(prev => [...prev, newProject])
    setActiveProjectId(newProject.id)
  }

  const handleProjectChange = (projectId: string | null) => {
    setActiveProjectId(projectId)
  }

  const handleProjectDelete = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (activeProjectId === projectId) {
      setActiveProjectId(null)
    }
  }

  const handleCreateFolder = (projectId: string, name: string) => {
    setProjects(prev => prev.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          folders: [
            ...project.folders,
            {
              id: crypto.randomUUID(),
              name,
              type: 'folder',
              files: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          updatedAt: new Date().toISOString()
        }
      }
      return project
    }))
  }

  const handleCreateFile = (projectId: string, folderId: string, file: Omit<ProjectFile, 'id' | 'createdAt' | 'updatedAt'>) => {
    setProjects(prev => prev.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          folders: project.folders.map(folder => {
            if (folder.id === folderId) {
              return {
                ...folder,
                files: [
                  ...folder.files,
                  {
                    ...file,
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                ],
                updatedAt: new Date().toISOString()
              }
            }
            return folder
          }),
          updatedAt: new Date().toISOString()
        }
      }
      return project
    }))
  }

  const handleDeleteFolder = (projectId: string, folderId: string) => {
    setProjects(prev => prev.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          folders: project.folders.filter(folder => folder.id !== folderId),
          updatedAt: new Date().toISOString()
        }
      }
      return project
    }))
  }

  const handleDeleteFile = (projectId: string, folderId: string, fileId: string) => {
    setProjects(prev => prev.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          folders: project.folders.map(folder => {
            if (folder.id === folderId) {
              return {
                ...folder,
                files: folder.files.filter(file => file.id !== fileId),
                updatedAt: new Date().toISOString()
              }
            }
            return folder
          }),
          updatedAt: new Date().toISOString()
        }
      }
      return project
    }))
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
        personas={personas}
        activePersonaId={activePersonaId}
        onPersonaChange={setActivePersonaId}
        onPersonaCreate={addPersona}
        onPersonaEdit={handlePersonaEdit}
        onPersonaDelete={deletePersona}
        projects={projects}
        activeProjectId={activeProjectId}
        onProjectChange={handleProjectChange}
        onProjectCreate={handleProjectCreate}
        onProjectDelete={handleProjectDelete}
        onCreateFolder={handleCreateFolder}
        onCreateFile={handleCreateFile}
        onDeleteFolder={handleDeleteFolder}
        onDeleteFile={handleDeleteFile}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAdvancedSettings(true)}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Messages and Input Area */}
          <div className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300",
            isRightSidebarOpen && "mr-80"
          )}>
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

            {/* Input Area */}
            <div className="border-t">
              {showUrlInput && <UrlInput />}
              {showCodeUpload && <CodeFilesUpload />}
              <div className="p-4">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        tabIndex={0}
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
                        className="min-h-[60px] w-full resize-none bg-background px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
                        style={{ height: textareaHeight }}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                        {input.length} / {MAX_LENGTH} chars
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setShowCodeUpload(!showCodeUpload)}
                            className="h-8 w-8"
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upload code files</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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

          {/* Chat History Sidebar */}
          <div 
            className={cn(
              "absolute right-0 top-0 bottom-0 w-80 border-l bg-background flex-shrink-0 flex flex-col transition-all duration-300",
              isRightSidebarOpen ? "translate-x-0" : "translate-x-full"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Search Bar and Pin Control */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="relative flex-1">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePinToggle}
                className={cn("ml-2", isPinned && "bg-accent")}
                aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                <ChevronRight className={cn("h-4 w-4 transition-transform", isPinned && "rotate-180")} />
              </Button>
            </div>

            {/* Chat History List */}
            <div className="flex-1 overflow-y-auto">
              <ChatHistory
                sessions={sessions}
                currentSessionId={currentSessionId}
                searchQuery={searchQuery}
                onSelectSession={(id) => {
                  setCurrentSessionId(id)
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
      </main>

      <AdvancedSettingsDialog
        open={showAdvancedSettings}
        onOpenChange={setShowAdvancedSettings}
        soundEnabled={soundEnabled}
        onSoundEnabledChange={setSoundEnabled}
        markdownEnabled={useMarkdown}
        onMarkdownEnabledChange={setUseMarkdown}
        darkMode={theme === 'dark'}
        onDarkModeChange={toggleTheme}
        debugMode={debugMode}
        onDebugModeChange={handleDebugModeToggle}
        onExportChats={handleExportChats}
        onImportChats={handleImportChats}
        onResetSettings={handleResetSettings}
        onClearAllData={handleClearAllData}
      />
    </div>
  )
} 