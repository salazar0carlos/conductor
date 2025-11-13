import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/marketplace/reviews?template_id=xxx - Get reviews for a template
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('template_id')

    if (!templateId) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 })
    }

    // Try to get user (optional)
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch reviews
    const query = supabase
      .from('template_reviews')
      .select('*')
      .eq('template_id', templateId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    const { data: reviews, error } = await query

    if (error) {
      console.error('Failed to fetch reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // If user is logged in, check their votes
    if (user && reviews) {
      const reviewIds = reviews.map(r => r.id)
      const { data: votes } = await supabase
        .from('review_votes')
        .select('review_id, vote_type')
        .eq('user_id', user.id)
        .in('review_id', reviewIds)

      const voteMap = new Map(votes?.map(v => [v.review_id, v.vote_type]) || [])

      reviews.forEach(review => {
        review.user_vote = voteMap.get(review.id)
      })
    }

    return NextResponse.json(reviews || [])
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/marketplace/reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { template_id, rating, title, content } = body

    if (!template_id || !rating || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Check if user has already reviewed this template
    const { data: existingReview } = await supabase
      .from('template_reviews')
      .select('id')
      .eq('template_id', template_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this template' }, { status: 400 })
    }

    // Check if user has installed this template (for verified purchase badge)
    const { data: installation } = await supabase
      .from('template_installations')
      .select('id')
      .eq('template_id', template_id)
      .eq('user_id', user.id)
      .maybeSingle()

    // Create review
    const { data: review, error } = await supabase
      .from('template_reviews')
      .insert({
        template_id,
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email || 'Anonymous',
        user_avatar: user.user_metadata?.avatar_url,
        rating,
        title,
        content,
        is_verified_purchase: !!installation,
        status: 'published' // Auto-publish for now, could add moderation
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create review:', error)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Failed to create review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
