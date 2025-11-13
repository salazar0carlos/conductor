#!/usr/bin/env tsx
/**
 * Pre-Build Validation Script
 * Scans codebase for anti-patterns that cause build failures
 * Run this before every build to catch issues early
 */

import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

interface ValidationError {
  file: string
  line: number
  pattern: string
  message: string
  severity: 'error' | 'warning'
}

const errors: ValidationError[] = []

/**
 * Anti-patterns to detect
 */
const ANTI_PATTERNS = [
  {
    // Module-level createClient calls
    pattern: /^(const|let|var)\s+\w+\s*=\s*createClient\(/m,
    message: 'Module-level Supabase client initialization detected. Move to function scope.',
    severity: 'error' as const,
    exclude: ['lib/supabase/client.ts', 'lib/supabase/server.ts'], // These are factory functions, OK
  },
  {
    // Constructor-level createClient calls
    pattern: /constructor\s*\([^)]*\)\s*\{[\s\S]{0,300}createClient\(/m,
    message: 'Constructor-level Supabase client initialization detected. Use getSupabaseClient() method instead.',
    severity: 'error' as const,
    exclude: [],
  },
  {
    // Module-level process.env access
    pattern: /^(const|let|var)\s+\w+\s*=\s*process\.env\./m,
    message: 'Module-level environment variable access detected. Access env vars at runtime only.',
    severity: 'warning' as const,
    exclude: ['lib/env-validation.ts', 'next.config.mjs', 'scripts/'],
  },
  {
    // Direct process.env access in Supabase client creation (should use factory)
    pattern: /createClient\([^)]*process\.env/,
    message: 'Direct env var usage in createClient. Use a factory function or getSupabaseClient() method.',
    severity: 'error' as const,
    exclude: [
      'lib/supabase/client.ts',
      'lib/supabase/server.ts',
      'lib/audit/compliance.ts', // Has getSupabaseClient() method
      'lib/audit/logger.ts', // Has getSupabaseClient() method
      'scripts/', // Test scripts are OK
      'test-', // Test files OK
    ],
  },
]

/**
 * Recursively scan directory for TypeScript/JavaScript files
 */
function scanDirectory(dir: string, files: string[] = []): string[] {
  try {
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)

      // Skip node_modules, .next, .git
      if (item === 'node_modules' || item === '.next' || item === '.git' || item === 'dist') {
        continue
      }

      try {
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          scanDirectory(fullPath, files)
        } else if (
          item.endsWith('.ts') ||
          item.endsWith('.tsx') ||
          item.endsWith('.js') ||
          item.endsWith('.jsx')
        ) {
          files.push(fullPath)
        }
      } catch (err) {
        // Skip files we can't read
        continue
      }
    }
  } catch (err) {
    // Skip directories we can't read
    return files
  }

  return files
}

/**
 * Check if file should be excluded for a specific pattern
 */
function shouldExclude(filePath: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    if (pattern.endsWith('/')) {
      // Directory exclusion
      return filePath.includes(pattern)
    }
    // File exclusion
    return filePath.includes(pattern) || filePath.endsWith(pattern)
  })
}

/**
 * Scan a single file for anti-patterns
 */
function scanFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    for (const antiPattern of ANTI_PATTERNS) {
      // Check if file is excluded for this pattern
      if (shouldExclude(filePath, antiPattern.exclude)) {
        continue
      }

      // Check each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (antiPattern.pattern.test(line)) {
          errors.push({
            file: filePath,
            line: i + 1,
            pattern: antiPattern.pattern.toString(),
            message: antiPattern.message,
            severity: antiPattern.severity,
          })
        }
      }

      // Also check multi-line patterns on full content
      if (antiPattern.pattern.flags?.includes('m')) {
        const matches = content.match(antiPattern.pattern)
        if (matches && matches.length > 0) {
          // Find line number of match
          const matchIndex = content.indexOf(matches[0])
          const lineNumber = content.substring(0, matchIndex).split('\n').length

          // Check if we already added this error
          const alreadyReported = errors.some(
            e => e.file === filePath && Math.abs(e.line - lineNumber) < 5
          )

          if (!alreadyReported) {
            errors.push({
              file: filePath,
              line: lineNumber,
              pattern: antiPattern.pattern.toString(),
              message: antiPattern.message,
              severity: antiPattern.severity,
            })
          }
        }
      }
    }
  } catch (err) {
    console.warn(`⚠️  Could not scan ${filePath}:`, err)
  }
}

/**
 * Main validation function
 */
function validateBuild(): void {
  console.log('🔍 Scanning codebase for anti-patterns...\n')

  const startTime = Date.now()

  // Scan app and lib directories
  const files = [
    ...scanDirectory('app'),
    ...scanDirectory('lib'),
    ...scanDirectory('components'),
  ]

  console.log(`📁 Scanning ${files.length} files...\n`)

  // Scan each file
  for (const file of files) {
    scanFile(file)
  }

  const duration = Date.now() - startTime

  // Report results
  const errorCount = errors.filter(e => e.severity === 'error').length
  const warningCount = errors.filter(e => e.severity === 'warning').length

  if (errors.length === 0) {
    console.log('✅ No anti-patterns detected!')
    console.log(`✅ Scanned ${files.length} files in ${duration}ms`)
    console.log('✅ Build validation passed!\n')
    process.exit(0)
  }

  console.log('❌ Anti-patterns detected:\n')

  // Group by file
  const errorsByFile = new Map<string, ValidationError[]>()
  for (const error of errors) {
    if (!errorsByFile.has(error.file)) {
      errorsByFile.set(error.file, [])
    }
    errorsByFile.get(error.file)!.push(error)
  }

  // Print errors grouped by file
  Array.from(errorsByFile.entries()).forEach(([file, fileErrors]) => {
    const relPath = file.replace(process.cwd() + '/', '')
    console.log(`📄 ${relPath}`)

    for (const error of fileErrors) {
      const icon = error.severity === 'error' ? '❌' : '⚠️ '
      console.log(`  ${icon} Line ${error.line}: ${error.message}`)
    }
    console.log()
  })

  console.log(`\n📊 Summary:`)
  console.log(`  ❌ ${errorCount} errors`)
  console.log(`  ⚠️  ${warningCount} warnings`)
  console.log(`  📁 ${files.length} files scanned`)
  console.log(`  ⏱️  ${duration}ms`)

  if (errorCount > 0) {
    console.log('\n❌ Build validation failed due to errors!')
    console.log('Fix the errors above before building.\n')
    process.exit(1)
  }

  if (warningCount > 0) {
    console.log('\n⚠️  Build validation passed with warnings.')
    console.log('Consider fixing warnings to improve code quality.\n')
  }

  process.exit(0)
}

// Run validation
validateBuild()
