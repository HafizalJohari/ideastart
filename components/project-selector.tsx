'use client'

import * as React from "react"
import { Plus, Folder, ChevronRight, ChevronDown } from "lucide-react"
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
import type { Project, ProjectFile, ProjectFolder } from "@/lib/types"
import { ProjectFiles } from "@/components/project-files"

interface ProjectSelectorProps {
  projects: Project[]
  activeProjectId: string | null
  onProjectChange: (projectId: string | null) => void
  onProjectCreate: (name: string) => void
  onProjectDelete?: (projectId: string) => void
  onCreateFolder: (projectId: string, name: string) => void
  onCreateFile: (projectId: string, folderId: string, file: Omit<ProjectFile, 'id' | 'createdAt' | 'updatedAt'>) => void
  onDeleteFolder: (projectId: string, folderId: string) => void
  onDeleteFile: (projectId: string, folderId: string, fileId: string) => void
}

export function ProjectSelector({
  projects,
  activeProjectId,
  onProjectChange,
  onProjectCreate,
  onProjectDelete,
  onCreateFolder,
  onCreateFile,
  onDeleteFolder,
  onDeleteFile
}: ProjectSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [newProjectName, setNewProjectName] = React.useState('')
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set())

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onProjectCreate(newProjectName.trim())
      setShowCreateDialog(false)
      setNewProjectName('')
    }
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {projects.map((project) => (
          <div key={project.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toggleProject(project.id)}
              >
                {expandedProjects.has(project.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant={activeProjectId === project.id ? "secondary" : "ghost"}
                className={cn(
                  "flex-1 justify-start gap-2",
                  activeProjectId === project.id && "bg-muted"
                )}
                onClick={() => onProjectChange(project.id)}
              >
                <Folder className="h-4 w-4" />
                {project.name}
              </Button>
            </div>
            
            {expandedProjects.has(project.id) && (
              <div className="pl-8">
                <ProjectFiles
                  project={project}
                  onCreateFolder={onCreateFolder}
                  onCreateFile={onCreateFile}
                  onDeleteFolder={onDeleteFolder}
                  onDeleteFile={onDeleteFile}
                />
              </div>
            )}
          </div>
        ))}

        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

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