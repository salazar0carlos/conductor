#!/usr/bin/env tsx
/**
 * Session ID Update Script
 *
 * This script updates the session ID across all required locations:
 * - config/session.json
 * - vercel.json deployment configuration
 * - Creates/switches to the correct git branch
 *
 * Usage: tsx scripts/update-session-id.ts <new-session-id>
 *
 * CRITICAL: This script is essential for maintaining Claude Code functionality.
 * Always run this immediately when the session ID changes!
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface SessionConfig {
  sessionId: string;
  branchName: string;
  description: string;
  lastUpdated: string;
  updatedBy: string;
}

interface VercelConfig {
  git?: {
    deploymentEnabled?: {
      [branch: string]: boolean;
    };
  };
  [key: string]: any;
}

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function execCommand(command: string, description: string): string {
  try {
    log(`  Executing: ${description}`, CYAN);
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return output;
  } catch (error: any) {
    throw new Error(`Failed to ${description}: ${error.message}`);
  }
}

function updateSessionConfig(newSessionId: string): void {
  const configPath = path.join(process.cwd(), 'config', 'session.json');
  const newBranchName = `claude/incomplete-description-${newSessionId}`;

  const config: SessionConfig = {
    sessionId: newSessionId,
    branchName: newBranchName,
    description: 'Central session ID configuration for Claude Code integration',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'update-session-id script'
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  log(`✓ Updated config/session.json`, GREEN);
}

function updateVercelConfig(newSessionId: string): void {
  const vercelPath = path.join(process.cwd(), 'vercel.json');
  const newBranchName = `claude/incomplete-description-${newSessionId}`;

  let vercelConfig: VercelConfig = {};

  if (fs.existsSync(vercelPath)) {
    const content = fs.readFileSync(vercelPath, 'utf-8');
    vercelConfig = JSON.parse(content);
  }

  // Remove all existing deployment branches
  if (vercelConfig.git?.deploymentEnabled) {
    vercelConfig.git.deploymentEnabled = {};
  } else {
    vercelConfig.git = {
      ...(vercelConfig.git || {}),
      deploymentEnabled: {}
    };
  }

  // Set only the new branch for deployment
  vercelConfig.git.deploymentEnabled[newBranchName] = true;

  fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2) + '\n', 'utf-8');
  log(`✓ Updated vercel.json`, GREEN);
}

function handleGitBranch(newSessionId: string): void {
  const newBranchName = `claude/incomplete-description-${newSessionId}`;
  const currentBranch = execCommand('git rev-parse --abbrev-ref HEAD', 'get current branch');

  log(`\n📋 Git Branch Management:`, YELLOW);
  log(`  Current branch: ${currentBranch}`);
  log(`  New branch: ${newBranchName}`);

  // Check if new branch exists locally
  let branchExists = false;
  try {
    execCommand(`git rev-parse --verify ${newBranchName}`, 'check if branch exists locally');
    branchExists = true;
    log(`  Branch already exists locally`, CYAN);
  } catch {
    log(`  Branch does not exist locally`, CYAN);
  }

  // Check if new branch exists remotely
  let remoteBranchExists = false;
  try {
    execCommand(`git ls-remote --heads origin ${newBranchName}`, 'check if branch exists remotely');
    remoteBranchExists = true;
    log(`  Branch exists on remote`, CYAN);
  } catch {
    log(`  Branch does not exist on remote`, CYAN);
  }

  if (!branchExists && !remoteBranchExists) {
    // Create new branch
    log(`\n  Creating new branch: ${newBranchName}`, YELLOW);
    execCommand(`git checkout -b ${newBranchName}`, 'create and checkout new branch');
    log(`✓ Created and switched to new branch`, GREEN);
  } else if (branchExists) {
    // Switch to existing local branch
    log(`\n  Switching to existing local branch`, YELLOW);
    execCommand(`git checkout ${newBranchName}`, 'checkout existing branch');
    log(`✓ Switched to existing branch`, GREEN);
  } else if (remoteBranchExists) {
    // Checkout remote branch
    log(`\n  Checking out remote branch`, YELLOW);
    execCommand(`git fetch origin ${newBranchName}`, 'fetch remote branch');
    execCommand(`git checkout -b ${newBranchName} origin/${newBranchName}`, 'checkout remote branch');
    log(`✓ Checked out remote branch`, GREEN);
  }
}

function displayInstructions(newSessionId: string): void {
  const newBranchName = `claude/incomplete-description-${newSessionId}`;

  log(`\n${'━'.repeat(60)}`, BLUE);
  log(`\n✅ Session ID Updated Successfully!`, GREEN);
  log(`\n📋 Next Steps:`, YELLOW);
  log(`\n1. Review the changes:`, CYAN);
  log(`   git status`);
  log(`\n2. Commit the configuration changes:`, CYAN);
  log(`   git add config/session.json vercel.json`);
  log(`   git commit -m "chore: Update session ID to ${newSessionId}"`);
  log(`\n3. Push to remote (CRITICAL - this enables Vercel deployment):`, CYAN);
  log(`   git push -u origin ${newBranchName}`);
  log(`\n4. Update Vercel deployment settings:`, CYAN);
  log(`   - Go to your Vercel project settings`);
  log(`   - Navigate to Git > Production Branch`);
  log(`   - Set production branch to: ${newBranchName}`);
  log(`\n5. Verify deployment:`, CYAN);
  log(`   - Check Vercel dashboard for successful deployment`);
  log(`   - Test Claude Code functionality`);
  log(`\n⚠️  IMPORTANT: Until you push and update Vercel settings,`, YELLOW);
  log(`    deployments will fail and Claude Code will be unusable!`, YELLOW);
  log(`\n${'━'.repeat(60)}`, BLUE);
}

function updateSessionId(newSessionId: string): void {
  log(`\n🔄 Updating Session ID...`, BLUE);
  log(`${'━'.repeat(60)}`, BLUE);
  log(`\nNew Session ID: ${newSessionId}`, YELLOW);

  try {
    // Update configuration files
    log(`\n📝 Updating Configuration Files:`, YELLOW);
    updateSessionConfig(newSessionId);
    updateVercelConfig(newSessionId);

    // Handle git branch
    handleGitBranch(newSessionId);

    // Display next steps
    displayInstructions(newSessionId);

  } catch (error: any) {
    log(`\n❌ ERROR: Failed to update session ID`, RED);
    log(`${error.message}`, RED);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  log(`\n❌ ERROR: No session ID provided`, RED);
  log(`\nUsage: tsx scripts/update-session-id.ts <new-session-id>`, YELLOW);
  log(`\nExample: tsx scripts/update-session-id.ts 011CV5EqLsNpgqQ42rfXspUV`, CYAN);
  process.exit(1);
}

const newSessionId = args[0];

// Validate session ID format (basic validation)
if (!/^[A-Za-z0-9]{20,}$/.test(newSessionId)) {
  log(`\n⚠️  WARNING: Session ID format looks unusual`, YELLOW);
  log(`Expected format: alphanumeric, 20+ characters`, YELLOW);
  log(`Got: ${newSessionId}`, YELLOW);
  log(`\nContinuing anyway...`, CYAN);
}

updateSessionId(newSessionId);
