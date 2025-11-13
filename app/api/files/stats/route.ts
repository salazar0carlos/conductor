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

    // Get all files
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('size, type, created_at')
      .eq('user_id', user.id)

    if (filesError) throw filesError

    // Get folder count
    const { count: folderCount, error: folderError } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (folderError) throw folderError

    // Calculate stats
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const fileCount = files.length

    // Group by type
    const storageByType: Record<string, number> = {}
    files.forEach((file) => {
      storageByType[file.type] = (storageByType[file.type] || 0) + file.size
    })

    // Count recent uploads (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentUploads = files.filter(
      (file) => new Date(file.created_at) > sevenDaysAgo
    ).length

    // Get trending files (most accessed in last 30 days)
    const { data: trendingFiles, error: trendingError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (trendingError) throw trendingError

    const stats = {
      total_storage: totalSize,
      used_storage: totalSize,
      file_count: fileCount,
      folder_count: folderCount || 0,
      storage_by_type: storageByType,
      recent_uploads: recentUploads,
      trending_files: trendingFiles,
    }

    return apiSuccess(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
