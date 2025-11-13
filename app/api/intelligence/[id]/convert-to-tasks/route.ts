/**
 * POST /api/intelligence/[id]/convert-to-tasks
 *
 * Converts all approved suggestions from an analysis into actionable tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { convertAllApprovedSuggestions } from '@/lib/ai/feedback-loop';

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: analysisId } = await params;

    if (!analysisId) {
      return NextResponse.json(
        {
          error: 'Analysis ID is required',
        },
        { status: 400 }
      );
    }

    // Convert all approved suggestions to tasks
    const results = await convertAllApprovedSuggestions(analysisId);

    return NextResponse.json({
      success: true,
      tasks_created: results.length,
      tasks: results,
    });
  } catch (error: any) {
    console.error('Suggestion conversion error:', error);
    return NextResponse.json(
      {
        error: 'Failed to convert suggestions to tasks',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
