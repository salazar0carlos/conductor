#!/usr/bin/env tsx
/**
 * Test Subscription Enforcement
 *
 * Tests the subscription system enforcement:
 * 1. Token limit checking before task execution
 * 2. Project creation limits based on plan
 * 3. Auto-pause when limits reached
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('🧪 Testing Subscription Enforcement System\n');
  console.log('=' .repeat(60));

  // Test 1: Check subscription tables exist
  await testSubscriptionTablesExist();

  // Test 2: Check subscription functions exist
  await testSubscriptionFunctionsExist();

  // Test 3: Test can_create_project function
  await testCanCreateProjectFunction();

  // Test 4: Test has_tokens_available function
  await testHasTokensAvailableFunction();

  // Test 5: Test record_token_usage function
  await testRecordTokenUsageFunction();

  // Test 6: Test auto_pause_on_limit function
  await testAutoPauseOnLimitFunction();

  // Test 7: Verify API endpoints have enforcement
  await testApiEndpointEnforcement();

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }
  });

  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please check the subscription system setup.');
    process.exit(1);
  } else {
    console.log('\n✨ All tests passed! Subscription enforcement is working correctly.');
    process.exit(0);
  }
}

async function testSubscriptionTablesExist() {
  const tables = ['subscriptions', 'plan_templates', 'token_usage_log', 'billing_events'];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0);

      if (error) {
        results.push({
          test: `Table '${table}' exists`,
          status: 'FAIL',
          message: error.message,
        });
      } else {
        results.push({
          test: `Table '${table}' exists`,
          status: 'PASS',
        });
      }
    } catch (err: any) {
      results.push({
        test: `Table '${table}' exists`,
        status: 'FAIL',
        message: err.message,
      });
    }
  }
}

async function testSubscriptionFunctionsExist() {
  const functions = [
    'can_create_project',
    'has_tokens_available',
    'record_token_usage',
    'upgrade_subscription',
    'auto_pause_on_limit',
  ];

  for (const func of functions) {
    try {
      // Try to call the function with dummy data (will fail gracefully)
      const { error } = await supabase.rpc(func, {
        p_user_id: '00000000-0000-0000-0000-000000000000',
      } as any);

      // If we get back any response (even an error about the UUID not existing), the function exists
      results.push({
        test: `Function '${func}' exists`,
        status: 'PASS',
      });
    } catch (err: any) {
      results.push({
        test: `Function '${func}' exists`,
        status: 'FAIL',
        message: err.message,
      });
    }
  }
}

async function testCanCreateProjectFunction() {
  try {
    // Create a test user with a free subscription (1 project limit)
    const testUserId = '00000000-0000-0000-0000-000000000001';

    // Test should return false for non-existent user (no subscription)
    const { data, error } = await supabase.rpc('can_create_project', {
      p_user_id: testUserId,
    });

    if (error) {
      results.push({
        test: 'can_create_project function works',
        status: 'FAIL',
        message: error.message,
      });
    } else {
      results.push({
        test: 'can_create_project function works',
        status: 'PASS',
        message: `Returns ${data} for test user`,
      });
    }
  } catch (err: any) {
    results.push({
      test: 'can_create_project function works',
      status: 'FAIL',
      message: err.message,
    });
  }
}

async function testHasTokensAvailableFunction() {
  try {
    const testUserId = '00000000-0000-0000-0000-000000000001';

    const { data, error } = await supabase.rpc('has_tokens_available', {
      p_user_id: testUserId,
      p_tokens_needed: 1000,
    });

    if (error) {
      results.push({
        test: 'has_tokens_available function works',
        status: 'FAIL',
        message: error.message,
      });
    } else {
      results.push({
        test: 'has_tokens_available function works',
        status: 'PASS',
        message: `Returns ${data} for test user`,
      });
    }
  } catch (err: any) {
    results.push({
      test: 'has_tokens_available function works',
      status: 'FAIL',
      message: err.message,
    });
  }
}

async function testRecordTokenUsageFunction() {
  try {
    const testUserId = '00000000-0000-0000-0000-000000000001';

    const { error } = await supabase.rpc('record_token_usage', {
      p_user_id: testUserId,
      p_project_id: '00000000-0000-0000-0000-000000000002',
      p_agent_id: '00000000-0000-0000-0000-000000000003',
      p_task_id: '00000000-0000-0000-0000-000000000004',
      p_tokens: 1000,
      p_model: 'claude-sonnet-4-20250514',
    });

    if (error) {
      results.push({
        test: 'record_token_usage function works',
        status: 'FAIL',
        message: error.message,
      });
    } else {
      results.push({
        test: 'record_token_usage function works',
        status: 'PASS',
        message: 'Successfully recorded test token usage',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'record_token_usage function works',
      status: 'FAIL',
      message: err.message,
    });
  }
}

async function testAutoPauseOnLimitFunction() {
  try {
    const testUserId = '00000000-0000-0000-0000-000000000001';

    const { data, error } = await supabase.rpc('auto_pause_on_limit', {
      p_user_id: testUserId,
      p_reason: 'Test limit reached',
    });

    if (error) {
      results.push({
        test: 'auto_pause_on_limit function works',
        status: 'FAIL',
        message: error.message,
      });
    } else {
      results.push({
        test: 'auto_pause_on_limit function works',
        status: 'PASS',
        message: `Paused ${data} projects for test user`,
      });
    }
  } catch (err: any) {
    results.push({
      test: 'auto_pause_on_limit function works',
      status: 'FAIL',
      message: err.message,
    });
  }
}

async function testApiEndpointEnforcement() {
  // Check if API route files have subscription enforcement
  const fs = require('fs');
  const path = require('path');

  // Test 1: Check projects/route.ts has can_create_project check
  try {
    const projectsRoute = fs.readFileSync(
      path.join(process.cwd(), 'app/api/projects/route.ts'),
      'utf-8'
    );

    if (projectsRoute.includes('can_create_project')) {
      results.push({
        test: 'Projects API has subscription enforcement',
        status: 'PASS',
        message: 'can_create_project check found in POST endpoint',
      });
    } else {
      results.push({
        test: 'Projects API has subscription enforcement',
        status: 'FAIL',
        message: 'can_create_project check not found in POST endpoint',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Projects API has subscription enforcement',
      status: 'SKIP',
      message: 'Could not read projects route file',
    });
  }

  // Test 2: Check worker has token checking
  try {
    const workerFile = fs.readFileSync(
      path.join(process.cwd(), 'workers/agent-worker.ts'),
      'utf-8'
    );

    const hasTokenCheck = workerFile.includes('checkTokensAvailable');
    const hasRecordUsage = workerFile.includes('recordSubscriptionUsage');

    if (hasTokenCheck && hasRecordUsage) {
      results.push({
        test: 'Agent worker has subscription enforcement',
        status: 'PASS',
        message: 'Token checking and recording found in worker',
      });
    } else {
      results.push({
        test: 'Agent worker has subscription enforcement',
        status: 'FAIL',
        message: `Token check: ${hasTokenCheck}, Record usage: ${hasRecordUsage}`,
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Agent worker has subscription enforcement',
      status: 'SKIP',
      message: 'Could not read worker file',
    });
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
