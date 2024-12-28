'use client'

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Settings, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { UserPersona } from "@/lib/types"

interface PersonaSelectorProps {
  personas: UserPersona[]
  activePersonaId: string | null
  onPersonaChange: (personaId: string) => void
  onPersonaCreate: (persona: Omit<UserPersona, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => void
  onPersonaEdit?: (persona: UserPersona) => void
  onPersonaDelete?: (personaId: string) => void
}

export function PersonaSelector({
  personas,
  activePersonaId,
  onPersonaChange,
  onPersonaCreate,
  onPersonaEdit,
  onPersonaDelete
}: PersonaSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [showEditDialog, setShowEditDialog] = React.useState(false)
  const [editingPersona, setEditingPersona] = React.useState<UserPersona | null>(null)
  const [newPersona, setNewPersona] = React.useState({
    name: '',
    role: '',
    industry: '',
    background: '',
    goals: '',
    interests: '',
    tone: ''
  })

  const activePersona = personas.find(p => p.id === activePersonaId)

  const handleCreatePersona = () => {
    onPersonaCreate({
      name: newPersona.name,
      role: newPersona.role,
      industry: newPersona.industry,
      background: newPersona.background,
      goals: newPersona.goals.split(',').map(g => g.trim()),
      interests: newPersona.interests.split(',').map(i => i.trim()),
      tone: newPersona.tone
    })
    setShowCreateDialog(false)
    setNewPersona({
      name: '',
      role: '',
      industry: '',
      background: '',
      goals: '',
      interests: '',
      tone: ''
    })
  }

  const handleEditPersona = () => {
    if (editingPersona) {
      onPersonaEdit({
        ...editingPersona,
        goals: typeof editingPersona.goals === 'string' 
          ? editingPersona.goals.split(',').map(g => g.trim())
          : editingPersona.goals,
        interests: typeof editingPersona.interests === 'string'
          ? editingPersona.interests.split(',').map(i => i.trim())
          : editingPersona.interests,
        updatedAt: new Date().toISOString()
      })
      setShowEditDialog(false)
      setEditingPersona(null)
    }
  }

  const startEditing = (persona: UserPersona) => {
    setEditingPersona({
      ...persona,
      goals: Array.isArray(persona.goals) ? persona.goals.join(', ') : persona.goals,
      interests: Array.isArray(persona.interests) ? persona.interests.join(', ') : persona.interests
    })
    setShowEditDialog(true)
    setOpen(false)
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {activePersona ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{activePersona.name}</span>
                <span className="text-muted-foreground">({activePersona.role})</span>
              </div>
            ) : (
              "Select persona..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search personas..." />
            <CommandList>
              <CommandEmpty>No persona found.</CommandEmpty>
              <CommandGroup>
                {personas.map((persona) => (
                  <CommandItem
                    key={persona.id}
                    onSelect={() => {
                      onPersonaChange(persona.id)
                      setOpen(false)
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span>{persona.name}</span>
                      <span className="text-sm text-muted-foreground">{persona.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(persona)
                        }}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Edit {persona.name}</span>
                      </Button>
                      {onPersonaDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            onPersonaDelete(persona.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {persona.name}</span>
                        </Button>
                      )}
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          activePersonaId === persona.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setShowCreateDialog(true)
                    setOpen(false)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new persona
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Persona</DialogTitle>
            <DialogDescription>
              Create a new persona to personalize your chat experience.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newPersona.name}
                onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                placeholder="e.g., Marketing Manager Sarah"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={newPersona.role}
                onChange={(e) => setNewPersona({ ...newPersona, role: e.target.value })}
                placeholder="e.g., Digital Marketing Manager"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={newPersona.industry}
                onChange={(e) => setNewPersona({ ...newPersona, industry: e.target.value })}
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="background">Background & Experience</Label>
              <Textarea
                id="background"
                value={newPersona.background}
                onChange={(e) => setNewPersona({ ...newPersona, background: e.target.value })}
                placeholder="Brief description of background and experience"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goals">Goals (comma-separated)</Label>
              <Input
                id="goals"
                value={newPersona.goals}
                onChange={(e) => setNewPersona({ ...newPersona, goals: e.target.value })}
                placeholder="e.g., Increase brand awareness, Improve ROI"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="interests">Interests (comma-separated)</Label>
              <Input
                id="interests"
                value={newPersona.interests}
                onChange={(e) => setNewPersona({ ...newPersona, interests: e.target.value })}
                placeholder="e.g., Content marketing, Social media trends"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tone">Preferred Communication Tone</Label>
              <Input
                id="tone"
                value={newPersona.tone}
                onChange={(e) => setNewPersona({ ...newPersona, tone: e.target.value })}
                placeholder="e.g., Professional, Casual, Technical"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePersona} disabled={!newPersona.name || !newPersona.role}>
              Create Persona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Persona</DialogTitle>
            <DialogDescription>
              Update your persona's details.
            </DialogDescription>
          </DialogHeader>
          {editingPersona && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingPersona.name}
                  onChange={(e) => setEditingPersona({ ...editingPersona, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={editingPersona.role}
                  onChange={(e) => setEditingPersona({ ...editingPersona, role: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-industry">Industry</Label>
                <Input
                  id="edit-industry"
                  value={editingPersona.industry}
                  onChange={(e) => setEditingPersona({ ...editingPersona, industry: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-background">Background & Experience</Label>
                <Textarea
                  id="edit-background"
                  value={editingPersona.background}
                  onChange={(e) => setEditingPersona({ ...editingPersona, background: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-goals">Goals (comma-separated)</Label>
                <Input
                  id="edit-goals"
                  value={editingPersona.goals}
                  onChange={(e) => setEditingPersona({ ...editingPersona, goals: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-interests">Interests (comma-separated)</Label>
                <Input
                  id="edit-interests"
                  value={editingPersona.interests}
                  onChange={(e) => setEditingPersona({ ...editingPersona, interests: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tone">Preferred Communication Tone</Label>
                <Input
                  id="edit-tone"
                  value={editingPersona.tone}
                  onChange={(e) => setEditingPersona({ ...editingPersona, tone: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPersona} disabled={!editingPersona?.name || !editingPersona?.role}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 