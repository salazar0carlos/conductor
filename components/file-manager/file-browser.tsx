'use client'

import { useState, useEffect, useMemo } from 'react'
import { FileItem, Folder, ViewMode, SortBy, FileFilters } from '@/types/file-manager'
import { formatFileSize, getFileIcon, sortFiles } from '@/lib/utils/file-utils'
import { Button } from '@/components/ui/button'
import {
  Grid3x3,
  List,
  FolderOpen,
  Star,
  Share2,
  Download,
  Trash2,
  MoreVertical,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronRight,
  Home
} from 'lucide-react'

interface FileBrowserProps {
  files: FileItem[]
  folders: Folder[]
  currentFolder: string | null
  onFileSelect: (file: FileItem) => void
  onFolderNavigate: (folderId: string | null) => void
  onFileAction: (action: string, file: FileItem) => void
  onBulkAction: (action: string, fileIds: string[]) => void
  onUploadClick: () => void
  isLoading?: boolean
}

export function FileBrowser({
  files,
  folders,
  currentFolder,
  onFileSelect,
  onFolderNavigate,
  onFileAction,
  onBulkAction,
  onUploadClick,
  isLoading = false
}: FileBrowserProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortAscending, setSortAscending] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FileFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Build breadcrumb path
  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Home' }]

    if (currentFolder) {
      const findPath = (folderId: string, path: Array<{ id: string; name: string }> = []): boolean => {
        const folder = folders.find(f => f.id === folderId)
        if (!folder) return false

        path.unshift({ id: folder.id, name: folder.name })

        if (folder.parent_id) {
          return findPath(folder.parent_id, path)
        }

        return true
      }

      const path: Array<{ id: string; name: string }> = []
      if (findPath(currentFolder, path)) {
        crumbs.push(...path)
      }
    }

    return crumbs
  }, [currentFolder, folders])

  // Filter and sort files
  const displayedFiles = useMemo(() => {
    let filtered = files.filter(file => file.folder_id === currentFolder)

    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(search) ||
        file.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    // Apply type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(file => filters.type!.includes(file.type))
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(file =>
        filters.tags!.some(tag => file.tags.includes(tag))
      )
    }

    // Apply favorite filter
    if (filters.is_favorite) {
      filtered = filtered.filter(file => file.is_favorite)
    }

    // Apply date filters
    if (filters.date_from) {
      filtered = filtered.filter(file => new Date(file.created_at) >= new Date(filters.date_from!))
    }
    if (filters.date_to) {
      filtered = filtered.filter(file => new Date(file.created_at) <= new Date(filters.date_to!))
    }

    // Apply size filters
    if (filters.size_min !== undefined) {
      filtered = filtered.filter(file => file.size >= filters.size_min!)
    }
    if (filters.size_max !== undefined) {
      filtered = filtered.filter(file => file.size <= filters.size_max!)
    }

    return sortFiles(filtered, sortBy, sortAscending)
  }, [files, currentFolder, filters, sortBy, sortAscending])

  const displayedFolders = useMemo(() => {
    let filtered = folders.filter(folder => folder.parent_id === currentFolder)

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(folder => folder.name.toLowerCase().includes(search))
    }

    return filtered.sort((a, b) =>
      sortAscending
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    )
  }, [folders, currentFolder, filters.search, sortAscending])

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const selectAll = () => {
    if (selectedFiles.size === displayedFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(displayedFiles.map(f => f.id)))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    // Handle file drops - will be implemented in parent
    onUploadClick()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b p-4 space-y-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm overflow-x-auto">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || 'home'} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={16} className="opacity-50" />}
              <button
                onClick={() => onFolderNavigate(crumb.id)}
                className="hover:underline whitespace-nowrap flex items-center gap-1"
                style={{ color: 'var(--conductor-body-color)' }}
              >
                {index === 0 && <Home size={14} />}
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Search and Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--conductor-button-secondary-border)',
                backgroundColor: 'var(--conductor-bg)',
                color: 'var(--conductor-body-color)'
              }}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} />
            Filters
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortAscending(!sortAscending)}
          >
            <ArrowUpDown size={16} />
          </Button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border rounded-lg text-sm"
            style={{
              borderColor: 'var(--conductor-button-secondary-border)',
              backgroundColor: 'var(--conductor-bg)',
              color: 'var(--conductor-body-color)'
            }}
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>

          <div className="flex border rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'opacity-100' : 'opacity-50'}`}
              style={{
                backgroundColor: viewMode === 'grid' ? 'var(--conductor-button-secondary-bg)' : 'transparent'
              }}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'opacity-100' : 'opacity-50'}`}
              style={{
                backgroundColor: viewMode === 'list' ? 'var(--conductor-button-secondary-bg)' : 'transparent'
              }}
            >
              <List size={18} />
            </button>
          </div>

          <Button onClick={onUploadClick}>
            Upload Files
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedFiles.size > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}>
            <span className="text-sm font-medium">
              {selectedFiles.size} selected
            </span>
            <Button size="sm" variant="ghost" onClick={() => onBulkAction('download', Array.from(selectedFiles))}>
              <Download size={16} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onBulkAction('share', Array.from(selectedFiles))}>
              <Share2 size={16} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onBulkAction('delete', Array.from(selectedFiles))}>
              <Trash2 size={16} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedFiles(new Set())}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* File Browser Area */}
      <div
        className="flex-1 overflow-auto p-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="absolute inset-4 border-4 border-dashed rounded-lg flex items-center justify-center z-10"
            style={{
              borderColor: 'var(--conductor-primary)',
              backgroundColor: 'rgba(var(--conductor-primary-rgb), 0.1)'
            }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">📁</div>
              <div className="text-lg font-semibold">Drop files here to upload</div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mb-2"
                style={{ borderColor: 'var(--conductor-primary)', borderTopColor: 'transparent' }}
              />
              <div>Loading files...</div>
            </div>
          </div>
        ) : displayedFolders.length === 0 && displayedFiles.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FolderOpen size={64} className="mx-auto mb-4 opacity-50" />
              <div className="text-xl font-semibold mb-2">No files yet</div>
              <div className="text-sm opacity-75 mb-4">Upload files to get started</div>
              <Button onClick={onUploadClick}>Upload Files</Button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {/* Folders */}
                {displayedFolders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => onFolderNavigate(folder.id)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-square rounded-lg border-2 flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105"
                      style={{
                        borderColor: 'var(--conductor-button-secondary-border)',
                        backgroundColor: 'var(--conductor-button-secondary-bg)'
                      }}
                    >
                      <FolderOpen size={48} style={{ color: folder.color || 'var(--conductor-primary)' }} />
                      {folder.is_favorite && (
                        <Star size={16} className="absolute top-2 right-2" fill="gold" stroke="gold" />
                      )}
                    </div>
                    <div className="mt-2 text-sm font-medium truncate" title={folder.name}>
                      {folder.name}
                    </div>
                    <div className="text-xs opacity-75">
                      {folder.file_count} files
                    </div>
                  </div>
                ))}

                {/* Files */}
                {displayedFiles.map(file => (
                  <div
                    key={file.id}
                    className="cursor-pointer group relative"
                  >
                    <div
                      onClick={() => onFileSelect(file)}
                      className="aspect-square rounded-lg border-2 relative overflow-hidden transition-transform hover:scale-105"
                      style={{
                        borderColor: selectedFiles.has(file.id) ? 'var(--conductor-primary)' : 'var(--conductor-button-secondary-border)',
                        backgroundColor: 'var(--conductor-button-secondary-bg)'
                      }}
                    >
                      {file.thumbnail_url ? (
                        <img
                          src={file.thumbnail_url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {getFileIcon(file.type)}
                        </div>
                      )}

                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded"
                        />
                      </div>

                      {file.is_favorite && (
                        <Star size={16} className="absolute top-2 right-2" fill="gold" stroke="gold" />
                      )}

                      {file.is_shared && (
                        <Share2 size={16} className="absolute bottom-2 right-2" style={{ color: 'var(--conductor-primary)' }} />
                      )}
                    </div>
                    <div className="mt-2 text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-xs opacity-75">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {/* Folders */}
                {displayedFolders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => onFolderNavigate(folder.id)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-50 cursor-pointer transition-colors"
                    style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                  >
                    <FolderOpen size={24} style={{ color: folder.color || 'var(--conductor-primary)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{folder.name}</div>
                      <div className="text-xs opacity-75">{folder.file_count} files</div>
                    </div>
                    {folder.is_favorite && (
                      <Star size={16} fill="gold" stroke="gold" />
                    )}
                  </div>
                ))}

                {/* Files */}
                {displayedFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-50 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: selectedFiles.has(file.id)
                        ? 'var(--conductor-button-primary-bg)'
                        : 'var(--conductor-button-secondary-bg)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded"
                    />

                    <div
                      onClick={() => onFileSelect(file)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {file.thumbnail_url ? (
                        <img
                          src={file.thumbnail_url}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-2xl">
                          {getFileIcon(file.type)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-xs opacity-75 flex items-center gap-2">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.created_at).toLocaleDateString()}</span>
                          {file.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{file.tags.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {file.is_favorite && (
                          <Star size={16} fill="gold" stroke="gold" />
                        )}
                        {file.is_shared && (
                          <Share2 size={16} style={{ color: 'var(--conductor-primary)' }} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
