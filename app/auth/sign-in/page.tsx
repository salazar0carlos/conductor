'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SignInPage() {
  const { user, signInWithGitHub } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect to dashboard if already signed in
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await signInWithGitHub()
    } catch (err) {
      setError('Failed to sign in. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Conductor</h1>
          <p className="text-neutral-400">AI Agent Orchestration System</p>
        </div>

        {/* Sign In Card */}
        <div className="border border-neutral-800 rounded-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">Sign In</h2>
            <p className="text-sm text-neutral-400">
              Sign in with your GitHub account to continue
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-neutral-200"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Sign in with GitHub</span>
              </>
            )}
          </Button>

          <div className="text-center text-xs text-neutral-500">
            By signing in, you agree to use this application in accordance with
            its intended purpose
          </div>
        </div>

        {/* Info Section */}
        <div className="text-center">
          <p className="text-sm text-neutral-500">
            Need help?{' '}
            <a href="mailto:support@conductor.dev" className="text-neutral-400 hover:text-white">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
