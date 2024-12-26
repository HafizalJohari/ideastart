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
  const filteredSessions = sessions
    .filter(session => {
      if (!searchQuery) return true
      return (
        session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (session.lastMessage?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
    })
    .sort((a, b) => {
      // Sort by lastMessageTimestamp or updatedAt if lastMessageTimestamp is not available
      const aTime = a.lastMessageTimestamp || a.updatedAt
      const bTime = b.lastMessageTimestamp || b.updatedAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredSessions.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          {searchQuery ? translations.noResults : translations.noChats}
        </div>
      ) : (
        <div className="space-y-2 p-4">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className={cn(
                "cursor-pointer p-3 hover:bg-muted/50",
                session.id === currentSessionId && "bg-muted"
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 truncate">
                  <p className="text-sm font-medium leading-none">
                    {session.name}
                  </p>
                  {session.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {session.lastMessage}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => onDeleteSession(session.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">
                    {translations.deleteChat}
                  </span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 