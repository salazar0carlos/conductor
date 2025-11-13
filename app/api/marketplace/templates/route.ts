import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

// GET /api/marketplace/templates - List and search templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Parse filters
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const pricing = searchParams.get('pricing')
    const minRating = searchParams.get('minRating')
    const tags = searchParams.get('tags')
    const featured = searchParams.get('featured')
    const trending = searchParams.get('trending')
    const sort = searchParams.get('sort') || 'popular'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('marketplace_templates')
      .select('*, category:template_categories(*)', { count: 'exact' })
      .eq('status', 'published')
      .eq('visibility', 'public')

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (pricing) {
      query = query.eq('pricing_type', pricing)
    }

    if (minRating) {
      query = query.gte('average_rating', parseFloat(minRating))
    }

    if (tags) {
      const tagArray = JSON.parse(tags)
      query = query.contains('tags', tagArray)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (trending === 'true') {
      query = query.eq('is_trending', true)
    }

    // Apply sorting
    switch (sort) {
      case 'recent':
        query = query.order('published_at', { ascending: false })
        break
      case 'rating':
        query = query.order('average_rating', { ascending: false })
        break
      case 'trending':
        query = query.order('is_trending', { ascending: false }).order('install_count', { ascending: false })
        break
      case 'price-low':
        query = query.order('price', { ascending: true })
        break
      case 'price-high':
        query = query.order('price', { ascending: false })
        break
      case 'popular':
      default:
        query = query.order('install_count', { ascending: false })
        break
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({
      templates: data || [],
      total: count || 0,
      page,
      limit,
      has_more: count ? offset + limit < count : false
    })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/marketplace/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Generate slug if not provided
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    // Create template
    const { data: template, error } = await supabase
      .from('marketplace_templates')
      .insert({
        name: body.name,
        slug,
        description: body.description,
        long_description: body.long_description,
        category_id: body.category_id,
        type: body.type,
        author_id: user.id,
        author_name: user.user_metadata?.name || user.email || 'Unknown',
        author_avatar: user.user_metadata?.avatar_url,
        pricing_type: body.pricing_type || 'free',
        price: body.price || 0,
        template_data: body.template_data,
        features: body.features || [],
        tags: body.tags || [],
        installation_instructions: body.installation_instructions,
        config_schema: body.config_schema,
        thumbnail_url: body.thumbnail_url,
        screenshots: body.screenshots || [],
        video_url: body.video_url,
        demo_url: body.demo_url,
        license: body.license || 'MIT',
        requirements: body.requirements || {},
        status: 'draft', // Start as draft
        visibility: body.visibility || 'public'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
