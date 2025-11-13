'use client'

import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  fullHeight?: boolean
}

export function Dialog({ isOpen, onClose, children, maxWidth = '600px', fullHeight = false }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className="relative z-50 rounded-lg shadow-xl w-full mx-4 overflow-hidden"
        style={{
          maxWidth,
          height: fullHeight ? '90vh' : 'auto',
          maxHeight: fullHeight ? '90vh' : '90vh',
          backgroundColor: 'var(--conductor-bg)',
          color: 'var(--conductor-body-color)',
          border: '1px solid var(--conductor-button-secondary-border)'
        }}
      >
        {children}
      </div>
    </div>
  )
}
