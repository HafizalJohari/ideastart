import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X, Trash2 } from 'lucide-react'
import { Session, Translations } from '@/lib/types'
import { platformData, PlatformType } from '@/components/platform-selector'
import { translations } from '@/lib/translations'

interface ChatHistoryProps {
  sessions: Session[]
  currentSessionId: string
  searchQuery: string
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string, e?: React.MouseEvent) => void | Promise<void>
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
  translations
}: ChatHistoryProps) {
  const filteredSessions = sessions.filter(session => {
    const sessionTitle = session?.title || translations.defaultChatTitle || 'New Chat'
    return sessionTitle.toLowerCase().includes((searchQuery || '').toLowerCase())
  })

  return (
    <div className="space-y-2 p-2">
      {filteredSessions.length > 0 ? (
        filteredSessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer",
              session.id === currentSessionId && "bg-muted"
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                {session.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(session.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-2"
              onClick={(e) => onDeleteSession(session.id, e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      ) : (
        <div className="text-center p-4 text-muted-foreground">
          {searchQuery ? translations.noChatsFound : translations.noChatsYet}
        </div>
      )}
    </div>
  )
} 