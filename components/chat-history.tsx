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
  translations: t
}: ChatHistoryProps) {
  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session => 
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredSessions.length > 0 ? (
        <div className="space-y-2 p-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-muted/50",
                session.id === currentSessionId && "bg-muted"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {session.lastMessage || "New Chat"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(session.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-2 invisible group-hover:visible"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSession(session.id, e)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <p className="text-center text-sm text-muted-foreground">
            {t.noResults}
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={onClearSearch}
            className="mt-2"
          >
            {t.clearSearch}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-sm text-muted-foreground">
            {t.noChats}
          </p>
        </div>
      )}
    </div>
  )
} 