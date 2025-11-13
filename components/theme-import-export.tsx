'use client'

import { PlatformTheme } from '@/lib/platform-theme'
import { Button } from '@/components/ui/button'
import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'

interface ThemeImportExportProps {
  theme: PlatformTheme
  onImport: (theme: PlatformTheme) => void
}

export function ThemeImportExport({ theme, onImport }: ThemeImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const dataStr = JSON.stringify(theme, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `conductor-theme-${theme.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedTheme = JSON.parse(e.target?.result as string) as PlatformTheme

        // Validate that it's a valid theme
        if (
          importedTheme &&
          importedTheme.typography &&
          importedTheme.colors &&
          importedTheme.buttons &&
          importedTheme.cards &&
          importedTheme.inputs
        ) {
          onImport(importedTheme)
        } else {
          alert('Invalid theme file format')
        }
      } catch (error) {
        console.error('Error importing theme:', error)
        alert('Failed to import theme. Please check the file format.')
      }
    }
    reader.readAsText(file)

    // Reset input so the same file can be imported again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={handleExport} className="gap-2">
        <Download className="w-4 h-4" />
        Export Theme
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Import Theme
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}
