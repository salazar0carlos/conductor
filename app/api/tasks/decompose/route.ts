/**
 * POST /api/tasks/decompose
 *
 * Decomposes a high-level task into a complete workflow with subtasks,
 * quality gates, and redundancy requirements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decomposeTaskIntoWorkflow } from '@/lib/ai/orchestrator-agent';

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { task_id, project_id, task_description, app_type, user_requirements } = body;

    if (!task_id || !project_id || !task_description || !app_type) {
      return NextResponse.json(
        {
          error: 'Missing required fields: task_id, project_id, task_description, app_type',
        },
        { status: 400 }
      );
    }

    // Validate app_type
    const validAppTypes = ['nextjs', 'react', 'node', 'python', 'fullstack', 'api', 'mobile'];
    if (!validAppTypes.includes(app_type)) {
      return NextResponse.json(
        {
          error: `Invalid app_type. Must be one of: ${validAppTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Decompose the task into a workflow
    const result = await decomposeTaskIntoWorkflow({
      task_id,
      project_id,
      task_description,
      app_type,
      user_requirements,
    });

    return NextResponse.json({
      success: true,
      workflow_instance_id: result.workflow_instance_id,
      subtasks_created: result.subtasks.length,
      quality_gates_created: result.quality_gates.length,
      subtasks: result.subtasks,
      quality_gates: result.quality_gates,
    });
  } catch (error: any) {
    console.error('Task decomposition error:', error);
    return NextResponse.json(
      {
        error: 'Failed to decompose task',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
