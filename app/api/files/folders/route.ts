import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { name, parent_id, color } = body

    if (!name || !name.trim()) {
      return apiError('Folder name is required')
    }

    // Build path
    let path = name
    if (parent_id) {
      const { data: parentFolder } = await supabase
        .from('folders')
        .select('path')
        .eq('id', parent_id)
        .single()

      if (parentFolder) {
        path = `${parentFolder.path}/${name}`
      }
    }

    const { data, error } = await supabase
      .from('folders')
      .insert([
        {
          id: uuidv4(),
          name,
          path,
          parent_id: parent_id || null,
          user_id: user.id,
          file_count: 0,
          folder_count: 0,
          total_size: 0,
          is_favorite: false,
          color: color || null,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return apiSuccess(data, 201)
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
    const folderId = searchParams.get('id')

    if (!folderId) {
      return apiError('Folder ID is required')
    }

    // Check if folder has files or subfolders
    const { data: files } = await supabase
      .from('files')
      .select('id')
      .eq('folder_id', folderId)
      .limit(1)

    if (files && files.length > 0) {
      return apiError('Cannot delete folder with files. Move or delete files first.', 400)
    }

    const { data: subfolders } = await supabase
      .from('folders')
      .select('id')
      .eq('parent_id', folderId)
      .limit(1)

    if (subfolders && subfolders.length > 0) {
      return apiError('Cannot delete folder with subfolders. Delete subfolders first.', 400)
    }

    // Delete folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id)

    if (error) throw error

    return apiSuccess({ message: 'Folder deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
