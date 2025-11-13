'use client'

import { forwardRef, HTMLAttributes, createContext, useContext, useEffect } from 'react'

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined)

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

type DialogContentProps = HTMLAttributes<HTMLDivElement>

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = '', children, ...props }, ref) => {
    const context = useContext(DialogContext)

    if (!context) {
      throw new Error('DialogContent must be used within Dialog')
    }

    const { open, onOpenChange } = context

    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }
      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [open])

    if (!open) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />

        {/* Content */}
        <div
          ref={ref}
          className={`relative z-50 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl p-6 w-full mx-4 ${className}`}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)

DialogContent.displayName = 'DialogContent'

type DialogHeaderProps = HTMLAttributes<HTMLDivElement>

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mb-4 ${className}`}
        {...props}
      />
    )
  }
)

DialogHeader.displayName = 'DialogHeader'

type DialogTitleProps = HTMLAttributes<HTMLHeadingElement>

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={`text-xl font-semibold text-white ${className}`}
        {...props}
      />
    )
  }
)

DialogTitle.displayName = 'DialogTitle'

type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement>

export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`text-sm text-neutral-400 mt-2 ${className}`}
        {...props}
      />
    )
  }
)

DialogDescription.displayName = 'DialogDescription'
