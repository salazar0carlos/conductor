/**
 * Environment Variable Validation
 * Ensures all required environment variables are present
 * Call this at app startup to fail fast if configuration is missing
 */

export interface EnvValidationResult {
  valid: boolean
  missing: string[]
  errors: string[]
}

/**
 * List of required environment variables for the application
 */
const REQUIRED_ENV_VARS = {
  // Supabase - Required for all database operations
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key (public)',

  // Server-side Supabase - Required for API routes
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (server-only)',

  // AI Providers - At least one required
  // Note: These are validated separately since at least ONE is required, not all
} as const

/**
 * Optional but recommended environment variables
 */
const OPTIONAL_ENV_VARS = {
  OPENAI_API_KEY: 'OpenAI API key for GPT models',
  ANTHROPIC_API_KEY: 'Anthropic API key for Claude models',
  GOOGLE_AI_API_KEY: 'Google AI API key for Gemini models',
  GROQ_API_KEY: 'Groq API key for fast inference',
} as const

/**
 * Validates that all required environment variables are present
 * @param throwOnError - If true, throws an error when validation fails
 * @returns Validation result with details about missing variables
 */
export function validateEnv(throwOnError: boolean = false): EnvValidationResult {
  const missing: string[] = []
  const errors: string[] = []

  // Check required variables
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!process.env[key]) {
      missing.push(key)
      errors.push(`Missing required environment variable: ${key} (${description})`)
    }
  }

  // Check that at least one AI provider key is present
  const aiKeys = Object.keys(OPTIONAL_ENV_VARS)
  const hasAnyAIKey = aiKeys.some(key => process.env[key])

  if (!hasAnyAIKey) {
    errors.push(
      `At least one AI provider API key is required. Set one of: ${aiKeys.join(', ')}`
    )
  }

  const result: EnvValidationResult = {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  }

  if (!result.valid && throwOnError) {
    throw new Error(
      `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
    )
  }

  return result
}

/**
 * Validates environment variables and logs warnings for missing optional vars
 * This is the recommended function to call at app startup
 */
export function validateEnvWithWarnings(): void {
  console.log('🔍 Validating environment variables...')

  const result = validateEnv(false)

  if (!result.valid) {
    console.error('❌ Environment validation failed!')
    result.errors.forEach(error => {
      console.error(`  ❌ ${error}`)
    })
    throw new Error('Required environment variables are missing. Check logs above.')
  }

  // Check optional variables and warn if missing
  const missingOptional: string[] = []
  for (const [key, description] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      missingOptional.push(`${key} (${description})`)
    }
  }

  if (missingOptional.length > 0) {
    console.warn('⚠️  Optional environment variables not set:')
    missingOptional.forEach(msg => {
      console.warn(`  ⚠️  ${msg}`)
    })
  }

  console.log('✅ Environment validation passed!')
}

/**
 * Runtime check for Supabase environment variables
 * Use this in API routes and server components to ensure env vars are available
 *
 * IMPORTANT: This should only be called at RUNTIME, never at build time
 */
export function ensureSupabaseEnv(): void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. This indicates a runtime configuration error.'
    )
  }

  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!hasAnonKey && !hasServiceKey) {
    throw new Error(
      'Neither NEXT_PUBLIC_SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is set. ' +
      'At least one Supabase key must be configured.'
    )
  }
}
