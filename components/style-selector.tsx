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

export const copywritingStyles = {
  'none': {
    name: 'No Style',
    description: 'No specific writing style applied'
  },
  'AIDA': {
    name: 'AIDA',
    description: 'Attention, Interest, Desire, Action - Classic marketing framework'
  },
  'PAS': {
    name: 'PAS',
    description: 'Problem, Agitate, Solution - Emotional problem-solving framework'
  },
  'BAB': {
    name: 'BAB',
    description: 'Before, After, Bridge - Transformation-focused framework'
  },
  'FAB': {
    name: 'FAB',
    description: 'Features, Advantages, Benefits - Product-focused framework'
  },
  '4Cs': {
    name: '4Cs',
    description: 'Clear, Concise, Compelling, Credible - Communication framework'
  },
  '4Ps': {
    name: '4Ps',
    description: 'Promise, Picture, Proof, Push - Persuasion framework'
  },
  'QUEST': {
    name: 'QUEST',
    description: 'Qualify, Understand, Educate, Stimulate, Transition - Educational framework'
  },
  'FOREST': {
    name: 'FOREST',
    description: 'Facts, Opinion, Reasons, Examples, Summary, Thesis - Academic framework'
  }
} as const

export type CopywritingStyle = keyof typeof copywritingStyles

interface StyleSelectorProps {
  selectedStyle: CopywritingStyle
  onStyleChange: (style: CopywritingStyle) => void
  className?: string
}

export function StyleSelector({ selectedStyle, onStyleChange, className }: StyleSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const selectedStyleData = copywritingStyles[selectedStyle] || copywritingStyles.none

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">{selectedStyleData.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search writing style..." />
          <CommandList>
            <CommandEmpty>No style found.</CommandEmpty>
            <CommandGroup>
              {Object.entries(copywritingStyles).map(([value, { name, description }]) => (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={() => {
                    onStyleChange(value as CopywritingStyle)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{name}</span>
                      <span className="text-xs text-muted-foreground truncate">{description}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        selectedStyle === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 