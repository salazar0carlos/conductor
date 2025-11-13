'use client'

import { useState, useEffect } from 'react'
import { FileItem } from '@/types/file-manager'
import { formatFileSize } from '@/lib/utils/file-utils'
import { Dialog } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import {
  X,
  Download,
  Share2,
  Star,
  Trash2,
  Edit2,
  Clock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Volume2
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface FilePreviewProps {
  file: FileItem | null
  isOpen: boolean
  onClose: () => void
  onAction: (action: string, file: FileItem) => void
  onNext?: () => void
  onPrevious?: () => void
}

export function FilePreview({
  file,
  isOpen,
  onClose,
  onAction,
  onNext,
  onPrevious
}: FilePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'details' | 'comments' | 'activity'>('preview')
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [comment, setComment] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // Reset state when file changes
    setZoom(100)
    setRotation(0)
    setActiveTab('preview')
  }, [file?.id])

  if (!file) return null

  const renderPreview = () => {
    // Image Preview
    if (file.type === 'image') {
      return (
        <div className="flex items-center justify-center h-full overflow-auto p-4">
          <img
            src={file.url}
            alt={file.name}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transition: 'transform 0.2s'
            }}
          />
        </div>
      )
    }

    // Video Preview
    if (file.type === 'video') {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <video
            src={file.url}
            controls
            autoPlay={isPlaying}
            className="max-w-full max-h-full"
            style={{ maxHeight: '80vh' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    // Audio Preview
    if (file.type === 'audio') {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-md w-full">
            <div className="text-6xl mb-6">🎵</div>
            <h3 className="text-xl font-semibold mb-4">{file.name}</h3>
            <audio
              src={file.url}
              controls
              autoPlay={isPlaying}
              className="w-full"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      )
    }

    // PDF Preview
    if (file.type === 'pdf') {
      return (
        <div className="h-full">
          <iframe
            src={file.url}
            className="w-full h-full"
            title={file.name}
          />
        </div>
      )
    }

    // Code Preview
    if (file.type === 'code' || file.mime_type.startsWith('text/')) {
      return (
        <div className="h-full">
          <MonacoEditor
            height="100%"
            language={getLanguageFromFilename(file.name)}
            theme="vs-dark"
            value="// Loading file content..."
            options={{
              readOnly: true,
              minimap: { enabled: true },
              fontSize: 14,
            }}
          />
        </div>
      )
    }

    // Default: No preview available
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <div className="text-xl font-semibold mb-2">No preview available</div>
          <div className="text-sm opacity-75 mb-4">Download the file to view it</div>
          <Button onClick={() => onAction('download', file)}>
            <Download size={16} />
            Download
          </Button>
        </div>
      </div>
    )
  }

  const renderDetails = () => (
    <div className="p-6 space-y-4 overflow-auto">
      <div>
        <div className="text-sm opacity-75 mb-1">File Name</div>
        <div className="font-medium">{file.name}</div>
      </div>

      <div>
        <div className="text-sm opacity-75 mb-1">File Type</div>
        <div className="font-medium">{file.mime_type}</div>
      </div>

      <div>
        <div className="text-sm opacity-75 mb-1">File Size</div>
        <div className="font-medium">{formatFileSize(file.size)}</div>
      </div>

      <div>
        <div className="text-sm opacity-75 mb-1">Created</div>
        <div className="font-medium">{new Date(file.created_at).toLocaleString()}</div>
      </div>

      <div>
        <div className="text-sm opacity-75 mb-1">Modified</div>
        <div className="font-medium">{new Date(file.updated_at).toLocaleString()}</div>
      </div>

      <div>
        <div className="text-sm opacity-75 mb-1">Path</div>
        <div className="font-medium font-mono text-sm">{file.path}</div>
      </div>

      {file.metadata.width && file.metadata.height && (
        <div>
          <div className="text-sm opacity-75 mb-1">Dimensions</div>
          <div className="font-medium">
            {file.metadata.width} x {file.metadata.height}
          </div>
        </div>
      )}

      {file.metadata.duration && (
        <div>
          <div className="text-sm opacity-75 mb-1">Duration</div>
          <div className="font-medium">{Math.round(file.metadata.duration)}s</div>
        </div>
      )}

      <div>
        <div className="text-sm opacity-75 mb-2">Tags</div>
        <div className="flex flex-wrap gap-2">
          {file.tags.length > 0 ? (
            file.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-sm opacity-50">No tags</span>
          )}
        </div>
      </div>

      {file.is_shared && file.share_url && (
        <div>
          <div className="text-sm opacity-75 mb-1">Share Link</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={file.share_url}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: 'var(--conductor-button-secondary-border)',
                backgroundColor: 'var(--conductor-bg)',
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(file.share_url!)}
            >
              Copy
            </Button>
          </div>
          {file.share_expires_at && (
            <div className="text-xs opacity-75 mt-1">
              Expires: {new Date(file.share_expires_at).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderComments = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {file.comments && file.comments.length > 0 ? (
          file.comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="font-semibold">{comment.user_name}</div>
                <div className="text-xs opacity-75">
                  {new Date(comment.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-sm">{comment.comment}</div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 opacity-50">
            No comments yet
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && comment.trim()) {
                // Handle comment submission
                setComment('')
              }
            }}
            className="flex-1 px-4 py-2 rounded-lg border"
            style={{
              borderColor: 'var(--conductor-button-secondary-border)',
              backgroundColor: 'var(--conductor-bg)',
            }}
          />
          <Button
            onClick={() => {
              if (comment.trim()) {
                // Handle comment submission
                setComment('')
              }
            }}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  )

  const renderActivity = () => (
    <div className="p-6 overflow-auto">
      {file.activities && file.activities.length > 0 ? (
        <div className="space-y-3">
          {file.activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
            >
              <Clock size={16} className="mt-1 opacity-50" />
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-semibold">{activity.user_name}</span>{' '}
                  {activity.action} this file
                  {activity.details && ` - ${activity.details}`}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 opacity-50">
          No activity yet
        </div>
      )}
    </div>
  )

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="1200px" fullHeight>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{file.name}</h2>
              {file.is_favorite && (
                <Star size={20} fill="gold" stroke="gold" />
              )}
            </div>

            <div className="flex items-center gap-2">
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  className="p-2 rounded-lg hover:bg-opacity-50"
                  style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-2 rounded-lg hover:bg-opacity-50"
                  style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                >
                  <ChevronRight size={20} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-opacity-50"
                style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => onAction('download', file)}>
              <Download size={16} />
              Download
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction('share', file)}>
              <Share2 size={16} />
              Share
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction('favorite', file)}>
              <Star size={16} />
              {file.is_favorite ? 'Unfavorite' : 'Favorite'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction('rename', file)}>
              <Edit2 size={16} />
              Rename
            </Button>
            <Button size="sm" variant="danger" onClick={() => onAction('delete', file)}>
              <Trash2 size={16} />
              Delete
            </Button>

            {/* Zoom controls for images */}
            {file.type === 'image' && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="p-2 rounded hover:bg-opacity-50"
                  style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-sm px-2">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(400, zoom + 25))}
                  className="p-2 rounded hover:bg-opacity-50"
                  style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="p-2 rounded hover:bg-opacity-50"
                  style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                >
                  ↻
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b" style={{ borderColor: 'var(--conductor-button-secondary-border)' }}>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'preview' ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                borderColor: activeTab === 'preview' ? 'var(--conductor-primary)' : 'transparent',
              }}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'details' ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                borderColor: activeTab === 'details' ? 'var(--conductor-primary)' : 'transparent',
              }}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'comments' ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                borderColor: activeTab === 'comments' ? 'var(--conductor-primary)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={16} />
                Comments {file.comments && `(${file.comments.length})`}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'activity' ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                borderColor: activeTab === 'activity' ? 'var(--conductor-primary)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} />
                Activity
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'preview' && renderPreview()}
          {activeTab === 'details' && renderDetails()}
          {activeTab === 'comments' && renderComments()}
          {activeTab === 'activity' && renderActivity()}
        </div>
      </div>
    </Dialog>
  )
}

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    xml: 'xml',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
  }
  return languageMap[ext || ''] || 'plaintext'
}
