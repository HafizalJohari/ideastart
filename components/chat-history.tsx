import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Session, Translations } from '@/lib/types'
import { platformData, PlatformType } from '@/components/platform-selector'
import { translations } from '@/lib/translations'

interface ChatHistoryProps {
  sessions: Session[]
  currentSessionId: string | null
  searchQuery: string
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
  onClearSearch: () => void
  translations: Translations
}

export function ChatHistory({
  sessions,
  currentSessionId,
  searchQuery,
  onSelectSession,
  onDeleteSession,
  onClearSearch,
  translations: t,
}: ChatHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery ? (
          <>
            <p className="text-sm">{t.noResults} "{searchQuery}"</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={onClearSearch}
            >
              {t.clearSearch}
            </Button>
          </>
        ) : (
          <p className="text-sm">{t.noChats}</p>
        )}
      </div>
    )
  }

  // Create categories including Multi-Platform
  const categories = {
    'Multi-Platform': sessions.filter(s => Array.isArray(s.platforms) && s.platforms.length > 1),
    ...Object.keys(platformData).reduce((acc, platform) => ({
      ...acc,
      [platform]: sessions.filter(s => 
        Array.isArray(s.platforms) && s.platforms.length === 1 && s.platforms[0] === platform
      )
    }), {} as Record<string, Session[]>)
  }

  // Format timestamp to show both date and time if not today
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString()
    }
    
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  return (
    <div className="space-y-4">
      {Object.entries(categories)
        .filter(([_, sessions]) => sessions.length > 0)
        .map(([category, categorySessions]) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-2 px-2 mb-2">
              {category === 'Multi-Platform' ? (
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                  <span className="text-sm font-medium text-muted-foreground">Multi-Platform</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {platformData[category as PlatformType].emoji}
                  <span className="text-sm font-medium text-muted-foreground">
                    {platformData[category as PlatformType].title}
                  </span>
                </div>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {categorySessions.length}
              </span>
            </div>
            <div className="space-y-2">
              {categorySessions.map((session) => (
                <Card 
                  key={session.id}
                  className={cn(
                    "p-3 cursor-pointer hover:bg-accent/50 transition-colors relative group",
                    currentSessionId === session.id && "bg-accent"
                  )}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate pr-8">{session.lastMessage}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      title={t.deleteChat}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">{t.deleteChat}</span>
                    </Button>
                  </div>
                  {Array.isArray(session.platforms) && session.platforms.length > 1 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {session.platforms.map(platform => (
                        <div 
                          key={platform}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 text-[10px] text-muted-foreground"
                        >
                          {platformData[platform].emoji}
                          <span className="truncate max-w-[80px]">
                            {platformData[platform].title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <time className="text-xs text-muted-foreground mt-1 block">
                    {formatTimestamp(session.timestamp)}
                  </time>
                </Card>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
} 