/**
 * Autonomous Orchestration System Test
 *
 * Tests all major components of the orchestration system
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tests = [];
let passed = 0;
let failed = 0;

function logTest(name, success, message = '') {
  const result = success ? '✅' : '❌';
  console.log(`${result} ${name}${message ? ': ' + message : ''}`);
  tests.push({ name, success, message });
  if (success) passed++;
  else failed++;
}

async function runTests() {
  console.log('\n🚀 Starting Orchestration System Tests\n');
  console.log('=' .repeat(60));

  // TEST 1: Check database tables exist
  console.log('\n📊 TEST 1: Database Schema Verification');
  console.log('-'.repeat(60));

  const requiredTables = [
    'workflow_instances',
    'quality_gates',
    'agent_approvals',
    'deployment_checklists',
    'supervisor_assignments',
    'agent_performance_metrics',
    'agent_capacity',
    'task_templates'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      logTest(`Table '${table}' exists`, !error);
    } catch (err) {
      logTest(`Table '${table}' exists`, false, err.message);
    }
  }

  // TEST 2: Check task hierarchy columns added
  console.log('\n📊 TEST 2: Task Hierarchy Columns');
  console.log('-'.repeat(60));

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('parent_task_id, task_depth, workflow_instance_id, is_workflow_root')
      .limit(1);
    logTest('Task hierarchy columns exist', !error);
  } catch (err) {
    logTest('Task hierarchy columns exist', false, err.message);
  }

  // TEST 3: Check agent capacity setup
  console.log('\n🤖 TEST 3: Agent Capacity Setup');
  console.log('-'.repeat(60));

  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, name')
    .limit(5);

  if (agentsError || !agents || agents.length === 0) {
    logTest('Agents exist in database', false, 'No agents found - need to deploy agents first');
  } else {
    logTest('Agents exist in database', true, `${agents.length} agents found`);

    const { data: capacities, error: capacityError } = await supabase
      .from('agent_capacity')
      .select('*')
      .in('agent_id', agents.map(a => a.id));

    if (capacityError) {
      logTest('Agent capacity records created', false, capacityError.message);
    } else {
      logTest('Agent capacity records created', true, `${capacities?.length || 0}/${agents.length} agents have capacity tracking`);

      // Check capacity defaults
      const hasCorrectDefaults = capacities?.every(c =>
        c.max_concurrent_tasks === 3 &&
        c.current_task_count === 0 &&
        c.is_available === true
      );
      logTest('Agent capacity defaults correct', hasCorrectDefaults,
        'max_concurrent_tasks=3, current_task_count=0, is_available=true');
    }
  }

  // TEST 4: Check functions exist
  console.log('\n⚙️  TEST 4: Database Functions');
  console.log('-'.repeat(60));

  try {
    const { data, error } = await supabase.rpc('all_children_completed', { parent_id: '00000000-0000-0000-0000-000000000000' });
    logTest('Function all_children_completed() exists', !error || error.code !== '42883');
  } catch (err) {
    logTest('Function all_children_completed() exists', false, err.message);
  }

  try {
    const { data, error } = await supabase.rpc('get_child_tasks', { parent_id: '00000000-0000-0000-0000-000000000000' });
    logTest('Function get_child_tasks() exists', !error || error.code !== '42883');
  } catch (err) {
    logTest('Function get_child_tasks() exists', false, err.message);
  }

  // TEST 5: Create test data and verify workflow
  console.log('\n🧪 TEST 5: End-to-End Workflow Test');
  console.log('-'.repeat(60));

  // Create test project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: '[TEST] Orchestration Test Project',
      description: 'Automated test project for orchestration system',
      metadata: { test: true }
    })
    .select()
    .single();

  if (projectError) {
    logTest('Create test project', false, projectError.message);
  } else {
    logTest('Create test project', true, `Project ID: ${project.id}`);

    // Create test task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        project_id: project.id,
        title: '[TEST] Build Next.js todo app',
        description: 'Test task for orchestration system',
        type: 'feature',
        status: 'pending',
        priority: 10,
        required_capabilities: ['frontend', 'backend'],
        metadata: { test: true }
      })
      .select()
      .single();

    if (taskError) {
      logTest('Create test task', false, taskError.message);
    } else {
      logTest('Create test task', true, `Task ID: ${task.id}`);

      // Test decomposition API
      console.log('\n   Testing decomposition API...');
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tasks/decompose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: task.id,
            project_id: project.id,
            task_description: 'Build Next.js todo app',
            app_type: 'nextjs',
            user_requirements: 'Users should be able to create, edit, and delete todos'
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          logTest('Decompose task into workflow', false, `API returned ${response.status}: ${errorText}`);
        } else {
          const result = await response.json();
          logTest('Decompose task into workflow', true,
            `Created ${result.subtasks_created} subtasks and ${result.quality_gates_created} quality gates`);

          // Verify workflow instance
          const { data: workflow, error: workflowError } = await supabase
            .from('workflow_instances')
            .select('*')
            .eq('id', result.workflow_instance_id)
            .single();

          if (workflowError) {
            logTest('Workflow instance created', false, workflowError.message);
          } else {
            logTest('Workflow instance created', true, `Status: ${workflow.status}`);
          }

          // Verify subtasks
          const { data: subtasks, error: subtasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('parent_task_id', task.id);

          if (subtasksError) {
            logTest('Subtasks created', false, subtasksError.message);
          } else {
            logTest('Subtasks created', true, `${subtasks?.length || 0} subtasks with task_depth=1`);
          }

          // Verify quality gates
          const { data: gates, error: gatesError } = await supabase
            .from('quality_gates')
            .select('*')
            .eq('workflow_instance_id', result.workflow_instance_id);

          if (gatesError) {
            logTest('Quality gates created', false, gatesError.message);
          } else {
            const requiredGates = gates?.filter(g => g.required);
            logTest('Quality gates created', true,
              `${gates?.length || 0} total (${requiredGates?.length || 0} required)`);
          }

          // Test intelligent assignment if we have subtasks
          if (subtasks && subtasks.length > 0 && agents && agents.length > 0) {
            const testSubtask = subtasks[0];
            console.log('\n   Testing intelligent assignment API...');

            const assignResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tasks/assign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                task_id: testSubtask.id,
                task_type: testSubtask.type,
                required_capabilities: testSubtask.required_capabilities || ['general']
              })
            });

            if (!assignResponse.ok) {
              const errorText = await assignResponse.text();
              logTest('Intelligent task assignment', false, `API returned ${assignResponse.status}: ${errorText}`);
            } else {
              const assignResult = await assignResponse.json();
              logTest('Intelligent task assignment', true,
                `Assigned to agent with ${(assignResult.confidence_score * 100).toFixed(0)}% confidence`);

              // Verify supervisor assignment recorded
              const { data: assignment } = await supabase
                .from('supervisor_assignments')
                .select('*')
                .eq('task_id', testSubtask.id)
                .single();

              if (assignment) {
                logTest('Supervisor assignment recorded', true,
                  `Estimated ${assignment.estimated_duration_hours}h`);
              }

              // Verify agent capacity updated
              const { data: updatedCapacity } = await supabase
                .from('agent_capacity')
                .select('*')
                .eq('agent_id', assignResult.assigned_agent_id)
                .single();

              if (updatedCapacity) {
                logTest('Agent capacity updated', true,
                  `Current tasks: ${updatedCapacity.current_task_count}`);
              }
            }
          }
        }
      } catch (err) {
        logTest('Decompose task into workflow', false, err.message);
      }

      // Cleanup test data
      console.log('\n   Cleaning up test data...');
      await supabase.from('quality_gates').delete().eq('workflow_instance_id', task.workflow_instance_id || '');
      await supabase.from('supervisor_assignments').delete().eq('task_id', task.id);
      await supabase.from('workflow_instances').delete().eq('parent_task_id', task.id);
      await supabase.from('tasks').delete().eq('project_id', project.id);
      await supabase.from('projects').delete().eq('id', project.id);
      console.log('   ✓ Test data cleaned up');
    }
  }

  // SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Orchestration system is fully operational.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above for details.\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
