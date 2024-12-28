'use client'

import * as React from "react"
import { Plus, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Project {
  id: string
  name: string
  createdAt: string
}

interface ProjectSelectorProps {
  projects: Project[]
  activeProjectId: string | null
  onProjectChange: (projectId: string | null) => void
  onProjectCreate: (name: string) => void
  onProjectDelete?: (projectId: string) => void
}

export function ProjectSelector({
  projects,
  activeProjectId,
  onProjectChange,
  onProjectCreate,
  onProjectDelete
}: ProjectSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [newProjectName, setNewProjectName] = React.useState('')

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onProjectCreate(newProjectName.trim())
      setShowCreateDialog(false)
      setNewProjectName('')
    }
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <Button
          key={project.id}
          variant={activeProjectId === project.id ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-2",
            activeProjectId === project.id && "bg-muted"
          )}
          onClick={() => onProjectChange(project.id)}
        >
          <Folder className="h-4 w-4" />
          {project.name}
        </Button>
      ))}

      <Button
        variant="ghost"
        className="w-full justify-start gap-2"
        onClick={() => setShowCreateDialog(true)}
      >
        <Plus className="h-4 w-4" />
        New Project
      </Button>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Projects keep chats, files, and custom instructions in one place. Use them for ongoing work, or just to keep things tidy.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="name"
                placeholder="E.g. Birthday Party Planning"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProject()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 