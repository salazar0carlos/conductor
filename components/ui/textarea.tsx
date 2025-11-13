import { TextareaHTMLAttributes, forwardRef } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none ${className}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
