import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/marketplace/installations - Get user's installations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: installations, error } = await supabase
      .from('template_installations')
      .select('*, template:marketplace_templates(*)')
      .eq('user_id', user.id)
      .order('installed_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch installations:', error)
      return NextResponse.json({ error: 'Failed to fetch installations' }, { status: 500 })
    }

    return NextResponse.json(installations || [])
  } catch (error) {
    console.error('Failed to fetch installations:', error)
    return NextResponse.json({ error: 'Failed to fetch installations' }, { status: 500 })
  }
}
