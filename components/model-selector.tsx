'use client'

import * as React from "react"
import { Check, ChevronsUpDown, Sparkles } from "lucide-react"
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

export const modelData = {
  'llama-3.3-70b': {
    name: 'Llama 3.3 70B',
    description: 'High-performance open-source model optimized for chat and content generation.',
    provider: 'Cerebras',
    icon: <Sparkles className="h-4 w-4 text-blue-500" />,
  },
  'claude-3-5-haiku-20241022': {
    name: 'Claude Haiku 3.5',
    description: 'Advanced AI model specialized in creative and poetic content generation.',
    provider: 'Anthropic',
    icon: <Sparkles className="h-4 w-4 text-purple-500" />,
  },
  'gpt-4': {
    name: 'GPT-4',
    description: 'Advanced language model with exceptional understanding and generation capabilities.',
    provider: 'OpenAI',
    icon: <Sparkles className="h-4 w-4 text-green-500" />,
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    description: 'Smaller version of GPT-4 with reduced context window.',
    provider: 'OpenAI',
    icon: <Sparkles className="h-4 w-4 text-green-500" />,
  },
} as const

export type ModelType = keyof typeof modelData

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
            {modelData[selectedModel].icon}
            <span className="truncate">{modelData[selectedModel].name}</span>
            <span className="ml-2 rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {modelData[selectedModel].provider}
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
              {Object.entries(modelData).map(([key, { name, description, provider, icon }]) => (
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