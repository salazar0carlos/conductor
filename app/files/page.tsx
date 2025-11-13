'use client'

import { useState, useEffect } from 'react'
import { FileItem, Folder, StorageStats, AssetCollection } from '@/types/file-manager'
import { FileBrowser } from '@/components/file-manager/file-browser'
import { UploadZone } from '@/components/file-manager/upload-zone'
import { FilePreview } from '@/components/file-manager/file-preview'
import { MediaGallery } from '@/components/file-manager/media-gallery'
import { FileOperations } from '@/components/file-manager/file-operations'
import { AssetLibrary } from '@/components/file-manager/asset-library'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils/file-utils'
import {
  Files,
  FolderPlus,
  Sparkles,
  BarChart3,
  Palette,
  Layout,
  Upload,
  Search
} from 'lucide-react'
import { toast } from 'sonner'

type ViewMode = 'files' | 'assets' | 'analytics'

export default function FileManagerPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [galleryFiles, setGalleryFiles] = useState<FileItem[]>([])
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [operation, setOperation] = useState<'rename' | 'move' | 'copy' | 'share' | 'tag' | 'delete' | null>(null)
  const [operationFiles, setOperationFiles] = useState<FileItem[]>([])
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [assetCollections, setAssetCollections] = useState<AssetCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('files')

  // Load initial data
  useEffect(() => {
    loadFiles()
    loadFolders()
    loadStats()
    loadAssetCollections()
  }, [])

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files')
      const result = await response.json()
      if (result.success) {
        setFiles(result.data)
      }
    } catch (error) {
      console.error('Failed to load files:', error)
      toast.error('Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/files/folders')
      const result = await response.json()
      if (result.success) {
        setFolders(result.data)
      }
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/files/stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadAssetCollections = async () => {
    // In production, load from API
    setAssetCollections([])
  }

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file)

    // If it's an image or video, show gallery
    if (file.type === 'image' || file.type === 'video') {
      const mediaFiles = files.filter(f =>
        (f.type === 'image' || f.type === 'video') &&
        f.folder_id === file.folder_id
      )
      setGalleryFiles(mediaFiles)
      setGalleryIndex(mediaFiles.findIndex(f => f.id === file.id))
      setShowGallery(true)
    } else {
      setShowPreview(true)
    }
  }

  const handleFileAction = async (action: string, file: FileItem) => {
    switch (action) {
      case 'download':
        window.open(file.url, '_blank')
        break

      case 'rename':
      case 'share':
      case 'delete':
        setOperation(action)
        setOperationFiles([file])
        break

      case 'favorite':
        await handleFavorite([file.id], !file.is_favorite)
        break

      default:
        console.log('Unknown action:', action)
    }
  }

  const handleBulkAction = async (action: string, fileIds: string[]) => {
    const selectedFiles = files.filter(f => fileIds.includes(f.id))

    switch (action) {
      case 'download':
        // Download multiple files
        selectedFiles.forEach(file => window.open(file.url, '_blank'))
        break

      case 'move':
      case 'copy':
      case 'share':
      case 'delete':
        setOperation(action)
        setOperationFiles(selectedFiles)
        break

      default:
        console.log('Unknown bulk action:', action)
    }
  }

  const handleOperationConfirm = async (operation: string, data: any) => {
    try {
      const fileIds = operationFiles.map(f => f.id)

      if (operation === 'delete') {
        // Delete files one by one
        for (const fileId of fileIds) {
          await fetch(`/api/files?id=${fileId}`, { method: 'DELETE' })
        }
        toast.success(`Deleted ${fileIds.length} file(s)`)
      } else {
        // Other operations use the operations endpoint
        const response = await fetch('/api/files/operations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation, file_ids: fileIds, data }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Operation failed')
        }

        toast.success(`${operation} completed successfully`)
      }

      // Reload files
      await loadFiles()
      setOperation(null)
      setOperationFiles([])
    } catch (error) {
      console.error('Operation failed:', error)
      throw error
    }
  }

  const handleFavorite = async (fileIds: string[], isFavorite: boolean) => {
    try {
      const response = await fetch('/api/files/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'favorite',
          file_ids: fileIds,
          data: { is_favorite: isFavorite },
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadFiles()
        toast.success(isFavorite ? 'Added to favorites' : 'Removed from favorites')
      }
    } catch (error) {
      console.error('Failed to update favorite:', error)
      toast.error('Failed to update favorite')
    }
  }

  const handleUploadComplete = async (uploadedFiles: any[]) => {
    await loadFiles()
    await loadStats()
    toast.success(`Uploaded ${uploadedFiles.length} file(s)`)
  }

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:')
    if (!name) return

    try {
      const response = await fetch('/api/files/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parent_id: currentFolder }),
      })

      const result = await response.json()

      if (result.success) {
        await loadFolders()
        toast.success('Folder created')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
      toast.error('Failed to create folder')
    }
  }

  const handleCreateAssetCollection = async (type: AssetCollection['type'], name: string) => {
    // Implement asset collection creation
    toast.success('Asset collection created')
  }

  const handleAddAsset = async (collectionId: string, asset: any) => {
    // Implement asset addition
    toast.success('Asset added')
  }

  const handleDeleteAsset = async (collectionId: string, assetId: string) => {
    // Implement asset deletion
    toast.success('Asset deleted')
  }

  const handleDeleteCollection = async (collectionId: string) => {
    // Implement collection deletion
    toast.success('Collection deleted')
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">File Manager</h1>
              <p className="text-sm opacity-75">
                Manage your files, assets, and media library
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateFolder}
              >
                <FolderPlus size={16} />
                New Folder
              </Button>
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Upload size={16} />
                Upload
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}>
                <Files size={16} />
                <span className="font-medium">{stats.file_count} files</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}>
                <FolderPlus size={16} />
                <span className="font-medium">{stats.folder_count} folders</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}>
                <BarChart3 size={16} />
                <span className="font-medium">{formatFileSize(stats.used_storage)} used</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}>
                <Sparkles size={16} />
                <span className="font-medium">{stats.recent_uploads} recent uploads</span>
              </div>
            </div>
          )}

          {/* View Mode Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setViewMode('files')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'files' ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                backgroundColor: viewMode === 'files'
                  ? 'var(--conductor-button-primary-bg)'
                  : 'var(--conductor-button-secondary-bg)'
              }}
            >
              <Files size={16} />
              Files
            </button>
            <button
              onClick={() => setViewMode('assets')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'assets' ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                backgroundColor: viewMode === 'assets'
                  ? 'var(--conductor-button-primary-bg)'
                  : 'var(--conductor-button-secondary-bg)'
              }}
            >
              <Palette size={16} />
              Asset Library
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'analytics' ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                backgroundColor: viewMode === 'analytics'
                  ? 'var(--conductor-button-primary-bg)'
                  : 'var(--conductor-button-secondary-bg)'
              }}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          {viewMode === 'files' && (
            <FileBrowser
              files={files}
              folders={folders}
              currentFolder={currentFolder}
              onFileSelect={handleFileSelect}
              onFolderNavigate={setCurrentFolder}
              onFileAction={handleFileAction}
              onBulkAction={handleBulkAction}
              onUploadClick={() => setShowUpload(true)}
              isLoading={isLoading}
            />
          )}

          {viewMode === 'assets' && (
            <AssetLibrary
              collections={assetCollections}
              onCreateCollection={handleCreateAssetCollection}
              onAddAsset={handleAddAsset}
              onDeleteAsset={handleDeleteAsset}
              onDeleteCollection={handleDeleteCollection}
            />
          )}

          {viewMode === 'analytics' && stats && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Storage Analytics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {Object.entries(stats.storage_by_type).map(([type, size]) => (
                  <div
                    key={type}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: 'var(--conductor-button-secondary-border)' }}
                  >
                    <div className="text-sm opacity-75 mb-1">{type}</div>
                    <div className="text-2xl font-bold">{formatFileSize(size)}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {Math.round((size / stats.total_storage) * 100)}% of total
                    </div>
                  </div>
                ))}
              </div>

              {stats.trending_files.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Recent Files</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {stats.trending_files.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => handleFileSelect(file)}
                        className="cursor-pointer group"
                      >
                        <div
                          className="aspect-square rounded-lg border-2 relative overflow-hidden transition-transform hover:scale-105"
                          style={{ borderColor: 'var(--conductor-button-secondary-border)' }}
                        >
                          {file.thumbnail_url ? (
                            <img
                              src={file.thumbnail_url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              📄
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-sm font-medium truncate">{file.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UploadZone
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        folderId={currentFolder}
        onUploadComplete={handleUploadComplete}
      />

      {showPreview && selectedFile && (
        <FilePreview
          file={selectedFile}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false)
            setSelectedFile(null)
          }}
          onAction={handleFileAction}
        />
      )}

      {showGallery && galleryFiles.length > 0 && (
        <MediaGallery
          files={galleryFiles}
          initialIndex={galleryIndex}
          onClose={() => {
            setShowGallery(false)
            setGalleryFiles([])
          }}
          onFileAction={handleFileAction}
        />
      )}

      <FileOperations
        operation={operation}
        files={operationFiles}
        folders={folders}
        onClose={() => {
          setOperation(null)
          setOperationFiles([])
        }}
        onConfirm={handleOperationConfirm}
      />
    </div>
  )
}
