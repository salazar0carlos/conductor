'use client'

import { PlatformTheme } from '@/lib/platform-theme'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'

interface ThemePreviewProps {
  theme: PlatformTheme
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div
      className="p-6 rounded-lg border-2 border-dashed"
      style={{
        backgroundColor: 'var(--conductor-page-background)',
        borderColor: 'var(--conductor-card-border)',
      }}
    >
      <h3
        className="mb-4"
        style={{
          fontFamily: 'var(--conductor-title-font)',
          fontSize: '1.25rem',
          fontWeight: 'var(--conductor-title-weight)',
          color: 'var(--conductor-title-color)',
        }}
      >
        Live Preview
      </h3>

      <div className="space-y-4">
        {/* Navigation Preview */}
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--conductor-nav-background)',
            border: '1px solid var(--conductor-nav-border)',
          }}
        >
          <div className="flex gap-2">
            <div
              className="px-3 py-1.5 rounded text-sm"
              style={{
                backgroundColor: 'var(--conductor-nav-item-active-bg)',
                color: 'var(--conductor-nav-item-active-color)',
              }}
            >
              Active Nav Item
            </div>
            <div
              className="px-3 py-1.5 rounded text-sm"
              style={{
                color: 'var(--conductor-nav-item-color)',
              }}
            >
              Nav Item
            </div>
          </div>
        </div>

        {/* Card Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>This is how your cards will look</CardDescription>
          </CardHeader>
          <CardContent>
            <p style={{ color: 'var(--conductor-body-color)', fontFamily: 'var(--conductor-body-font)' }}>
              Body text appears like this with your selected typography settings.
            </p>
          </CardContent>
        </Card>

        {/* Buttons Preview */}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm">
            Primary
          </Button>
          <Button variant="secondary" size="sm">
            Secondary
          </Button>
          <Button variant="danger" size="sm">
            Danger
          </Button>
          <Button variant="ghost" size="sm">
            Ghost
          </Button>
          <Button variant="outline" size="sm">
            Outline
          </Button>
        </div>

        {/* Input Preview */}
        <div>
          <Input placeholder="Input field preview" />
        </div>

        {/* Colors Preview */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="p-3 rounded text-center text-sm font-medium"
            style={{
              backgroundColor: 'var(--conductor-primary)',
              color: 'white',
            }}
          >
            Primary
          </div>
          <div
            className="p-3 rounded text-center text-sm font-medium"
            style={{
              backgroundColor: 'var(--conductor-accent)',
              color: 'white',
            }}
          >
            Accent
          </div>
          <div
            className="p-3 rounded text-center text-sm font-medium"
            style={{
              backgroundColor: 'var(--conductor-success)',
              color: 'white',
            }}
          >
            Success
          </div>
          <div
            className="p-3 rounded text-center text-sm font-medium"
            style={{
              backgroundColor: 'var(--conductor-danger)',
              color: 'white',
            }}
          >
            Danger
          </div>
        </div>
      </div>
    </div>
  )
}
