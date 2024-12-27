import { FC } from 'react'

interface CodeUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: Array<{name: string, content: string}>) => void
}

export declare const CodeUploadDialog: FC<CodeUploadDialogProps> 