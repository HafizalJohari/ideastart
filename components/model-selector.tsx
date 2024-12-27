'use client'

import * as React from "react"
import { Check, ChevronsUpDown, Sparkles, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ModelInfo {
  name: string
  description: string
  provider: string
  icon: React.ReactNode
  isNew?: boolean
}

export const models: Record<string, ModelInfo> = {
  'gpt-4o': {
    name: 'GPT-4o',
    description: 'Most capable OpenAI model, best for complex tasks',
    provider: 'OpenAI',
    icon: <Sparkles className="h-4 w-4 text-green-500" />
  },
  'gpt-4o-mini': {
    name: 'GPT-4o-mini',
    description: 'Fast and efficient OpenAI model, good for most tasks',
    provider: 'OpenAI',
    icon: <Sparkles className="h-4 w-4 text-green-500" />
  },
  'llama-3.3-70b': {
    name: 'Llama 3.3 70B',
    description: 'Latest Llama model with strong capabilities',
    provider: 'Cerebras',
    icon: <Sparkles className="h-4 w-4 text-blue-500" />
  },
  'claude-3-5-haiku-20241022': {
    name: 'Claude 3.5 Haiku',
    description: 'Fast and efficient model from Anthropic',
    provider: 'Anthropic',
    icon: <Sparkles className="h-4 w-4 text-purple-500" />
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    description: 'Fast and efficient Google AI model, optimized for quick responses',
    provider: 'Google',
    icon: <Sparkles className="h-4 w-4 text-red-500" />
  },
  'grok-2-1212': {
    name: 'Grok 2',
    description: 'Latest model from xAI with real-time knowledge',
    provider: 'X.AI',
    icon: <Bot className="h-4 w-4 text-slate-500" />,
    isNew: true
  },
  'command-r-plus-08-2024': {
    name: 'Cohere Command R+',
    description: 'Advanced model from Cohere with strong capabilities',
    provider: 'Cohere',
    icon: <Sparkles className="h-4 w-4 text-yellow-500" />
  }
} as const

export type ModelType = keyof typeof models

interface ModelSelectorProps {
  selectedModel: ModelType
  onModelChange: (model: ModelType) => void
  className?: string
}

export function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2 truncate">
            {models[selectedModel].icon}
            <span className="truncate">{models[selectedModel].name}</span>
            <span className="ml-2 rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {models[selectedModel].provider}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {Object.entries(models).map(([key, { name, description, provider, icon, isNew }]) => (
                <CommandItem
                  key={key}
                  onSelect={() => {
                    onModelChange(key as ModelType)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 py-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {icon}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{name}</span>
                        <span className="rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {provider}
                        </span>
                        {isNew && (
                          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {description}
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedModel === key ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 