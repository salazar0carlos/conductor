'use client'

import { ThemeContextProvider } from '@/lib/platform-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContextProvider>{children}</ThemeContextProvider>
}
