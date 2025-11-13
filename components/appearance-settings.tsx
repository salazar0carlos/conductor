'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  PlatformTheme,
  useTheme,
  getAllPresets,
} from '@/lib/platform-theme'
import {
  RefreshCw,
  Palette,
  Save,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

export function AppearanceSettings() {
  const {
    theme,
    setTheme,
    saveTheme,
    resetTheme,
    loading,
  } = useTheme()

  const [localTheme, setLocalTheme] = useState<PlatformTheme>(theme)
  const [presets] = useState(getAllPresets())

  // Sync local theme with context theme
  useEffect(() => {
    setLocalTheme(theme)
  }, [theme])

  // Apply changes immediately as user edits
  useEffect(() => {
    setTheme(localTheme)
  }, [localTheme, setTheme])

  const handleSave = async () => {
    try {
      await saveTheme()
      toast.success('Theme saved successfully')
    } catch (err) {
      toast.error('Failed to save theme')
    }
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset to default theme?')) {
      try {
        await resetTheme()
        toast.success('Theme reset to default')
      } catch (err) {
        toast.error('Failed to reset theme')
      }
    }
  }

  const handlePresetSelect = (preset: PlatformTheme) => {
    setLocalTheme(preset)
    toast.success(`Applied ${preset.name} preset`)
  }

  const updateColor = (colorType: 'accent' | 'titleColor' | 'bodyColor', value: string) => {
    if (colorType === 'accent') {
      setLocalTheme({
        ...localTheme,
        colors: {
          ...localTheme.colors,
          primary: value,
        },
        buttons: {
          ...localTheme.buttons,
          primaryBg: localTheme.id === 'tron' ? 'transparent' : value,
        },
        inputs: {
          ...localTheme.inputs,
          focusBorder: value,
        },
      })
    } else if (colorType === 'titleColor') {
      setLocalTheme({
        ...localTheme,
        typography: {
          ...localTheme.typography,
          titleColor: value,
        },
      })
    } else {
      setLocalTheme({
        ...localTheme,
        typography: {
          ...localTheme.typography,
          bodyColor: value,
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Platform Appearance</h2>
          <p className="text-sm text-neutral-400">
            Choose a preset and customize colors
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleReset} disabled={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Theme
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Theme Presets */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Choose Your Style
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {presets.map((preset) => {
            const isSelected = localTheme.id === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`relative p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                  isSelected
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
                style={{
                  backgroundColor: preset.cards.background,
                }}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Preview */}
                  <div className="space-y-2">
                    <div
                      className="h-3 rounded"
                      style={{
                        backgroundColor: preset.buttons.primaryBg === 'transparent'
                          ? preset.colors.primary
                          : preset.buttons.primaryBg
                      }}
                    />
                    <div
                      className="h-2 w-3/4 rounded"
                      style={{ backgroundColor: preset.cards.border }}
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <div
                      className="text-lg font-bold mb-1"
                      style={{ color: preset.typography.titleColor }}
                    >
                      {preset.name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: preset.typography.mutedColor }}
                    >
                      {preset.id === 'minimal' && 'Clean, spacious, minimal distractions'}
                      {preset.id === 'modern' && 'Contemporary, professional dark theme'}
                      {preset.id === 'tron' && 'Tech-forward cyberpunk aesthetic'}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Simple Color Customization */}
      <div className="space-y-4 p-6 rounded-lg bg-neutral-800 border border-neutral-700">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Customize Colors
        </h3>

        <p className="text-xs text-neutral-400">
          Fine-tune the selected preset by adjusting these key colors
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Accent Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Accent Color
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              Primary buttons and links
            </p>
            <div className="flex gap-2">
              <input
                type="color"
                value={localTheme.colors.primary}
                onChange={(e) => updateColor('accent', e.target.value)}
                className="w-14 h-14 rounded-lg border-2 border-neutral-600 cursor-pointer"
              />
              <input
                type="text"
                value={localTheme.colors.primary}
                onChange={(e) => updateColor('accent', e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="#3b82f6"
              />
            </div>
          </div>

          {/* Title Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Title Color
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              Headings and page titles
            </p>
            <div className="flex gap-2">
              <input
                type="color"
                value={localTheme.typography.titleColor}
                onChange={(e) => updateColor('titleColor', e.target.value)}
                className="w-14 h-14 rounded-lg border-2 border-neutral-600 cursor-pointer"
              />
              <input
                type="text"
                value={localTheme.typography.titleColor}
                onChange={(e) => updateColor('titleColor', e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Body Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Body Text Color
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              Regular text content
            </p>
            <div className="flex gap-2">
              <input
                type="color"
                value={localTheme.typography.bodyColor}
                onChange={(e) => updateColor('bodyColor', e.target.value)}
                className="w-14 h-14 rounded-lg border-2 border-neutral-600 cursor-pointer"
              />
              <input
                type="text"
                value={localTheme.typography.bodyColor}
                onChange={(e) => updateColor('bodyColor', e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="#e5e5e5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button onClick={handleSave} disabled={loading} className="w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Theme...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Platform Appearance
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
