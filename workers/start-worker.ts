#!/usr/bin/env ts-node
/**
 * Start Worker CLI
 *
 * Usage: npm run worker -- --project <project_id> --agent <agent_id>
 */

import { AgentWorker } from './agent-worker';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const projectId = args[args.indexOf('--project') + 1];
  const agentId = args[args.indexOf('--agent') + 1];

  if (!projectId || !agentId) {
    console.error('Usage: npm run worker -- --project <project_id> --agent <agent_id>');
    process.exit(1);
  }

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  // Fetch agent details
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*, projects(*)')
    .eq('id', agentId)
    .eq('project_id', projectId)
    .single();

  if (agentError || !agent) {
    console.error(`Agent not found: ${agentError?.message}`);
    process.exit(1);
  }

  // Get GitHub repo from project
  const githubRepo = agent.projects?.github_repo;

  console.log(`🚀 Starting agent worker`);
  console.log(`   Project: ${agent.projects?.name || projectId}`);
  console.log(`   Agent: ${agent.name} (${agent.type})`);
  console.log(`   GitHub: ${githubRepo || 'Not configured'}`);
  console.log('');

  // Create worker
  const worker = new AgentWorker({
    projectId,
    agentId,
    agentType: agent.type,
    agentName: agent.name,
    capabilities: agent.capabilities || [],
    githubRepo,
    githubToken,
    supabaseUrl,
    supabaseKey,
    anthropicApiKey,
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  // Start worker
  await worker.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
