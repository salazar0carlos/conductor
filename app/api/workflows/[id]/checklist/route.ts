/**
 * GET /api/workflows/[id]/checklist
 *
 * Generates a deployment readiness checklist for a workflow instance,
 * checking all quality gates, redundancy requirements, and blockers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDeploymentChecklist } from '@/lib/ai/orchestrator-agent';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowInstanceId } = await params;

    if (!workflowInstanceId) {
      return NextResponse.json(
        {
          error: 'Workflow instance ID is required',
        },
        { status: 400 }
      );
    }

    // Generate deployment checklist
    const checklist = await generateDeploymentChecklist(workflowInstanceId);

    return NextResponse.json({
      success: true,
      checklist,
    });
  } catch (error: any) {
    console.error('Checklist generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate deployment checklist',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
