'use client'

import { useState, useRef, useCallback } from 'react'
import { UploadProgress } from '@/types/file-manager'
import { formatFileSize, generateThumbnail, detectDuplicates } from '@/lib/utils/file-utils'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/modal'
import { Upload, X, Check, AlertCircle, Link as LinkIcon, Pause, Play } from 'lucide-react'

interface UploadZoneProps {
  isOpen: boolean
  onClose: () => void
  folderId: string | null
  onUploadComplete: (files: any[]) => void
}

export function UploadZone({ isOpen, onClose, folderId, onUploadComplete }: UploadZoneProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [pastedFiles, setPastedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Check for duplicates
    const duplicates = detectDuplicates(fileArray)
    if (duplicates.size > 0) {
      const confirmed = confirm(
        `Found ${duplicates.size} potential duplicate(s). Do you want to upload anyway?`
      )
      if (!confirmed) return
    }

    // Create upload progress entries
    const newUploads: UploadProgress[] = await Promise.all(
      fileArray.map(async (file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'pending' as const,
      }))
    )

    setUploads((prev) => [...prev, ...newUploads])

    // Start uploading files
    for (const upload of newUploads) {
      uploadFile(upload)
    }
  }, [])

  // Upload a single file
  const uploadFile = async (upload: UploadProgress) => {
    try {
      // Update status to uploading
      setUploads((prev) =>
        prev.map((u) => (u.id === upload.id ? { ...u, status: 'uploading' } : u))
      )

      const formData = new FormData()
      formData.append('file', upload.file)
      if (folderId) {
        formData.append('folder_id', folderId)
      }

      // Generate thumbnail for images
      const thumbnail = await generateThumbnail(upload.file)
      if (thumbnail) {
        formData.append('thumbnail', thumbnail)
      }

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id ? { ...u, progress } : u
            )
          )
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const result = JSON.parse(xhr.responseText)
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id
                ? { ...u, status: 'completed', progress: 100, result: result.data }
                : u
            )
          )
        } else {
          throw new Error('Upload failed')
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: 'error', error: 'Upload failed' }
              : u
          )
        )
      })

      xhr.open('POST', '/api/files/upload')
      xhr.send(formData)
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id
            ? { ...u, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : u
        )
      )
    }
  }

  // Upload from URL
  const uploadFromUrl = async () => {
    if (!urlInput.trim()) return

    try {
      const response = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, folder_id: folderId }),
      })

      if (!response.ok) throw new Error('Failed to upload from URL')

      const result = await response.json()

      setUploads((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          file: new File([], result.data.name),
          progress: 100,
          status: 'completed',
          result: result.data,
        },
      ])

      setUrlInput('')
      setShowUrlInput(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload from URL')
    }
  }

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  // Handle paste
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }

      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  // Remove upload
  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }

  // Retry failed upload
  const retryUpload = (upload: UploadProgress) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === upload.id ? { ...u, status: 'pending', progress: 0, error: undefined } : u))
    )
    uploadFile(upload)
  }

  // Check if all uploads are complete
  const allComplete = uploads.every((u) => u.status === 'completed' || u.status === 'error')
  const hasCompleted = uploads.some((u) => u.status === 'completed')

  const handleClose = () => {
    if (hasCompleted) {
      const completedFiles = uploads.filter((u) => u.status === 'completed' && u.result).map((u) => u.result)
      onUploadComplete(completedFiles)
    }
    setUploads([])
    onClose()
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} maxWidth="800px">
      <div
        className="p-6"
        onPaste={handlePaste}
        tabIndex={0}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Upload Files</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-opacity-50 transition-colors"
            style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Upload Area */}
        {uploads.length === 0 ? (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'border-opacity-100' : 'border-opacity-50'
              }`}
              style={{
                borderColor: dragActive ? 'var(--conductor-primary)' : 'var(--conductor-button-secondary-border)',
                backgroundColor: dragActive ? 'rgba(var(--conductor-primary-rgb), 0.1)' : 'transparent',
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload size={64} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Drop files here or click to upload</h3>
              <p className="text-sm opacity-75 mb-4">
                Support for images, videos, documents, and more
              </p>
              <p className="text-xs opacity-50 mb-4">
                Tip: You can also paste (Ctrl+V) to upload from clipboard
              </p>

              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Files
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                >
                  <LinkIcon size={16} />
                  Upload from URL
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
                accept="*/*"
              />
            </div>

            {showUrlInput && (
              <div className="mt-4 flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/file.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && uploadFromUrl()}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  style={{
                    borderColor: 'var(--conductor-button-secondary-border)',
                    backgroundColor: 'var(--conductor-bg)',
                    color: 'var(--conductor-body-color)',
                  }}
                />
                <Button onClick={uploadFromUrl}>Upload</Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Upload Progress List */}
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {upload.status === 'completed' && (
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                    {upload.status === 'error' && (
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                        <AlertCircle size={16} className="text-white" />
                      </div>
                    )}
                    {(upload.status === 'pending' || upload.status === 'uploading') && (
                      <div
                        className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--conductor-primary)', borderTopColor: 'transparent' }}
                      />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{upload.file.name}</div>
                    <div className="text-xs opacity-75">
                      {formatFileSize(upload.file.size)}
                      {upload.status === 'uploading' && ` - ${upload.progress}%`}
                      {upload.status === 'error' && upload.error && ` - ${upload.error}`}
                    </div>

                    {/* Progress Bar */}
                    {(upload.status === 'uploading' || upload.status === 'processing') && (
                      <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${upload.progress}%`,
                            backgroundColor: 'var(--conductor-primary)',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {upload.status === 'error' && (
                      <button
                        onClick={() => retryUpload(upload)}
                        className="p-2 rounded hover:bg-opacity-50 transition-colors"
                        style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                      >
                        <Play size={16} />
                      </button>
                    )}
                    {upload.status !== 'uploading' && upload.status !== 'processing' && (
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="p-2 rounded hover:bg-opacity-50 transition-colors"
                        style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Files Button */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Add More Files
              </Button>

              {allComplete && hasCompleted && (
                <Button onClick={handleClose}>
                  Done ({uploads.filter((u) => u.status === 'completed').length} uploaded)
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
              accept="*/*"
            />
          </>
        )}
      </div>
    </Dialog>
  )
}
