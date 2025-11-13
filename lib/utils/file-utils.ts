import { FileType } from '@/types/file-manager'

export function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('text/')
  ) return 'document'
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('json') ||
    mimeType.includes('html') ||
    mimeType.includes('css') ||
    mimeType.includes('xml')
  ) return 'code'
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar') ||
    mimeType.includes('gz')
  ) return 'archive'
  return 'other'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function getFileIcon(type: FileType): string {
  const icons: Record<FileType, string> = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    pdf: '📄',
    document: '📝',
    code: '💻',
    archive: '📦',
    other: '📎'
  }
  return icons[type] || icons.other
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

export function isPDFFile(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

export function isPreviewable(mimeType: string): boolean {
  return (
    isImageFile(mimeType) ||
    isVideoFile(mimeType) ||
    isAudioFile(mimeType) ||
    isPDFFile(mimeType) ||
    mimeType.startsWith('text/')
  )
}

export function generateThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!isImageFile(file.type)) {
      resolve(null)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const MAX_SIZE = 200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = () => resolve(null)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

export function chunkFile(file: File, chunkSize: number = 1024 * 1024): Blob[] {
  const chunks: Blob[] = []
  let offset = 0

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize)
    chunks.push(chunk)
    offset += chunkSize
  }

  return chunks
}

export function buildFilePath(folders: string[]): string {
  return folders.filter(Boolean).join('/')
}

export function parseFilePath(path: string): string[] {
  return path.split('/').filter(Boolean)
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
}

export function getColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = hash % 360
  return `hsl(${hue}, 70%, 60%)`
}

export function detectDuplicates(files: File[]): Map<string, File[]> {
  const duplicates = new Map<string, File[]>()

  files.forEach(file => {
    const key = `${file.name}-${file.size}`
    const existing = duplicates.get(key) || []
    existing.push(file)
    duplicates.set(key, existing)
  })

  // Filter out non-duplicates
  const result = new Map<string, File[]>()
  duplicates.forEach((files, key) => {
    if (files.length > 1) {
      result.set(key, files)
    }
  })

  return result
}

export function sortFiles<T extends { name: string; created_at: string; size: number; type?: FileType }>(
  files: T[],
  sortBy: 'name' | 'date' | 'size' | 'type',
  ascending: boolean = true
): T[] {
  const sorted = [...files].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'type':
        comparison = (a.type || '').localeCompare(b.type || '')
        break
    }

    return ascending ? comparison : -comparison
  })

  return sorted
}
