'use client'

import { useState, useEffect } from 'react'

interface VisualSliderProps {
  label: string
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  helpText?: string
}

export function VisualSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = 'px',
  helpText,
}: VisualSliderProps) {
  // Parse numeric value from string (e.g., "0.5rem" -> 0.5, "16px" -> 16)
  const parseValue = (val: string): number => {
    const numericValue = parseFloat(val.replace(/[^0-9.]/g, ''))
    return isNaN(numericValue) ? min : numericValue
  }

  const [numericValue, setNumericValue] = useState(parseValue(value))

  useEffect(() => {
    setNumericValue(parseValue(value))
  }, [value, min])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    setNumericValue(newValue)
    onChange(`${newValue}${unit}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    if (!isNaN(newValue)) {
      setNumericValue(newValue)
      onChange(`${newValue}${unit}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-white">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={numericValue}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className="w-16 px-2 py-1 bg-neutral-900 border border-neutral-600 rounded text-white text-xs text-right focus:outline-none focus:border-blue-500"
          />
          <span className="text-xs text-neutral-400 w-8">{unit}</span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        value={numericValue}
        onChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, var(--conductor-primary) 0%, var(--conductor-primary) ${
            ((numericValue - min) / (max - min)) * 100
          }%, rgb(64, 64, 64) ${((numericValue - min) / (max - min)) * 100}%, rgb(64, 64, 64) 100%)`,
        }}
      />

      {helpText && <p className="text-xs text-neutral-500 mt-1">{helpText}</p>}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}
