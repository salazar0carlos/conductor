import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/marketplace/templates/[id] - Get template details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Try to get user (optional for public templates)
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch template with category
    const { data: template, error } = await supabase
      .from('marketplace_templates')
      .select('*, category:template_categories(*)')
      .eq('id', id)
      .single()

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Increment view count
    await supabase
      .from('marketplace_templates')
      .update({ view_count: template.view_count + 1 })
      .eq('id', id)

    // Check if user has favorited this template
    if (user) {
      const { data: favorite } = await supabase
        .from('template_favorites')
        .select('id')
        .eq('template_id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      template.is_favorited = !!favorite

      // Check if user has installed this template
      const { data: installation } = await supabase
        .from('template_installations')
        .select('*')
        .eq('template_id', id)
        .eq('user_id', user.id)
        .order('installed_at', { ascending: false })
        .maybeSingle()

      template.user_installation = installation
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Failed to fetch template:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

// PATCH /api/marketplace/templates/[id] - Update template
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns this template
    const { data: existing } = await supabase
      .from('marketplace_templates')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!existing || existing.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Update template
    const { data: template, error } = await supabase
      .from('marketplace_templates')
      .update({
        name: body.name,
        description: body.description,
        long_description: body.long_description,
        category_id: body.category_id,
        type: body.type,
        pricing_type: body.pricing_type,
        price: body.price,
        features: body.features,
        tags: body.tags,
        installation_instructions: body.installation_instructions,
        thumbnail_url: body.thumbnail_url,
        screenshots: body.screenshots,
        video_url: body.video_url,
        demo_url: body.demo_url,
        status: body.status,
        visibility: body.visibility,
        ...(body.status === 'published' && !(existing as any).published_at ? { published_at: new Date().toISOString() } : {})
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update template:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Failed to update template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE /api/marketplace/templates/[id] - Delete template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns this template
    const { data: existing } = await supabase
      .from('marketplace_templates')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!existing || existing.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('marketplace_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete template:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
