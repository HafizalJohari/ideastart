import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileCode, X, Upload } from 'lucide-react'

interface CodeUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: Array<{name: string, content: string}>) => void
}

export function CodeUploadDialog({ open, onOpenChange, onUpload }: CodeUploadDialogProps) {
  const [files, setFiles] = React.useState<Array<{name: string, content: string}>>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const fileContents = await Promise.all(
      selectedFiles.map(async (file) => {
        const content = await file.text()
        return {
          name: file.name,
          content
        }
      })
    )
    setFiles(prev => [...prev, ...fileContents])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    onUpload(files)
    setFiles([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Code Files</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.rb,.php,.go,.rs,.swift"
              className="hidden"
              multiple
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex gap-2 items-center"
            >
              <FileCode className="h-4 w-4" />
              Select Files
            </Button>
          </div>

          {files.length > 0 && (
            <div className="flex flex-col gap-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="truncate">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFiles([])
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={files.length === 0}
              className="flex gap-2 items-center"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 