'use client'

import { useState, useEffect } from 'react'
import { FONT_LIBRARY, getFontByValue, type FontOption } from '@/lib/design-system/fonts'
import { ChevronDown } from 'lucide-react'

interface FontSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  category?: FontOption['category']
}

export function FontSelector({ value, onChange, label, category }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFont, setSelectedFont] = useState<FontOption | undefined>(
    getFontByValue(value)
  )

  useEffect(() => {
    setSelectedFont(getFontByValue(value))
  }, [value])

  const fonts = category
    ? FONT_LIBRARY.filter((f) => f.category === category)
    : FONT_LIBRARY

  const handleSelect = (font: FontOption) => {
    setSelectedFont(font)
    onChange(font.value)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-white mb-2">{label}</label>
      )}

      {/* Selected Font Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 flex items-center justify-between"
      >
        <span
          className="flex-1 text-left truncate"
          style={{ fontFamily: selectedFont?.value || value }}
        >
          {selectedFont?.name || 'Select a font...'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg">
          {fonts.map((font) => (
            <button
              key={font.value}
              type="button"
              onClick={() => handleSelect(font)}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-neutral-800 flex items-center justify-between gap-2 transition-colors"
              style={{ fontFamily: font.value }}
            >
              <span className="flex-1 truncate">{font.name}</span>
              <span className="text-xs text-neutral-500 capitalize shrink-0">
                {font.category}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Close dropdown on outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
