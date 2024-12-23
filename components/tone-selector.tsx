import * as React from "react"
import { Check, ChevronsUpDown, HelpCircle } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const writingTones = {
  'none': {
    name: 'No Tone',
    description: 'No specific tone applied'
  },
  'professional': {
    name: 'Professional',
    description: 'Clear, authoritative, and business-appropriate language that maintains credibility and expertise. Ideal for business communications and formal content.'
  },
  'conversational': {
    name: 'Conversational',
    description: 'Natural, friendly, and engaging tone that makes complex topics accessible and relatable. Perfect for blogs, social media, and casual content.'
  },
  'enthusiastic': {
    name: 'Enthusiastic',
    description: 'Energetic, positive, and exciting language that inspires and motivates the audience. Great for motivational content and product launches.'
  },
  'informative': {
    name: 'Informative',
    description: 'Educational, clear, and detailed writing that focuses on delivering valuable information. Suitable for tutorials, guides, and educational content.'
  },
  'persuasive': {
    name: 'Persuasive',
    description: 'Compelling, convincing language that influences decisions and drives action. Effective for sales copy and call-to-actions.'
  },
  'empathetic': {
    name: 'Empathetic',
    description: 'Understanding, compassionate tone that connects with the audience\'s emotions and experiences. Perfect for customer service and support content.'
  },
  'humorous': {
    name: 'Humorous',
    description: 'Light-hearted, witty, and entertaining language that engages through humor. Great for casual brands and entertainment content.'
  },
  'formal': {
    name: 'Formal',
    description: 'Sophisticated, polished language adhering to strict professional standards. Ideal for academic or official communications.'
  }
} as const

export type WritingTone = keyof typeof writingTones

interface ToneSelectorProps {
  selectedTone: WritingTone
  onToneChange: (tone: WritingTone) => void
  className?: string
}

export function ToneSelector({ selectedTone, onToneChange, className }: ToneSelectorProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <div className={className}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="truncate">{writingTones[selectedTone].name}</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        role="button"
                        tabIndex={0}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                        <span className="sr-only">Learn more about {writingTones[selectedTone].name} tone</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      className="max-w-[300px] p-4 text-sm"
                      sideOffset={5}
                    >
                      <p>{writingTones[selectedTone].description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search tones..." />
              <CommandList>
                <CommandEmpty>No tone found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {Object.entries(writingTones).map(([key, { name, description }]) => (
                    <CommandItem
                      key={key}
                      onSelect={() => {
                        onToneChange(key as WritingTone)
                        setOpen(false)
                      }}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            selectedTone === key ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{name}</span>
                          <span className="text-xs text-muted-foreground truncate">{description}</span>
                        </div>
                      </div>
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              role="button"
                              tabIndex={0}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                              <span className="sr-only">Learn more about {name} tone</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="left" 
                            className="max-w-[300px] p-4 text-sm"
                            sideOffset={5}
                          >
                            <p>{description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  )
} 