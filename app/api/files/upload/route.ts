import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/api-helpers'
import { getFileType } from '@/lib/utils/file-utils'
import { v4 as uuidv4 } from 'uuid'

// Force dynamic rendering (prevent static generation at build time)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folder_id') as string | null
    const thumbnail = formData.get('thumbnail') as string | null

    if (!file) {
      return apiError('No file provided')
    }

    // Generate unique file path
    const fileId = uuidv4()
    const extension = file.name.split('.').pop()
    const fileName = `${fileId}.${extension}`
    const filePath = folderId
      ? `${user.id}/${folderId}/${fileName}`
      : `${user.id}/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return apiError(uploadError.message, 500)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('files').getPublicUrl(filePath)

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null
    if (thumbnail) {
      const thumbnailPath = `${user.id}/thumbnails/${fileId}.jpg`
      const thumbnailBlob = await fetch(thumbnail).then((r) => r.blob())

      const { error: thumbnailError } = await supabase.storage
        .from('files')
        .upload(thumbnailPath, thumbnailBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        })

      if (!thumbnailError) {
        const { data: thumbData } = supabase.storage
          .from('files')
          .getPublicUrl(thumbnailPath)
        thumbnailUrl = thumbData.publicUrl
      }
    }

    // Extract metadata (this could be enhanced with actual metadata extraction)
    const metadata: Record<string, any> = {}
    if (file.type.startsWith('image/')) {
      // For images, you could use sharp or similar library to extract dimensions
      // For now, we'll leave it empty
    }

    // Create database record
    const fileType = getFileType(file.type)

    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert([
        {
          id: fileId,
          name: file.name,
          type: fileType,
          size: file.size,
          path: filePath,
          folder_id: folderId || null,
          mime_type: file.type,
          url: publicUrl,
          thumbnail_url: thumbnailUrl,
          user_id: user.id,
          tags: [],
          is_favorite: false,
          is_shared: false,
          metadata,
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('files').remove([filePath])
      return apiError(dbError.message, 500)
    }

    // Log activity
    await supabase.from('file_activities').insert([
      {
        file_id: fileId,
        user_id: user.id,
        action: 'created',
        details: `Uploaded ${file.name}`,
      },
    ])

    return apiSuccess(fileRecord, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
