'use client';

import React, { ReactNode } from 'react';

interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'card';
}

/**
 * Standardized content section component for organizing page content.
 *
 * Features:
 * - Optional title and subtitle
 * - Optional action buttons
 * - Two variants: default (no background) and card (with border and background)
 * - Consistent spacing
 *
 * Usage:
 * ```tsx
 * <ContentSection
 *   title="Recent Activity"
 *   subtitle="View your latest workflow executions"
 *   variant="card"
 * >
 *   <YourContent />
 * </ContentSection>
 * ```
 */
export function ContentSection({
  title,
  subtitle,
  actions,
  children,
  className = '',
  variant = 'default',
}: ContentSectionProps) {
  const containerClasses = variant === 'card'
    ? 'border border-neutral-800 rounded-lg p-6 bg-neutral-900/50'
    : '';

  return (
    <div className={`mb-8 ${containerClasses} ${className}`}>
      {(title || subtitle || actions) && (
        <div className={`flex items-start justify-between ${variant === 'card' ? 'mb-6' : 'mb-4'}`}>
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-white mb-1">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export default ContentSection;
