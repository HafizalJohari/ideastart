'use client'

import * as React from "react"
import { Folder, File, Plus, X, ChevronRight, ChevronDown } from "lucide-react"
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

interface ProjectFilesProps {
  project: Project | null
  onCreateFolder: (projectId: string, name: string) => void
  onCreateFile: (projectId: string, folderId: string, file: Omit<ProjectFile, 'id' | 'createdAt' | 'updatedAt'>) => void
  onDeleteFolder: (projectId: string, folderId: string) => void
  onDeleteFile: (projectId: string, folderId: string, fileId: string) => void
}

export function ProjectFiles({
  project,
  onCreateFolder,
  onCreateFile,
  onDeleteFolder,
  onDeleteFile
}: ProjectFilesProps) {
  const [showCreateFolderDialog, setShowCreateFolderDialog] = React.useState(false)
  const [showFileUploadDialog, setShowFileUploadDialog] = React.useState(false)
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null)
  const [newFolderName, setNewFolderName] = React.useState('')
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set())

  const handleCreateFolder = () => {
    if (project && newFolderName.trim()) {
      onCreateFolder(project.id, newFolderName.trim())
      setShowCreateFolderDialog(false)
      setNewFolderName('')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!project || !selectedFolderId) return
    
    const files = e.target.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const content = await file.text()
        onCreateFile(project.id, selectedFolderId, {
          name: file.name,
          content,
          type: 'file'
        })
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error)
      }
    }
    setShowFileUploadDialog(false)
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  if (!project) return null

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 h-8"
        onClick={() => setShowCreateFolderDialog(true)}
      >
        <Plus className="h-4 w-4" />
        New Folder
      </Button>

      {project.folders.map((folder) => (
        <div key={folder.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => toggleFolder(folder.id)}
            >
              {expandedFolders.has(folder.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <Folder className="h-4 w-4" />
              <span className="text-sm">{folder.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setSelectedFolderId(folder.id)
                setShowFileUploadDialog(true)
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onDeleteFolder(project.id, folder.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {expandedFolders.has(folder.id) && (
            <div className="pl-8 space-y-1">
              {folder.files.map((file) => (
                <div key={file.id} className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm flex-1">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onDeleteFile(project.id, folder.id, file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your project files.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFileUploadDialog} onOpenChange={setShowFileUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Select files to upload to this folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              type="file"
              multiple
              onChange={handleFileUpload}
              accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.txt"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 