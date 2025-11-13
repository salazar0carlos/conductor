'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileItem } from '@/types/file-manager'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Star,
  Grid3x3,
  Maximize2,
  Play,
  Pause
} from 'lucide-react'

interface MediaGalleryProps {
  files: FileItem[]
  initialIndex?: number
  onClose: () => void
  onFileAction?: (action: string, file: FileItem) => void
}

export function MediaGallery({
  files,
  initialIndex = 0,
  onClose,
  onFileAction
}: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(100)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [slideshowInterval, setSlideshowInterval] = useState<NodeJS.Timeout | null>(null)

  const currentFile = files[currentIndex]

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        setZoom(Math.min(400, zoom + 25))
      } else if (e.key === '-' || e.key === '_') {
        setZoom(Math.max(25, zoom - 25))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, files.length, zoom])

  // Slideshow
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        goToNext()
      }, 3000)
      setSlideshowInterval(interval)
      return () => clearInterval(interval)
    } else if (slideshowInterval) {
      clearInterval(slideshowInterval)
      setSlideshowInterval(null)
    }
  }, [isPlaying, currentIndex])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % files.length)
    setZoom(100)
  }, [files.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + files.length) % files.length)
    setZoom(100)
  }, [files.length])

  const goToIndex = (index: number) => {
    setCurrentIndex(index)
    setZoom(100)
  }

  const toggleSlideshow = () => {
    setIsPlaying(!isPlaying)
  }

  const renderMedia = (file: FileItem) => {
    if (file.type === 'image') {
      return (
        <img
          src={file.url}
          alt={file.name}
          style={{
            transform: `scale(${zoom / 100})`,
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transition: 'transform 0.2s'
          }}
        />
      )
    }

    if (file.type === 'video') {
      return (
        <video
          src={file.url}
          controls
          autoPlay
          className="max-w-full max-h-full"
          style={{ maxHeight: '80vh' }}
        >
          Your browser does not support the video tag.
        </video>
      )
    }

    return (
      <div className="text-center">
        <div className="text-4xl mb-4">📄</div>
        <div className="text-lg">Cannot preview this file type</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-lg font-semibold truncate max-w-md">
              {currentFile.name}
            </h2>
            <span className="text-white/60 text-sm">
              {currentIndex + 1} / {files.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentFile.type === 'image' && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  style={{ color: 'white' }}
                >
                  <ZoomOut size={16} />
                </Button>
                <span className="text-white text-sm px-2">{zoom}%</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setZoom(Math.min(400, zoom + 25))}
                  style={{ color: 'white' }}
                >
                  <ZoomIn size={16} />
                </Button>
                <div className="w-px h-6 bg-white/20 mx-2" />
              </>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={toggleSlideshow}
              style={{ color: 'white' }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowThumbnails(!showThumbnails)}
              style={{ color: 'white' }}
            >
              <Grid3x3 size={16} />
            </Button>

            {onFileAction && (
              <>
                <div className="w-px h-6 bg-white/20 mx-2" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onFileAction('download', currentFile)}
                  style={{ color: 'white' }}
                >
                  <Download size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onFileAction('share', currentFile)}
                  style={{ color: 'white' }}
                >
                  <Share2 size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onFileAction('favorite', currentFile)}
                  style={{ color: 'white' }}
                >
                  <Star
                    size={16}
                    fill={currentFile.is_favorite ? 'gold' : 'none'}
                    stroke={currentFile.is_favorite ? 'gold' : 'currentColor'}
                  />
                </Button>
              </>
            )}

            <div className="w-px h-6 bg-white/20 mx-2" />

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'white' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="absolute inset-0 flex items-center justify-center p-16">
        {renderMedia(currentFile)}
      </div>

      {/* Navigation buttons */}
      {files.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            style={{ color: 'white' }}
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            style={{ color: 'white' }}
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {showThumbnails && files.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {files.map((file, index) => (
              <button
                key={file.id}
                onClick={() => goToIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-white/20 hover:border-white/50'
                }`}
              >
                {file.type === 'image' ? (
                  <img
                    src={file.thumbnail_url || file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : file.type === 'video' ? (
                  <div className="w-full h-full bg-black/50 flex items-center justify-center">
                    <Play size={24} className="text-white" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-black/50 flex items-center justify-center text-2xl">
                    📄
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-3 py-2 rounded-lg">
        {currentFile.metadata.width && currentFile.metadata.height && (
          <div>
            {currentFile.metadata.width} × {currentFile.metadata.height}
          </div>
        )}
      </div>
    </div>
  )
}
