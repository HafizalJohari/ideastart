'use client'

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Twitter, Linkedin, Facebook, Instagram, Music, MessageSquare, Ghost, Youtube, Mic, Mail, FileText, Image, Code, MessageCircle } from "lucide-react"

export const platformData = {
  conversation: {
    emoji: <MessageCircle className="h-4 w-4" />,
    title: 'Conversation',
    description: 'General chat and conversation'
  },
  blog: {
    emoji: <FileText className="h-4 w-4" />,
    title: 'Blog',
    description: 'Blog posts and articles'
  },
  medium: {
    emoji: <Ghost className="h-4 w-4" />,
    title: 'Medium',
    description: 'Articles optimized for Medium platform'
  },
  twitter: {
    emoji: <Twitter className="h-4 w-4" />,
    title: 'Twitter/X',
    description: 'Tweets and threads'
  },
  linkedin: {
    emoji: <Linkedin className="h-4 w-4" />,
    title: 'LinkedIn',
    description: 'Professional posts and articles'
  },
  facebook: {
    emoji: <Facebook className="h-4 w-4" />,
    title: 'Facebook',
    description: 'Social media posts and updates'
  },
  instagram: {
    emoji: <Instagram className="h-4 w-4" />,
    title: 'Instagram',
    description: 'Captions and stories'
  },
  email: {
    emoji: <Mail className="h-4 w-4" />,
    title: 'Email',
    description: 'Professional emails and newsletters'
  },
  imagePrompt: {
    emoji: <Image className="h-4 w-4" />,
    title: 'Image Prompt',
    description: 'Generate image prompts'
  },
  codeDocumentation: {
    emoji: <Code className="h-4 w-4" />,
    title: 'Code Documentation',
    description: 'Generate code documentation'
  }
} as const

export type PlatformType = keyof typeof platformData

interface PlatformSelectorProps {
  selectedPlatforms: PlatformType[]
  onPlatformChange: (platforms: PlatformType[]) => void
  className?: string
}

export function PlatformSelector({ selectedPlatforms = [], onPlatformChange, className }: PlatformSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handlePlatformToggle = (platform: PlatformType) => {
    const newPlatforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter(p => p !== platform)
      : [...selectedPlatforms, platform]
    onPlatformChange(newPlatforms)
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedPlatforms.length === 0
                ? "Select platforms..."
                : `${selectedPlatforms.length} platform${selectedPlatforms.length === 1 ? "" : "s"} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search platforms..." />
            <CommandList>
              <CommandEmpty>No platform found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {Object.entries(platformData).map(([key, { emoji, title }]) => (
                  <CommandItem
                    key={key}
                    onSelect={() => {
                      handlePlatformToggle(key as PlatformType)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedPlatforms.includes(key as PlatformType) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="mr-2">{emoji}</span>
                    {title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedPlatforms?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedPlatforms.map((platform) => (
            <Badge
              key={platform}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handlePlatformToggle(platform)}
            >
              {platformData[platform].emoji} {platformData[platform].title}
              <span className="sr-only">Remove {platformData[platform].title}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
} 