#!/usr/bin/env tsx
/**
 * Git Hooks Setup Script
 *
 * Installs the pre-commit hook to validate session ID consistency.
 * This prevents commits that would break deployments.
 */

import * as fs from 'fs';
import * as path from 'path';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function setupHooks(): void {
  log(`\n⚙️  Setting up Git hooks...`, BLUE);
  log('━'.repeat(60), BLUE);

  const gitHooksDir = path.join(process.cwd(), '.git', 'hooks');
  const sourceHook = path.join(process.cwd(), 'scripts', 'pre-commit-hook.sh');
  const targetHook = path.join(gitHooksDir, 'pre-commit');

  // Check if .git directory exists
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    log(`\n⚠️  WARNING: .git directory not found`, YELLOW);
    log('This doesn\'t appear to be a git repository.', YELLOW);
    log('Hooks can only be installed in a git repository.', YELLOW);
    return;
  }

  // Ensure hooks directory exists
  if (!fs.existsSync(gitHooksDir)) {
    fs.mkdirSync(gitHooksDir, { recursive: true });
    log(`✓ Created .git/hooks directory`, GREEN);
  }

  // Copy hook file
  if (fs.existsSync(sourceHook)) {
    fs.copyFileSync(sourceHook, targetHook);
    log(`✓ Installed pre-commit hook`, GREEN);

    // Make it executable
    fs.chmodSync(targetHook, 0o755);
    log(`✓ Made hook executable`, GREEN);

    log(`\n✅ Git hooks installed successfully!`, GREEN);
    log(`\nThe pre-commit hook will now validate session ID consistency`, YELLOW);
    log(`before every commit, preventing deployment failures.`, YELLOW);
  } else {
    log(`\n❌ ERROR: Source hook not found at ${sourceHook}`, '\x1b[31m');
    process.exit(1);
  }

  log('\n' + '━'.repeat(60), BLUE);
}

setupHooks();
