'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/agents', label: 'Agents' },
  { href: '/intelligence', label: 'Intelligence' },
  { href: '/design-templates', label: 'Design' },
  { href: '/settings', label: 'Settings' }
]

export function Nav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav
      style={{
        backgroundColor: 'var(--conductor-nav-background)',
        borderBottom: '1px solid var(--conductor-nav-border)'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'var(--conductor-title-font)',
              fontSize: '1.25rem',
              fontWeight: 'var(--conductor-title-weight)',
              color: 'var(--conductor-title-color)'
            }}
          >
            Conductor
          </Link>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? 'var(--conductor-nav-item-active-bg)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--conductor-nav-item-active-color)'
                      : 'var(--conductor-nav-item-color)',
                    borderRadius: 'var(--conductor-button-radius)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--conductor-nav-item-hover-bg)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {item.label}
                </Link>
              )
            })}

            {/* Admin Settings Link - visually separated */}
            <div
              className="ml-4 pl-4"
              style={{ borderLeft: '1px solid var(--conductor-nav-border)' }}
            >
              <Link
                href="/admin/settings"
                className="px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
                style={{
                  backgroundColor: pathname?.startsWith('/admin')
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'transparent',
                  color: pathname?.startsWith('/admin')
                    ? '#f87171'
                    : 'var(--conductor-nav-item-color)',
                  border: pathname?.startsWith('/admin')
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid transparent',
                  borderRadius: 'var(--conductor-button-radius)',
                }}
                onMouseEnter={(e) => {
                  if (!pathname?.startsWith('/admin')) {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                    e.currentTarget.style.color = '#f87171'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!pathname?.startsWith('/admin')) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--conductor-nav-item-color)'
                  }
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Admin
              </Link>
            </div>

            {/* User Menu */}
            {user && (
              <div
                className="ml-4 pl-4 relative"
                style={{ borderLeft: '1px solid var(--conductor-nav-border)' }}
              >
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: 'var(--conductor-nav-item-color)',
                    borderRadius: 'var(--conductor-button-radius)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--conductor-nav-item-hover-bg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <img
                    src={user.user_metadata?.avatar_url || `https://avatar.vercel.sh/${user.email}`}
                    alt="User avatar"
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="hidden md:inline">{user.user_metadata?.user_name || user.email?.split('@')[0]}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 py-1 z-50"
                    style={{
                      backgroundColor: 'var(--conductor-card-background)',
                      border: '1px solid var(--conductor-card-border)',
                      borderRadius: 'var(--conductor-card-radius)',
                      boxShadow: 'var(--conductor-card-hover-shadow)',
                    }}
                  >
                    <div
                      className="px-4 py-2"
                      style={{ borderBottom: '1px solid var(--conductor-card-border)' }}
                    >
                      <p className="text-xs" style={{ color: 'var(--conductor-muted-color)' }}>
                        Signed in as
                      </p>
                      <p className="text-sm truncate" style={{ color: 'var(--conductor-body-color)' }}>
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm transition-colors"
                      style={{ color: 'var(--conductor-nav-item-color)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--conductor-nav-item-hover-bg)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
