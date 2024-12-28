import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Volume2, FileText, Moon, Download, Upload, RotateCcw, Trash2, Bug, BarChart } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

interface AdvancedSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  soundEnabled: boolean
  onSoundEnabledChange: (enabled: boolean) => void
  markdownEnabled: boolean
  onMarkdownEnabledChange: (enabled: boolean) => void
  darkMode: boolean
  onDarkModeChange: (enabled: boolean) => void
  debugMode: boolean
  onDebugModeChange: (enabled: boolean) => void
  onExportChats: () => void
  onImportChats: () => void
  onResetSettings: () => void
  onClearAllData: () => void
}

export function AdvancedSettingsDialog({
  open,
  onOpenChange,
  soundEnabled,
  onSoundEnabledChange,
  markdownEnabled,
  onMarkdownEnabledChange,
  darkMode,
  onDarkModeChange,
  debugMode,
  onDebugModeChange,
  onExportChats,
  onImportChats,
  onResetSettings,
  onClearAllData
}: AdvancedSettingsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Advanced Settings</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-6">
          {/* Interface Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Interface</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <Label htmlFor="sound">Sound Notifications</Label>
              </div>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={onSoundEnabledChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <div className="flex flex-col">
                  <Label htmlFor="markdown">Markdown Formatting</Label>
                  <span className="text-sm text-muted-foreground">Enable rich text formatting</span>
                </div>
              </div>
              <Switch
                id="markdown"
                checked={markdownEnabled}
                onCheckedChange={onMarkdownEnabledChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={onDarkModeChange}
              />
            </div>
          </div>

          <Separator />

          {/* Data Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full flex gap-2 items-center justify-center"
                onClick={onExportChats}
              >
                <Download className="h-4 w-4" />
                Export Chats
              </Button>
              
              <Button
                variant="outline"
                className="w-full flex gap-2 items-center justify-center"
                onClick={onImportChats}
              >
                <Upload className="h-4 w-4" />
                Import Chats
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full flex gap-2 items-center justify-center"
                onClick={onResetSettings}
              >
                <RotateCcw className="h-4 w-4" />
                Reset Settings
              </Button>
              
              <Button
                variant="destructive"
                className="w-full flex gap-2 items-center justify-center"
                onClick={onClearAllData}
              >
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </Button>
            </div>
          </div>

          <Separator />

          {/* Advanced Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Advanced</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                <div className="flex flex-col">
                  <Label htmlFor="debug">Debug Mode</Label>
                  <span className="text-sm text-muted-foreground">Show technical information</span>
                </div>
              </div>
              <Switch
                id="debug"
                checked={debugMode}
                onCheckedChange={onDebugModeChange}
              />
            </div>

            <Link 
              href="/analytics" 
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <BarChart className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Analytics</span>
                <span className="text-sm text-muted-foreground">View usage statistics and insights</span>
              </div>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 