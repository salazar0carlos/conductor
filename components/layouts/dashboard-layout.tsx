'use client';

import React, { ReactNode } from 'react';
import Nav from '@/components/ui/nav';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Standardized dashboard layout component that ensures design consistency
 * across all pages in the application.
 *
 * Features:
 * - Consistent dark theme background (bg-neutral-950)
 * - Integrated navigation component
 * - Standard spacing and typography
 * - Optional title, subtitle, and header actions
 * - Responsive container with configurable width
 *
 * Usage:
 * ```tsx
 * <DashboardLayout
 *   title="Page Title"
 *   subtitle="Page description"
 *   headerActions={<Button>Action</Button>}
 * >
 *   <YourPageContent />
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  children,
  title,
  subtitle,
  headerActions,
  fullWidth = false,
  className = '',
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />
      <main className={`${fullWidth ? 'w-full' : 'container mx-auto'} px-4 py-8 ${className}`}>
        {(title || subtitle || headerActions) && (
          <div className="mb-8 flex items-start justify-between">
            <div>
              {title && (
                <h1
                  className="text-3xl font-bold text-white mb-2"
                  style={{
                    fontFamily: 'var(--conductor-title-font)',
                  }}
                >
                  {title}
                </h1>
              )}
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
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
