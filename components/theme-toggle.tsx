"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // After mounting, we have access to the theme
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering the icons until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4" />
          <span className="text-sm">Dark Mode</span>
        </div>
        <Switch
          checked={false}
          onCheckedChange={() => {}}
          aria-label="Toggle dark mode"
        />
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isDark ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
        <span className="text-sm">Dark Mode</span>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle dark mode"
      />
    </div>
  )
} 