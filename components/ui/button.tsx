'use client'

import { ButtonHTMLAttributes, CSSProperties, useState } from 'react'

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
  disabled,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const variants = {
    primary: 'transition-all border',
    secondary: 'transition-all border',
    danger: 'transition-all',
    ghost: 'transition-all',
    outline: 'transition-all border'
  }

  const sizes = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3'
  }

  // Generate inline styles based on variant using CSS variables
  const getVariantStyles = (): CSSProperties => {
    const baseStyles: CSSProperties = {
      fontFamily: 'var(--conductor-body-font)',
      fontSize: 'var(--conductor-button-font-size)',
      fontWeight: 'var(--conductor-button-font-weight)',
      borderRadius: 'var(--conductor-button-radius)',
      borderWidth: 'var(--conductor-button-border-width)',
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: isHovered && !disabled
            ? 'var(--conductor-button-primary-hover-bg)'
            : 'var(--conductor-button-primary-bg)',
          color: 'var(--conductor-button-primary-text)',
          borderColor: 'var(--conductor-button-primary-border)',
        }
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: isHovered && !disabled
            ? 'var(--conductor-button-secondary-hover-bg)'
            : 'var(--conductor-button-secondary-bg)',
          color: 'var(--conductor-button-secondary-text)',
          borderColor: 'var(--conductor-button-secondary-border)',
        }
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: isHovered && !disabled
            ? 'var(--conductor-danger-hover)'
            : 'var(--conductor-danger)',
          color: '#ffffff',
          borderColor: 'transparent',
        }
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: isHovered && !disabled ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          color: 'var(--conductor-body-color)',
          borderColor: 'transparent',
        }
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: isHovered && !disabled ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          color: 'var(--conductor-body-color)',
          borderColor: 'var(--conductor-button-secondary-border)',
        }
      default:
        return baseStyles
    }
  }

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      style={{ ...getVariantStyles(), ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
