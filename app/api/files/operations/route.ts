import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { v4 as uuidv4 } from 'uuid'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

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
    const { operation, file_ids, data } = body

    if (!operation || !file_ids || !Array.isArray(file_ids)) {
      return apiError('Invalid request parameters')
    }

    switch (operation) {
      case 'rename':
        return await handleRename(supabase, user.id, file_ids[0], data.new_name)

      case 'move':
        return await handleMove(supabase, user.id, file_ids, data.folder_id)

      case 'copy':
        return await handleCopy(supabase, user.id, file_ids, data.folder_id)

      case 'share':
        return await handleShare(supabase, user.id, file_ids, data.expiry_days)

      case 'tag':
        return await handleTag(supabase, user.id, file_ids, data.tags)

      case 'favorite':
        return await handleFavorite(supabase, user.id, file_ids, data.is_favorite)

      default:
        return apiError('Invalid operation')
    }
  } catch (error) {
    return handleApiError(error)
  }
}

async function handleRename(supabase: any, userId: string, fileId: string, newName: string) {
  if (!newName || !newName.trim()) {
    return apiError('New name is required')
  }

  const { data, error } = await supabase
    .from('files')
    .update({ name: newName })
    .eq('id', fileId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('file_activities').insert([
    {
      file_id: fileId,
      user_id: userId,
      action: 'renamed',
      details: `Renamed to ${newName}`,
    },
  ])

  return apiSuccess(data)
}

async function handleMove(supabase: any, userId: string, fileIds: string[], folderId: string | null) {
  const { data, error } = await supabase
    .from('files')
    .update({ folder_id: folderId })
    .in('id', fileIds)
    .eq('user_id', userId)
    .select()

  if (error) throw error

  // Log activities
  const activities = fileIds.map((fileId) => ({
    file_id: fileId,
    user_id: userId,
    action: 'moved',
    details: folderId ? `Moved to folder ${folderId}` : 'Moved to root',
  }))

  await supabase.from('file_activities').insert(activities)

  return apiSuccess(data)
}

async function handleCopy(supabase: any, userId: string, fileIds: string[], folderId: string | null) {
  // Get original files
  const { data: originalFiles, error: fetchError } = await supabase
    .from('files')
    .select('*')
    .in('id', fileIds)
    .eq('user_id', userId)

  if (fetchError) throw fetchError

  // Create copies
  const copies = originalFiles.map((file: any) => ({
    ...file,
    id: uuidv4(),
    name: `${file.name} (copy)`,
    folder_id: folderId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase.from('files').insert(copies).select()

  if (error) throw error

  // Copy files in storage
  for (let i = 0; i < originalFiles.length; i++) {
    const original = originalFiles[i]
    const copy = copies[i]

    const { error: copyError } = await supabase.storage
      .from('files')
      .copy(original.path, copy.path)

    if (copyError) {
      console.error('Storage copy error:', copyError)
    }
  }

  return apiSuccess(data)
}

async function handleShare(supabase: any, userId: string, fileIds: string[], expiryDays: number) {
  const shareUrls: Record<string, string> = {}
  const expiresAt = expiryDays > 0
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  for (const fileId of fileIds) {
    const shareToken = uuidv4()
    shareUrls[fileId] = `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareToken}`

    await supabase
      .from('files')
      .update({
        is_shared: true,
        share_url: shareUrls[fileId],
        share_expires_at: expiresAt,
      })
      .eq('id', fileId)
      .eq('user_id', userId)

    await supabase.from('file_activities').insert([
      {
        file_id: fileId,
        user_id: userId,
        action: 'shared',
        details: expiresAt ? `Shared until ${expiresAt}` : 'Shared permanently',
      },
    ])
  }

  return apiSuccess({ share_urls: shareUrls })
}

async function handleTag(supabase: any, userId: string, fileIds: string[], tags: string[]) {
  const { data, error } = await supabase
    .from('files')
    .update({ tags })
    .in('id', fileIds)
    .eq('user_id', userId)
    .select()

  if (error) throw error

  const activities = fileIds.map((fileId) => ({
    file_id: fileId,
    user_id: userId,
    action: 'updated',
    details: `Tagged with: ${tags.join(', ')}`,
  }))

  await supabase.from('file_activities').insert(activities)

  return apiSuccess(data)
}

async function handleFavorite(supabase: any, userId: string, fileIds: string[], isFavorite: boolean) {
  const { data, error } = await supabase
    .from('files')
    .update({ is_favorite: isFavorite })
    .in('id', fileIds)
    .eq('user_id', userId)
    .select()

  if (error) throw error

  return apiSuccess(data)
}
