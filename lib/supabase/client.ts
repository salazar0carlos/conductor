import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // Enable automatic token refresh
        autoRefreshToken: true,
        // Persist session to local storage
        persistSession: true,
        // Detect session in URL (for OAuth callbacks)
        detectSessionInUrl: true,
        // Flow type for authentication
        flowType: 'pkce',
      },
    }
  )
}
