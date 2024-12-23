import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingIndicatorProps {
  className?: string
}

export function LoadingIndicator({ className }: LoadingIndicatorProps) {
  return (
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
  )
} 