'use client'

import { forwardRef, HTMLAttributes, createContext, useContext, useState } from 'react'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value: controlledValue, onValueChange, children, className = '', ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '')

    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue
    const handleValueChange = (newValue: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(newValue)
      }
      onValueChange?.(newValue)
    }

    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)

Tabs.displayName = 'Tabs'

type TabsListProps = HTMLAttributes<HTMLDivElement>

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg bg-neutral-900 p-1 gap-1 ${className}`}
        {...props}
      />
    )
  }
)

TabsList.displayName = 'TabsList'

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className = '', ...props }, ref) => {
    const context = useContext(TabsContext)

    if (!context) {
      throw new Error('TabsTrigger must be used within Tabs')
    }

    const { value: selectedValue, onValueChange } = context
    const isSelected = value === selectedValue

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        onClick={() => onValueChange(value)}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 ${
          isSelected
            ? 'bg-neutral-800 text-white shadow-sm'
            : 'text-neutral-400 hover:text-neutral-300'
        } ${className}`}
        {...props}
      />
    )
  }
)

TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className = '', ...props }, ref) => {
    const context = useContext(TabsContext)

    if (!context) {
      throw new Error('TabsContent must be used within Tabs')
    }

    const { value: selectedValue } = context

    if (value !== selectedValue) {
      return null
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={`mt-2 ${className}`}
        {...props}
      />
    )
  }
)

TabsContent.displayName = 'TabsContent'
