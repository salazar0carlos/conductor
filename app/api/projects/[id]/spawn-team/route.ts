/**
 * POST /api/projects/[id]/spawn-team
 *
 * Spawns a complete agent team for a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if team already exists
    const { data: existingAgents } = await supabase
      .from('agents')
      .select('id')
      .eq('project_id', projectId);

    if (existingAgents && existingAgents.length > 0) {
      return NextResponse.json(
        {
          error: 'Team already exists for this project',
          existing_agents: existingAgents.length,
        },
        { status: 400 }
      );
    }

    // Spawn agent team using database function
    const { data: result, error: spawnError } = await supabase.rpc('spawn_agent_team', {
      p_project_id: projectId,
    });

    if (spawnError) {
      console.error('Failed to spawn team:', spawnError);
      return NextResponse.json(
        { error: 'Failed to spawn agent team', details: spawnError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project_id: projectId,
      agents_spawned: result.agents_spawned,
      agents: result.agents,
      message: `Successfully spawned ${result.agents_spawned} agents for project`,
    });
  } catch (error: any) {
    console.error('Error spawning team:', error);
    return NextResponse.json(
      { error: 'Failed to spawn team', details: error.message },
      { status: 500 }
    );
  }
}
