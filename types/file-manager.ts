export type FileType = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'code' | 'archive' | 'other'

export type ViewMode = 'grid' | 'list'

export type SortBy = 'name' | 'date' | 'size' | 'type'

export interface FileItem {
  id: string
  name: string
  type: FileType
  size: number
  path: string
  folder_id: string | null
  mime_type: string
  url: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
  user_id: string
  tags: string[]
  is_favorite: boolean
  is_shared: boolean
  share_url?: string
  share_expires_at?: string
  metadata: {
    width?: number
    height?: number
    duration?: number
    pages?: number
    encoding?: string
    [key: string]: any
  }
  versions?: FileVersion[]
  comments?: FileComment[]
  activities?: FileActivity[]
}

export interface Folder {
  id: string
  name: string
  path: string
  parent_id: string | null
  user_id: string
  created_at: string
  updated_at: string
  file_count: number
  folder_count: number
  total_size: number
  is_favorite: boolean
  color?: string
}

export interface FileVersion {
  id: string
  file_id: string
  version_number: number
  size: number
  url: string
  created_at: string
  created_by: string
  notes?: string
}

export interface FileComment {
  id: string
  file_id: string
  user_id: string
  user_name: string
  comment: string
  created_at: string
  updated_at: string
}

export interface FileActivity {
  id: string
  file_id: string
  user_id: string
  user_name: string
  action: 'created' | 'updated' | 'moved' | 'renamed' | 'shared' | 'downloaded' | 'deleted' | 'restored'
  details?: string
  created_at: string
}

export interface UploadProgress {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  result?: FileItem
}

export interface AssetCollection {
  id: string
  name: string
  description?: string
  type: 'colors' | 'icons' | 'images' | 'fonts' | 'logos' | 'brand'
  items: AssetItem[]
  user_id: string
  created_at: string
  updated_at: string
}

export interface AssetItem {
  id: string
  collection_id: string
  name: string
  type: string
  value: string
  preview_url?: string
  metadata: Record<string, any>
  created_at: string
}

export interface StorageStats {
  total_storage: number
  used_storage: number
  file_count: number
  folder_count: number
  storage_by_type: Record<FileType, number>
  recent_uploads: number
  trending_files: FileItem[]
}

export interface FileFilters {
  search?: string
  type?: FileType[]
  tags?: string[]
  date_from?: string
  date_to?: string
  size_min?: number
  size_max?: number
  is_favorite?: boolean
  folder_id?: string | null
}

export interface BulkOperation {
  action: 'move' | 'copy' | 'delete' | 'tag' | 'favorite' | 'share'
  file_ids: string[]
  params?: Record<string, any>
}
