import { ButtonHTMLAttributes, CSSProperties } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'transition-colors',
    secondary: 'transition-colors border',
    danger: 'transition-colors',
    ghost: 'transition-colors',
    outline: 'transition-colors border'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  // Generate inline styles based on variant using CSS variables
  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      backgroundColor: 'var(--conductor-button-primary-bg)',
      color: 'var(--conductor-button-primary-text)',
      borderColor: 'var(--conductor-button-primary-border)',
      borderRadius: 'var(--conductor-button-radius)',
    },
    secondary: {
      backgroundColor: 'var(--conductor-button-secondary-bg)',
      color: 'var(--conductor-button-secondary-text)',
      borderColor: 'var(--conductor-button-secondary-border)',
      borderRadius: 'var(--conductor-button-radius)',
    },
    danger: {
      backgroundColor: 'var(--conductor-danger)',
      color: '#ffffff',
      borderRadius: 'var(--conductor-button-radius)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--conductor-body-color)',
      borderRadius: 'var(--conductor-button-radius)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--conductor-body-color)',
      borderColor: 'var(--conductor-button-secondary-border)',
      borderRadius: 'var(--conductor-button-radius)',
    }
  }

  return (
    <button
      className={`font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  )
}
