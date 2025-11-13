// File Manager Configuration Constants

export const FILE_MANAGER_CONFIG = {
  // Maximum file size in bytes (100MB)
  MAX_FILE_SIZE: 100 * 1024 * 1024,

  // Maximum files per upload
  MAX_FILES_PER_UPLOAD: 50,

  // Chunk size for large file uploads (1MB)
  CHUNK_SIZE: 1024 * 1024,

  // Thumbnail dimensions
  THUMBNAIL_SIZE: 200,

  // Thumbnail quality (0-1)
  THUMBNAIL_QUALITY: 0.8,

  // Default share link expiry (days)
  DEFAULT_SHARE_EXPIRY_DAYS: 7,

  // Slideshow interval (milliseconds)
  SLIDESHOW_INTERVAL: 3000,

  // Auto-save delay (milliseconds)
  AUTO_SAVE_DELAY: 1000,
}

export const SUPPORTED_FILE_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
  ],
  videos: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
  ],
  audio: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
  ],
  code: [
    'text/javascript',
    'text/typescript',
    'application/json',
    'text/html',
    'text/css',
    'text/xml',
    'application/xml',
  ],
  archives: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-7z-compressed',
  ],
}

export const FILE_ICONS = {
  image: '🖼️',
  video: '🎥',
  audio: '🎵',
  pdf: '📄',
  document: '📝',
  code: '💻',
  archive: '📦',
  folder: '📁',
  other: '📎',
}

export const FILE_TYPE_COLORS = {
  image: '#10b981', // green
  video: '#8b5cf6', // purple
  audio: '#f59e0b', // amber
  pdf: '#ef4444', // red
  document: '#3b82f6', // blue
  code: '#6366f1', // indigo
  archive: '#ec4899', // pink
  other: '#6b7280', // gray
}

export const GRID_COLUMNS = {
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
  '2xl': 6,
}

export const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date Modified' },
  { value: 'size', label: 'File Size' },
  { value: 'type', label: 'File Type' },
]

export const VIEW_MODES = ['grid', 'list'] as const

export const ASSET_TYPES = [
  'colors',
  'icons',
  'images',
  'fonts',
  'logos',
  'brand',
] as const

export const FILE_OPERATIONS = [
  'rename',
  'move',
  'copy',
  'share',
  'tag',
  'favorite',
  'delete',
] as const

export const AI_OPERATIONS = [
  'auto-tag',
  'detect-duplicates',
  'compress',
  'resize',
  'background-remove',
  'enhance',
  'ocr',
] as const

export const SHARE_EXPIRY_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
  { value: 0, label: 'Never expires' },
]

export const KEYBOARD_SHORTCUTS = {
  upload: 'Ctrl+U',
  search: 'Ctrl+F',
  newFolder: 'Ctrl+Shift+N',
  selectAll: 'Ctrl+A',
  delete: 'Delete',
  rename: 'F2',
  preview: 'Space',
  nextFile: 'ArrowRight',
  previousFile: 'ArrowLeft',
  closeModal: 'Escape',
  zoomIn: '+',
  zoomOut: '-',
}

export const ERROR_MESSAGES = {
  uploadFailed: 'Failed to upload file. Please try again.',
  deleteFailed: 'Failed to delete file. Please try again.',
  renameFailed: 'Failed to rename file. Please try again.',
  moveFailed: 'Failed to move file. Please try again.',
  shareFailed: 'Failed to generate share link. Please try again.',
  loadFailed: 'Failed to load files. Please refresh the page.',
  unauthorized: 'You are not authorized to perform this action.',
  fileTooLarge: `File size exceeds maximum allowed size of ${FILE_MANAGER_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
  tooManyFiles: `You can only upload ${FILE_MANAGER_CONFIG.MAX_FILES_PER_UPLOAD} files at a time`,
  invalidFileType: 'This file type is not supported',
}

export const SUCCESS_MESSAGES = {
  uploadSuccess: 'File uploaded successfully',
  deleteSuccess: 'File deleted successfully',
  renameSuccess: 'File renamed successfully',
  moveSuccess: 'File moved successfully',
  copySuccess: 'File copied successfully',
  shareSuccess: 'Share link generated successfully',
  favoriteAdded: 'Added to favorites',
  favoriteRemoved: 'Removed from favorites',
  tagSuccess: 'Tags updated successfully',
}
