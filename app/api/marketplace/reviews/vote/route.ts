import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/marketplace/reviews/vote - Vote on a review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { review_id, vote_type } = body

    if (!review_id || !vote_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['helpful', 'not_helpful'].includes(vote_type)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('review_votes')
      .select('id, vote_type')
      .eq('review_id', review_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingVote) {
      // Update existing vote
      if (existingVote.vote_type === vote_type) {
        // Remove vote if clicking the same button
        await supabase
          .from('review_votes')
          .delete()
          .eq('id', existingVote.id)
      } else {
        // Change vote
        await supabase
          .from('review_votes')
          .update({ vote_type })
          .eq('id', existingVote.id)
      }
    } else {
      // Create new vote
      await supabase
        .from('review_votes')
        .insert({
          review_id,
          user_id: user.id,
          vote_type
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to vote on review:', error)
    return NextResponse.json({ error: 'Failed to vote on review' }, { status: 500 })
  }
}
