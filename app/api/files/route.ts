import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folder_id')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const isFavorite = searchParams.get('is_favorite')

    let query = supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (folderId !== null) {
      if (folderId === '') {
        query = query.is('folder_id', null)
      } else {
        query = query.eq('folder_id', folderId)
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,tags.cs.{${search}}`)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (isFavorite === 'true') {
      query = query.eq('is_favorite', true)
    }

    const { data, error } = await query

    if (error) throw error

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return apiError('File ID is required')
    }

    // Get file details
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !file) {
      return apiError('File not found', 404)
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([file.path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete thumbnail if exists
    if (file.thumbnail_url) {
      const thumbnailPath = file.path.replace(/\.[^/.]+$/, '_thumb.jpg')
      await supabase.storage.from('files').remove([thumbnailPath])
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (dbError) throw dbError

    // Log activity
    await supabase.from('file_activities').insert([
      {
        file_id: fileId,
        user_id: user.id,
        action: 'deleted',
        details: `Deleted ${file.name}`,
      },
    ])

    return apiSuccess({ message: 'File deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
