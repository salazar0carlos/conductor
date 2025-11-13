import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

// POST /api/marketplace/favorites - Toggle favorite
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { template_id } = body

    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 })
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('template_favorites')
      .select('id')
      .eq('template_id', template_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      // Remove favorite
      await supabase
        .from('template_favorites')
        .delete()
        .eq('id', existing.id)

      return NextResponse.json({ favorited: false })
    } else {
      // Add favorite
      await supabase
        .from('template_favorites')
        .insert({
          template_id,
          user_id: user.id
        })

      return NextResponse.json({ favorited: true })
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 })
  }
}

// GET /api/marketplace/favorites - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: favorites, error } = await supabase
      .from('template_favorites')
      .select('*, template:marketplace_templates(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    return NextResponse.json(favorites || [])
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}
