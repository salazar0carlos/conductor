'use client'

import { useState } from 'react'
import { FileItem, Folder } from '@/types/file-manager'
import { Dialog } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Copy, Link as LinkIcon, Tag, FolderOpen } from 'lucide-react'

interface FileOperationsProps {
  operation: 'rename' | 'move' | 'copy' | 'share' | 'tag' | 'delete' | null
  files: FileItem[]
  folders: Folder[]
  onClose: () => void
  onConfirm: (operation: string, data: any) => Promise<void>
}

export function FileOperations({
  operation,
  files,
  folders,
  onClose,
  onConfirm
}: FileOperationsProps) {
  const [newName, setNewName] = useState(files[0]?.name || '')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [shareExpiry, setShareExpiry] = useState<string>('7')
  const [tags, setTags] = useState<string>(files[0]?.tags.join(', ') || '')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async () => {
    setIsProcessing(true)
    try {
      let data: any = {}

      switch (operation) {
        case 'rename':
          data = { new_name: newName }
          break
        case 'move':
        case 'copy':
          data = { folder_id: selectedFolder }
          break
        case 'share':
          data = { expiry_days: parseInt(shareExpiry) }
          break
        case 'tag':
          data = { tags: tags.split(',').map(t => t.trim()).filter(Boolean) }
          break
        case 'delete':
          data = {}
          break
      }

      await onConfirm(operation, data)
      onClose()
    } catch (error) {
      console.error('Operation failed:', error)
      alert(error instanceof Error ? error.message : 'Operation failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderContent = () => {
    const fileCount = files.length

    switch (operation) {
      case 'rename':
        return (
          <div className="space-y-4">
            <div>
              <Label>New name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                autoFocus
              />
            </div>
            <div className="text-sm opacity-75">
              Renaming: {files[0].name}
            </div>
          </div>
        )

      case 'move':
      case 'copy':
        return (
          <div className="space-y-4">
            <div>
              <Label>Select destination folder</Label>
              <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left p-3 hover:bg-opacity-50 flex items-center gap-2 ${
                    selectedFolder === null ? 'bg-opacity-100' : ''
                  }`}
                  style={{
                    backgroundColor: selectedFolder === null
                      ? 'var(--conductor-button-primary-bg)'
                      : 'var(--conductor-button-secondary-bg)'
                  }}
                >
                  <FolderOpen size={20} />
                  <span>Root</span>
                </button>

                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full text-left p-3 hover:bg-opacity-50 flex items-center gap-2 ${
                      selectedFolder === folder.id ? 'bg-opacity-100' : ''
                    }`}
                    style={{
                      backgroundColor: selectedFolder === folder.id
                        ? 'var(--conductor-button-primary-bg)'
                        : 'var(--conductor-button-secondary-bg)',
                      paddingLeft: `${(folder.path.split('/').length * 1.5)}rem`
                    }}
                  >
                    <FolderOpen size={20} style={{ color: folder.color || 'var(--conductor-primary)' }} />
                    <span>{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm opacity-75">
              {operation === 'move' ? 'Moving' : 'Copying'} {fileCount} file{fileCount > 1 ? 's' : ''}
            </div>
          </div>
        )

      case 'share':
        return (
          <div className="space-y-4">
            <div>
              <Label>Share link expiry</Label>
              <select
                value={shareExpiry}
                onChange={(e) => setShareExpiry(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mt-2"
                style={{
                  borderColor: 'var(--conductor-button-secondary-border)',
                  backgroundColor: 'var(--conductor-bg)',
                  color: 'var(--conductor-body-color)'
                }}
              >
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="0">Never expires</option>
              </select>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}>
              <div className="flex items-start gap-2">
                <LinkIcon size={20} className="mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  A public share link will be generated for {fileCount} file{fileCount > 1 ? 's' : ''}.
                  Anyone with the link will be able to view and download.
                </div>
              </div>
            </div>

            {fileCount === 1 && files[0].is_shared && files[0].share_url && (
              <div>
                <Label>Current share link</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={files[0].share_url}
                    readOnly
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(files[0].share_url!)}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )

      case 'tag':
        return (
          <div className="space-y-4">
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="design, logo, brand, final"
                autoFocus
              />
              <div className="text-xs opacity-75 mt-1">
                Separate multiple tags with commas
              </div>
            </div>

            <div className="text-sm opacity-75">
              Tagging {fileCount} file{fileCount > 1 ? 's' : ''}
            </div>

            {tags && (
              <div>
                <Label>Preview</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.split(',').map((tag, index) => {
                    const trimmed = tag.trim()
                    return trimmed ? (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                      >
                        {trimmed}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
        )

      case 'delete':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border-2" style={{
              borderColor: 'var(--conductor-danger)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)'
            }}>
              <div className="text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <div className="font-semibold mb-2">
                  Are you sure you want to delete {fileCount} file{fileCount > 1 ? 's' : ''}?
                </div>
                <div className="text-sm opacity-75">
                  This action cannot be undone. The file{fileCount > 1 ? 's' : ''} will be permanently removed.
                </div>
              </div>
            </div>

            <div className="max-h-32 overflow-y-auto space-y-1">
              {files.map((file) => (
                <div key={file.id} className="text-sm opacity-75">
                  • {file.name}
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getTitle = () => {
    const fileCount = files.length
    switch (operation) {
      case 'rename':
        return 'Rename File'
      case 'move':
        return `Move ${fileCount} File${fileCount > 1 ? 's' : ''}`
      case 'copy':
        return `Copy ${fileCount} File${fileCount > 1 ? 's' : ''}`
      case 'share':
        return `Share ${fileCount} File${fileCount > 1 ? 's' : ''}`
      case 'tag':
        return `Tag ${fileCount} File${fileCount > 1 ? 's' : ''}`
      case 'delete':
        return `Delete ${fileCount} File${fileCount > 1 ? 's' : ''}`
      default:
        return ''
    }
  }

  const getConfirmButtonText = () => {
    switch (operation) {
      case 'rename':
        return 'Rename'
      case 'move':
        return 'Move'
      case 'copy':
        return 'Copy'
      case 'share':
        return 'Generate Link'
      case 'tag':
        return 'Apply Tags'
      case 'delete':
        return 'Delete'
      default:
        return 'Confirm'
    }
  }

  const isValid = () => {
    switch (operation) {
      case 'rename':
        return newName.trim() !== '' && newName !== files[0]?.name
      case 'move':
      case 'copy':
        return selectedFolder !== files[0]?.folder_id
      case 'share':
        return true
      case 'tag':
        return tags.trim() !== ''
      case 'delete':
        return true
      default:
        return false
    }
  }

  if (!operation) return null

  return (
    <Dialog isOpen={!!operation} onClose={onClose} maxWidth="500px">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-50 transition-colors"
            style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
          >
            <X size={20} />
          </button>
        </div>

        {renderContent()}

        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant={operation === 'delete' ? 'danger' : 'primary'}
            onClick={handleSubmit}
            disabled={!isValid() || isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : getConfirmButtonText()}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
