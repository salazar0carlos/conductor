'use client';

import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Standardized page header component for consistent title and action layouts.
 *
 * Features:
 * - Consistent typography and spacing
 * - Optional icon, subtitle, and action buttons
 * - Responsive layout that stacks on mobile
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Workflows"
 *   subtitle="Manage your automation workflows"
 *   icon={<WorkflowIcon />}
 *   actions={<Button>Create Workflow</Button>}
 * />
 * ```
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex-shrink-0 mt-1 text-neutral-400">
              {icon}
            </div>
          )}
          <div>
            <h1
              className="text-3xl font-bold text-white mb-2"
              style={{
                fontFamily: 'var(--conductor-title-font)',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-neutral-400"
                style={{
                  fontFamily: 'var(--conductor-body-font)',
                  fontSize: 'var(--conductor-body-size)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
