#!/usr/bin/env tsx
/**
 * Comprehensive Build Verification Script (Layer 7)
 * Validates all aspects of the build to prevent Vercel deployment failures
 * This is the ultimate failsafe before code reaches production
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface VerificationResult {
  step: string
  passed: boolean
  error?: string
  warnings?: string[]
  duration: number
}

const results: VerificationResult[] = []
let totalErrors = 0
let totalWarnings = 0

/**
 * Run a verification step and track results
 */
function runStep(
  name: string,
  fn: () => { passed: boolean; error?: string; warnings?: string[] }
): void {
  console.log(`\n📋 ${name}...`)
  const startTime = Date.now()

  try {
    const result = fn()
    const duration = Date.now() - startTime

    results.push({
      step: name,
      passed: result.passed,
      error: result.error,
      warnings: result.warnings,
      duration,
    })

    if (result.passed) {
      console.log(`✅ ${name} passed (${duration}ms)`)
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(w => console.log(`⚠️  ${w}`))
        totalWarnings += result.warnings.length
      }
    } else {
      console.log(`❌ ${name} failed (${duration}ms)`)
      if (result.error) {
        console.log(`   ${result.error}`)
      }
      totalErrors++
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    results.push({
      step: name,
      passed: false,
      error: errorMessage,
      duration,
    })

    console.log(`❌ ${name} failed (${duration}ms)`)
    console.log(`   ${errorMessage}`)
    totalErrors++
  }
}

/**
 * Step 1: Validate Next.js configuration
 */
function validateNextConfig(): { passed: boolean; error?: string; warnings?: string[] } {
  const configPath = join(process.cwd(), 'next.config.mjs')

  if (!existsSync(configPath)) {
    return {
      passed: false,
      error: 'next.config.mjs not found',
    }
  }

  const warnings: string[] = []

  try {
    const configContent = readFileSync(configPath, 'utf-8')

    // Check for common Next.js config issues
    const issues: string[] = []

    // Check for invalid experimental flags
    if (configContent.includes('experimental')) {
      const deprecatedFlags = [
        'concurrentFeatures',
        'serverComponents',
        'reactRoot',
        'newNextLinkBehavior',
      ]

      deprecatedFlags.forEach(flag => {
        if (configContent.includes(flag)) {
          issues.push(`Deprecated experimental flag detected: ${flag}`)
        }
      })
    }

    // Validate webpack config if present
    if (configContent.includes('webpack:')) {
      if (!configContent.includes('return config')) {
        issues.push('webpack config must return the config object')
      }
    }

    // Check for Sentry config
    if (configContent.includes('@sentry/nextjs')) {
      warnings.push('Sentry integration detected - ensure Sentry is properly configured')
    }

    if (issues.length > 0) {
      return {
        passed: false,
        error: issues.join(', '),
      }
    }

    return {
      passed: true,
      warnings,
    }
  } catch (error) {
    return {
      passed: false,
      error: `Failed to read next.config.mjs: ${error}`,
    }
  }
}

/**
 * Step 2: TypeScript compilation check
 */
function validateTypeScript(): { passed: boolean; error?: string } {
  try {
    execSync('npx tsc --noEmit', {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    return { passed: true }
  } catch (error: any) {
    return {
      passed: false,
      error: 'TypeScript compilation failed. Run "npx tsc --noEmit" for details.',
    }
  }
}

/**
 * Step 3: ESLint validation
 */
function validateESLint(): { passed: boolean; error?: string } {
  try {
    execSync('npm run lint', {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    return { passed: true }
  } catch (error: any) {
    return {
      passed: false,
      error: 'ESLint validation failed. Run "npm run lint" for details.',
    }
  }
}

/**
 * Step 4: Validate Supabase patterns
 */
function validateSupabasePatterns(): { passed: boolean; error?: string } {
  try {
    execSync('npm run validate', {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    return { passed: true }
  } catch (error: any) {
    return {
      passed: false,
      error: 'Supabase pattern validation failed. Run "npm run validate" for details.',
    }
  }
}

/**
 * Step 5: Validate environment variables setup
 */
function validateEnvironment(): { passed: boolean; warnings?: string[] } {
  const warnings: string[] = []

  // Check for .env.local file
  if (!existsSync('.env.local')) {
    warnings.push('.env.local not found - ensure environment variables are configured')
  }

  // Check for required Vercel environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ANTHROPIC_API_KEY',
  ]

  if (existsSync('.env.local')) {
    const envContent = readFileSync('.env.local', 'utf-8')
    requiredEnvVars.forEach(envVar => {
      if (!envContent.includes(envVar)) {
        warnings.push(`Missing environment variable: ${envVar}`)
      }
    })
  }

  return {
    passed: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Step 6: Validate package.json scripts
 */
function validatePackageScripts(): { passed: boolean; warnings?: string[] } {
  const warnings: string[] = []

  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))

    // Ensure required scripts exist
    const requiredScripts = ['build', 'dev', 'lint', 'validate']

    requiredScripts.forEach(script => {
      if (!packageJson.scripts?.[script]) {
        warnings.push(`Missing required script: ${script}`)
      }
    })

    // Check for prebuild hook
    if (!packageJson.scripts?.prebuild) {
      warnings.push('No prebuild script found - consider adding validation to prebuild')
    }

    return {
      passed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    return {
      passed: false,
      error: 'Failed to read package.json',
    }
  }
}

/**
 * Step 7: Full build test (only in --full mode)
 */
function validateFullBuild(): { passed: boolean; error?: string } {
  console.log('   (This may take 30-60 seconds...)')

  try {
    execSync('npm run build', {
      stdio: 'pipe',
      encoding: 'utf-8',
    })

    // Check if .next directory was created
    if (!existsSync('.next')) {
      return {
        passed: false,
        error: '.next directory not created after build',
      }
    }

    // Check for BUILD_ID
    const buildIdPath = join('.next', 'BUILD_ID')
    if (!existsSync(buildIdPath)) {
      return {
        passed: false,
        error: 'BUILD_ID not generated after build',
      }
    }

    return { passed: true }
  } catch (error: any) {
    return {
      passed: false,
      error: 'Next.js build failed. Run "npm run build" for details.',
    }
  }
}

/**
 * Main verification function
 */
async function verifyBuild(): Promise<void> {
  const isFullMode = process.argv.includes('--full')

  console.log('🔍 Comprehensive Build Verification (Layer 7)')
  console.log('='.repeat(60))
  console.log('')
  console.log(`Mode: ${isFullMode ? 'FULL (includes build test)' : 'QUICK'}`)
  console.log('')

  const startTime = Date.now()

  // Run all verification steps
  runStep('Step 1/7: Next.js Config Validation', validateNextConfig)
  runStep('Step 2/7: TypeScript Compilation', validateTypeScript)
  runStep('Step 3/7: ESLint Validation', validateESLint)
  runStep('Step 4/7: Supabase Pattern Validation', validateSupabasePatterns)
  runStep('Step 5/7: Environment Variables', validateEnvironment)
  runStep('Step 6/7: Package.json Scripts', validatePackageScripts)

  // Only run full build in --full mode
  if (isFullMode) {
    runStep('Step 7/7: Full Build Test', validateFullBuild)
  } else {
    console.log('\n📋 Step 7/7: Full Build Test...')
    console.log('⏭️  Skipped (use --full to enable)')
  }

  const totalDuration = Date.now() - startTime

  // Print summary
  console.log('')
  console.log('='.repeat(60))
  console.log('📊 Verification Summary')
  console.log('='.repeat(60))
  console.log('')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} ${result.step} (${result.duration}ms)`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    if (result.warnings) {
      result.warnings.forEach(w => console.log(`   ⚠️  ${w}`))
    }
  })

  console.log('')
  console.log(`Total: ${passed} passed, ${failed} failed, ${totalWarnings} warnings`)
  console.log(`Duration: ${totalDuration}ms`)
  console.log('')

  if (totalErrors > 0) {
    console.log('❌ Build verification failed!')
    console.log('Fix the errors above before committing or deploying.')
    console.log('')
    process.exit(1)
  }

  if (totalWarnings > 0) {
    console.log('⚠️  Build verification passed with warnings.')
    console.log('Consider addressing warnings to improve code quality.')
    console.log('')
  } else {
    console.log('✅ All verifications passed!')
    console.log('Code is ready for commit and deployment.')
    console.log('')
  }

  process.exit(0)
}

// Run verification
verifyBuild().catch(error => {
  console.error('❌ Verification crashed:', error)
  process.exit(1)
})
