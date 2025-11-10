'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/agents', label: 'Agents' },
  { href: '/intelligence', label: 'Intelligence' }
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-xl font-semibold text-white">
            Conductor
          </Link>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
