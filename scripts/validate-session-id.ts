#!/usr/bin/env tsx
/**
 * Session ID Validation Script
 *
 * This script validates that the session ID is consistent across:
 * - config/session.json
 * - vercel.json deployment configuration
 * - Current git branch name
 *
 * This is CRITICAL for Claude Code functionality and Vercel deployments.
 * Any mismatch will cause deployment failures and make Claude Code unusable.
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
}

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function readSessionConfig(): SessionConfig {
  const configPath = path.join(process.cwd(), 'config', 'session.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Session config not found at ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

function readVercelConfig(): VercelConfig {
  const vercelPath = path.join(process.cwd(), 'vercel.json');

  if (!fs.existsSync(vercelPath)) {
    throw new Error(`vercel.json not found at ${vercelPath}`);
  }

  const content = fs.readFileSync(vercelPath, 'utf-8');
  return JSON.parse(content);
}

function getCurrentBranch(): string {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return branch;
  } catch (error) {
    throw new Error('Failed to get current git branch');
  }
}

function validateSessionId(): boolean {
  log('\n🔍 Validating Session ID Consistency...', BLUE);
  log('━'.repeat(60), BLUE);

  let hasErrors = false;

  try {
    // Read configurations
    const sessionConfig = readSessionConfig();
    const vercelConfig = readVercelConfig();
    const currentBranch = getCurrentBranch();

    log(`\n📋 Configuration Summary:`, YELLOW);
    log(`  Session ID: ${sessionConfig.sessionId}`);
    log(`  Expected Branch: ${sessionConfig.branchName}`);
    log(`  Current Branch: ${currentBranch}`);

    // Validate session config
    log(`\n✓ Session config loaded from config/session.json`, GREEN);

    // Validate branch name format
    const expectedBranchPattern = `claude/incomplete-description-${sessionConfig.sessionId}`;
    if (sessionConfig.branchName !== expectedBranchPattern) {
      log(`\n✗ ERROR: Branch name in session config doesn't match expected pattern`, RED);
      log(`  Expected: ${expectedBranchPattern}`, RED);
      log(`  Got: ${sessionConfig.branchName}`, RED);
      hasErrors = true;
    } else {
      log(`✓ Branch name format is correct`, GREEN);
    }

    // Validate current branch matches config
    if (currentBranch !== sessionConfig.branchName) {
      log(`\n✗ ERROR: Current git branch doesn't match session config`, RED);
      log(`  Expected: ${sessionConfig.branchName}`, RED);
      log(`  Current: ${currentBranch}`, RED);
      log(`\n  🔧 To fix: git checkout ${sessionConfig.branchName}`, YELLOW);
      hasErrors = true;
    } else {
      log(`✓ Current branch matches session config`, GREEN);
    }

    // Validate Vercel deployment config
    const deploymentEnabled = vercelConfig.git?.deploymentEnabled;
    if (!deploymentEnabled) {
      log(`\n✗ ERROR: No deployment configuration found in vercel.json`, RED);
      hasErrors = true;
    } else {
      const enabledBranches = Object.keys(deploymentEnabled).filter(
        branch => deploymentEnabled[branch] === true
      );

      if (enabledBranches.length === 0) {
        log(`\n✗ ERROR: No branches enabled for deployment in vercel.json`, RED);
        hasErrors = true;
      } else if (enabledBranches.length > 1) {
        log(`\n⚠ WARNING: Multiple branches enabled for deployment`, YELLOW);
        log(`  Enabled branches: ${enabledBranches.join(', ')}`, YELLOW);
      }

      if (!deploymentEnabled[sessionConfig.branchName]) {
        log(`\n✗ ERROR: Session branch not enabled for deployment in vercel.json`, RED);
        log(`  Expected branch: ${sessionConfig.branchName}`, RED);
        log(`  Enabled branches: ${enabledBranches.join(', ')}`, RED);
        hasErrors = true;
      } else {
        log(`✓ Vercel deployment configured for correct branch`, GREEN);
      }
    }

    // Summary
    log(`\n${'━'.repeat(60)}`, BLUE);
    if (hasErrors) {
      log(`\n❌ VALIDATION FAILED: Session ID configuration has errors`, RED);
      log(`\nThis WILL cause deployment failures and make Claude Code unusable!`, RED);
      log(`Please fix the errors above before continuing.`, RED);
      return false;
    } else {
      log(`\n✅ VALIDATION PASSED: Session ID is consistent across all configurations`, GREEN);
      log(`\nSession ID: ${sessionConfig.sessionId}`, GREEN);
      log(`Branch: ${sessionConfig.branchName}`, GREEN);
      return true;
    }

  } catch (error: any) {
    log(`\n❌ VALIDATION ERROR: ${error.message}`, RED);
    return false;
  }
}

// Run validation
const isValid = validateSessionId();
process.exit(isValid ? 0 : 1);
