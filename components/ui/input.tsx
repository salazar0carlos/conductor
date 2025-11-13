import { InputHTMLAttributes, forwardRef, CSSProperties } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', style, ...props }, ref) => {
    const inputStyle: CSSProperties = {
      backgroundColor: 'var(--conductor-input-background)',
      border: 'var(--conductor-input-border-width) solid var(--conductor-input-border)',
      borderRadius: 'var(--conductor-input-radius)',
      color: 'var(--conductor-input-text)',
      fontFamily: 'var(--conductor-body-font)',
      fontSize: 'var(--conductor-body-size)',
      ...style
    }

    return (
      <input
        ref={ref}
        className={`w-full px-3 py-2 transition-all focus:outline-none ${className}`}
        style={inputStyle}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
