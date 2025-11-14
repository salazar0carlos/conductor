#!/usr/bin/env npx tsx
/**
 * Automated Vercel Configuration Updater
 * Updates vercel.json to enable deployment for the current branch
 */

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

interface VercelConfig {
  git?: {
    deploymentEnabled?: Record<string, boolean>
  }
  github?: any
  buildCommand?: string
  installCommand?: string
  [key: string]: any
}

function getCurrentBranch(): string {
  try {
    const branch = execSync('git branch --show-current', {
      encoding: 'utf-8',
    }).trim()
    return branch
  } catch (error) {
    console.error('❌ Failed to get current branch:', error)
    process.exit(1)
  }
}

function updateVercelConfig(branchName: string): void {
  const configPath = 'vercel.json'

  console.log('📝 Updating vercel.json...')
  console.log(`   Branch: ${branchName}`)

  // Read current config
  let config: VercelConfig
  try {
    const content = readFileSync(configPath, 'utf-8')
    config = JSON.parse(content)
  } catch (error) {
    console.error('❌ Failed to read vercel.json:', error)
    process.exit(1)
  }

  // Ensure git.deploymentEnabled exists
  if (!config.git) {
    config.git = {}
  }
  if (!config.git.deploymentEnabled) {
    config.git.deploymentEnabled = {}
  }

  // Check if branch is already enabled
  if (config.git.deploymentEnabled[branchName] === true) {
    console.log('✅ Branch already enabled in vercel.json')
    return
  }

  // Add the branch
  config.git.deploymentEnabled[branchName] = true

  // Write updated config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')
    console.log('✅ vercel.json updated successfully')
    console.log('')
    console.log('Added:')
    console.log(`  "${branchName}": true`)
  } catch (error) {
    console.error('❌ Failed to write vercel.json:', error)
    process.exit(1)
  }
}

function main(): void {
  console.log('🔄 Vercel Configuration Updater')
  console.log('================================')
  console.log('')

  const currentBranch = getCurrentBranch()

  if (!currentBranch) {
    console.error('❌ No current branch detected')
    process.exit(1)
  }

  // Warn if not a claude/ branch
  if (!currentBranch.startsWith('claude/')) {
    console.log('⚠️  Warning: Branch does not start with "claude/"')
    console.log(`   Current branch: ${currentBranch}`)
    console.log('')
  }

  updateVercelConfig(currentBranch)

  console.log('')
  console.log('🚨 NEXT STEPS:')
  console.log('1. Commit the updated vercel.json:')
  console.log(`   git add vercel.json`)
  console.log(`   git commit -m "chore: Enable deployment for ${currentBranch}"`)
  console.log('')
  console.log('2. Set Vercel production branch:')
  console.log('   • Go to Vercel project settings')
  console.log('   • Navigate to: Settings > Git')
  console.log(`   • Set Production Branch to: ${currentBranch}`)
  console.log('')
  console.log('3. Push to GitHub:')
  console.log(`   git push -u origin ${currentBranch}`)
  console.log('')
}

main()
