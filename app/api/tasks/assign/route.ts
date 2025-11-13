/**
 * POST /api/tasks/assign
 *
 * Intelligently assigns a task to the best available agent based on
 * capabilities, workload, historical performance, and redundancy requirements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { assignTaskToAgent } from '@/lib/ai/orchestrator-agent';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      task_id,
      task_type,
      required_capabilities,
      preferred_agent_types,
      requires_redundancy,
    } = body;

    if (!task_id || !task_type || !required_capabilities) {
      return NextResponse.json(
        {
          error: 'Missing required fields: task_id, task_type, required_capabilities',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(required_capabilities)) {
      return NextResponse.json(
        {
          error: 'required_capabilities must be an array',
        },
        { status: 400 }
      );
    }

    // Assign the task
    const assignment = await assignTaskToAgent({
      task_id,
      task_type,
      required_capabilities,
      preferred_agent_types,
      requires_redundancy: requires_redundancy || false,
    });

    // Update the task with the assigned agent
    const supabase = await createClient();
    await supabase
      .from('tasks')
      .update({
        assigned_agent_id: assignment.selected_agent_id,
        status: 'assigned',
        started_at: new Date().toISOString(),
        metadata: {
          assignment_confidence: assignment.confidence_score,
          assignment_reasoning: assignment.reasoning,
          estimated_duration_hours: assignment.estimated_duration_hours,
          backup_agent_ids: assignment.backup_agent_ids,
        },
      })
      .eq('id', task_id);

    return NextResponse.json({
      success: true,
      assigned_agent_id: assignment.selected_agent_id,
      confidence_score: assignment.confidence_score,
      reasoning: assignment.reasoning,
      estimated_duration_hours: assignment.estimated_duration_hours,
      backup_agent_ids: assignment.backup_agent_ids,
    });
  } catch (error: any) {
    console.error('Task assignment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to assign task',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
