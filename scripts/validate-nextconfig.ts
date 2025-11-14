#!/usr/bin/env tsx
/**
 * Next.js Config Validator (Layer 6)
 * Validates next.config.mjs against Next.js 14 schema and best practices
 * Prevents invalid configurations from reaching Vercel
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface ValidationIssue {
  type: 'error' | 'warning'
  message: string
  fix?: string
}

const issues: ValidationIssue[] = []

/**
 * Known deprecated Next.js config options (as of Next.js 14)
 */
const DEPRECATED_OPTIONS = [
  'target', // Removed in Next.js 12.2
  'experimental.concurrentFeatures', // Removed in Next.js 13
  'experimental.serverComponents', // Removed in Next.js 13
  'experimental.reactRoot', // Removed in Next.js 13
  'experimental.newNextLinkBehavior', // Default in Next.js 13
  'swcMinify', // Default in Next.js 13
]

/**
 * Known invalid experimental flags
 */
const INVALID_EXPERIMENTAL = [
  'invalidFlag',
  'nonExistentOption',
]

/**
 * Required config for Vercel deployment
 */
const VERCEL_REQUIREMENTS = {
  // Add any Vercel-specific requirements here
}

/**
 * Validate Next.js config file
 */
function validateNextConfig(): void {
  const configPath = join(process.cwd(), 'next.config.mjs')

  console.log('🔍 Validating Next.js Configuration...\n')

  // Check if config exists
  if (!existsSync(configPath)) {
    issues.push({
      type: 'error',
      message: 'next.config.mjs not found',
      fix: 'Create a next.config.mjs file in the project root',
    })
    return
  }

  try {
    const configContent = readFileSync(configPath, 'utf-8')

    // Check for deprecated options
    DEPRECATED_OPTIONS.forEach(option => {
      const optionPath = option.split('.')
      const lastPart = optionPath[optionPath.length - 1]

      // Simple pattern matching for the option
      const pattern = new RegExp(`['"]?${lastPart}['"]?\\s*:`, 'g')

      if (pattern.test(configContent)) {
        issues.push({
          type: 'error',
          message: `Deprecated Next.js option detected: ${option}`,
          fix: `Remove '${option}' from your config - it's no longer supported in Next.js 14`,
        })
      }
    })

    // Check for proper export
    if (!configContent.includes('export default')) {
      issues.push({
        type: 'error',
        message: 'Config must use ES modules export (export default)',
        fix: 'Use "export default nextConfig" instead of module.exports',
      })
    }

    // Check for TypeScript type annotation
    if (!configContent.includes('@type {import(\'next\').NextConfig}')) {
      issues.push({
        type: 'warning',
        message: 'Missing TypeScript type annotation for NextConfig',
        fix: 'Add /** @type {import(\'next\').NextConfig} */ above your config',
      })
    }

    // Validate webpack config if present
    if (configContent.includes('webpack:')) {
      // Check if webpack function returns config
      const webpackFunctionMatch = configContent.match(/webpack:\s*\(([^)]*)\)\s*=>\s*{([^}]*)}/s)

      if (webpackFunctionMatch) {
        const webpackBody = webpackFunctionMatch[2]

        if (!webpackBody.includes('return config')) {
          issues.push({
            type: 'error',
            message: 'webpack config function must return the config object',
            fix: 'Add "return config" at the end of your webpack function',
          })
        }
      }
    }

    // Check for output mode configuration
    if (configContent.includes('output:')) {
      const outputMatch = configContent.match(/output:\s*['"]([^'"]+)['"]/)

      if (outputMatch) {
        const outputMode = outputMatch[1]
        const validOutputs = ['standalone', 'export']

        if (!validOutputs.includes(outputMode)) {
          issues.push({
            type: 'error',
            message: `Invalid output mode: ${outputMode}`,
            fix: `Use one of: ${validOutputs.join(', ')}`,
          })
        }

        // Warn about 'export' mode with API routes
        if (outputMode === 'export') {
          issues.push({
            type: 'warning',
            message: 'output: "export" cannot be used with API routes',
            fix: 'Remove API routes or use a different output mode',
          })
        }
      }
    }

    // Check for common mistakes
    const commonMistakes = [
      {
        pattern: /images:\s*{\s*domains:\s*\[/,
        message: 'images.domains is deprecated in Next.js 14',
        fix: 'Use images.remotePatterns instead',
      },
      {
        pattern: /experimental:\s*{\s*appDir:\s*true/,
        message: 'experimental.appDir is now stable (no longer experimental)',
        fix: 'Remove experimental.appDir - App Router is stable in Next.js 14',
      },
      {
        pattern: /module\.exports\s*=/,
        message: 'CommonJS syntax detected',
        fix: 'Use ES modules: export default nextConfig',
      },
    ]

    commonMistakes.forEach(({ pattern, message, fix }) => {
      if (pattern.test(configContent)) {
        issues.push({
          type: 'error',
          message,
          fix,
        })
      }
    })

    // Check for Sentry configuration if imported
    if (configContent.includes('@sentry/nextjs')) {
      if (!configContent.includes('withSentryConfig')) {
        issues.push({
          type: 'warning',
          message: 'Sentry imported but withSentryConfig not used',
          fix: 'Wrap your config with withSentryConfig()',
        })
      }
    }

    // Validate that config is actually exported
    if (!configContent.match(/export\s+default\s+\w+/)) {
      issues.push({
        type: 'error',
        message: 'No default export found',
        fix: 'Ensure you export your Next.js config with "export default"',
      })
    }

    // Check for proper conditional logic
    if (configContent.includes('process.env.') && !configContent.includes('process.env.BUILD_')) {
      issues.push({
        type: 'warning',
        message: 'Direct process.env access detected in config',
        fix: 'Ensure env vars are available during build time or use build-time flags like BUILD_*',
      })
    }

  } catch (error) {
    issues.push({
      type: 'error',
      message: `Failed to read next.config.mjs: ${error}`,
    })
  }
}

/**
 * Print validation results
 */
function printResults(): void {
  console.log('📊 Validation Results')
  console.log('='.repeat(60))
  console.log('')

  if (issues.length === 0) {
    console.log('✅ Next.js configuration is valid!')
    console.log('✅ No issues detected.')
    console.log('')
    process.exit(0)
  }

  const errors = issues.filter(i => i.type === 'error')
  const warnings = issues.filter(i => i.type === 'warning')

  // Print errors
  if (errors.length > 0) {
    console.log('❌ Errors:')
    errors.forEach((error, index) => {
      console.log(`\n  ${index + 1}. ${error.message}`)
      if (error.fix) {
        console.log(`     💡 Fix: ${error.fix}`)
      }
    })
    console.log('')
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:')
    warnings.forEach((warning, index) => {
      console.log(`\n  ${index + 1}. ${warning.message}`)
      if (warning.fix) {
        console.log(`     💡 Fix: ${warning.fix}`)
      }
    })
    console.log('')
  }

  console.log('='.repeat(60))
  console.log(`Total: ${errors.length} errors, ${warnings.length} warnings`)
  console.log('')

  if (errors.length > 0) {
    console.log('❌ Validation failed!')
    console.log('Fix the errors above before deploying.')
    console.log('')
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.log('⚠️  Validation passed with warnings.')
    console.log('Consider addressing warnings for better performance and compatibility.')
    console.log('')
  }

  process.exit(0)
}

// Run validation
validateNextConfig()
printResults()
