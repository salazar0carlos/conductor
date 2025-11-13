import { LabelHTMLAttributes, forwardRef } from 'react'

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium text-neutral-300 mb-1 ${className}`}
        {...props}
      />
    )
  }
)

Label.displayName = 'Label'
