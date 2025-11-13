'use client'

import { useState } from 'react'
import { AssetCollection, AssetItem } from '@/types/file-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/modal'
import {
  Palette,
  Image as ImageIcon,
  Type,
  Sparkles,
  Plus,
  Copy,
  Trash2,
  Edit2,
  X,
  Download
} from 'lucide-react'

interface AssetLibraryProps {
  collections: AssetCollection[]
  onCreateCollection: (type: AssetCollection['type'], name: string) => Promise<void>
  onAddAsset: (collectionId: string, asset: Partial<AssetItem>) => Promise<void>
  onDeleteAsset: (collectionId: string, assetId: string) => Promise<void>
  onDeleteCollection: (collectionId: string) => Promise<void>
}

export function AssetLibrary({
  collections,
  onCreateCollection,
  onAddAsset,
  onDeleteAsset,
  onDeleteCollection
}: AssetLibraryProps) {
  const [activeTab, setActiveTab] = useState<AssetCollection['type']>('colors')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAddAssetDialog, setShowAddAssetDialog] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetValue, setNewAssetValue] = useState('')

  const filteredCollections = collections.filter(c => c.type === activeTab)

  const getIcon = (type: AssetCollection['type']) => {
    switch (type) {
      case 'colors':
        return <Palette size={20} />
      case 'icons':
        return <Sparkles size={20} />
      case 'images':
        return <ImageIcon size={20} />
      case 'fonts':
        return <Type size={20} />
      case 'logos':
        return <ImageIcon size={20} />
      case 'brand':
        return <Sparkles size={20} />
    }
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return
    await onCreateCollection(activeTab, newCollectionName)
    setNewCollectionName('')
    setShowCreateDialog(false)
  }

  const handleAddAsset = async () => {
    if (!selectedCollection || !newAssetName.trim() || !newAssetValue.trim()) return

    await onAddAsset(selectedCollection, {
      name: newAssetName,
      value: newAssetValue,
      type: activeTab,
      metadata: {}
    })

    setNewAssetName('')
    setNewAssetValue('')
    setShowAddAssetDialog(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const renderAssetItem = (asset: AssetItem, collectionId: string) => {
    switch (activeTab) {
      case 'colors':
        return (
          <div
            className="group relative rounded-lg overflow-hidden border-2 hover:scale-105 transition-transform cursor-pointer"
            style={{ borderColor: 'var(--conductor-button-secondary-border)' }}
          >
            <div
              className="aspect-square"
              style={{ backgroundColor: asset.value }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => copyToClipboard(asset.value)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              >
                <Copy size={16} className="text-white" />
              </button>
              <button
                onClick={() => onDeleteAsset(collectionId, asset.id)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
            <div className="p-2 text-center">
              <div className="font-medium text-sm truncate">{asset.name}</div>
              <div className="text-xs opacity-75 font-mono">{asset.value}</div>
            </div>
          </div>
        )

      case 'icons':
      case 'logos':
      case 'images':
        return (
          <div
            className="group relative rounded-lg overflow-hidden border-2 hover:scale-105 transition-transform cursor-pointer"
            style={{ borderColor: 'var(--conductor-button-secondary-border)' }}
          >
            <div className="aspect-square bg-gray-100 flex items-center justify-center p-4">
              {asset.preview_url ? (
                <img
                  src={asset.preview_url}
                  alt={asset.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <ImageIcon size={48} className="opacity-25" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => copyToClipboard(asset.value)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              >
                <Copy size={16} className="text-white" />
              </button>
              <button
                onClick={() => window.open(asset.value, '_blank')}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              >
                <Download size={16} className="text-white" />
              </button>
              <button
                onClick={() => onDeleteAsset(collectionId, asset.id)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
            <div className="p-2 text-center">
              <div className="font-medium text-sm truncate">{asset.name}</div>
            </div>
          </div>
        )

      case 'fonts':
        return (
          <div
            className="group relative rounded-lg overflow-hidden border-2 hover:scale-105 transition-transform cursor-pointer p-4"
            style={{ borderColor: 'var(--conductor-button-secondary-border)' }}
          >
            <div
              className="text-2xl mb-2"
              style={{ fontFamily: asset.value }}
            >
              The quick brown fox
            </div>
            <div className="text-sm font-medium mb-1">{asset.name}</div>
            <div className="text-xs opacity-75 font-mono">{asset.value}</div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => copyToClipboard(asset.value)}
                className="p-2 bg-black/10 rounded-lg hover:bg-black/20"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => onDeleteAsset(collectionId, asset.id)}
                className="p-2 bg-black/10 rounded-lg hover:bg-black/20"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )

      case 'brand':
        return (
          <div
            className="group relative rounded-lg overflow-hidden border-2 hover:scale-105 transition-transform cursor-pointer p-4"
            style={{ borderColor: 'var(--conductor-button-secondary-border)' }}
          >
            <div className="font-medium mb-2">{asset.name}</div>
            <div className="text-sm opacity-75 mb-2">{asset.value}</div>
            {asset.preview_url && (
              <img
                src={asset.preview_url}
                alt={asset.name}
                className="w-full h-32 object-cover rounded"
              />
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => copyToClipboard(asset.value)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => onDeleteAsset(collectionId, asset.id)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="border-b flex items-center justify-between p-4">
        <div className="flex gap-1">
          {(['colors', 'icons', 'images', 'fonts', 'logos', 'brand'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === type ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                backgroundColor: activeTab === type
                  ? 'var(--conductor-button-primary-bg)'
                  : 'var(--conductor-button-secondary-bg)'
              }}
            >
              {getIcon(type)}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus size={16} />
          New Collection
        </Button>
      </div>

      {/* Collections */}
      <div className="flex-1 overflow-auto p-6">
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{getIcon(activeTab)}</div>
            <div className="text-xl font-semibold mb-2">No {activeTab} collections yet</div>
            <div className="text-sm opacity-75 mb-4">Create a collection to organize your {activeTab}</div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={16} />
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCollections.map((collection) => (
              <div key={collection.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm opacity-75">{collection.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCollection(collection.id)
                        setShowAddAssetDialog(true)
                      }}
                    >
                      <Plus size={14} />
                      Add
                    </Button>
                    <button
                      onClick={() => onDeleteCollection(collection.id)}
                      className="p-2 rounded-lg hover:bg-opacity-50"
                      style={{ backgroundColor: 'var(--conductor-button-secondary-bg)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {collection.items.map((asset) => (
                    <div key={asset.id}>
                      {renderAssetItem(asset, collection.id)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Collection Dialog */}
      <Dialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="400px"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Create {activeTab} Collection</h2>
          <Input
            placeholder="Collection name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateCollection()}
            autoFocus
          />
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add Asset Dialog */}
      <Dialog
        isOpen={showAddAssetDialog}
        onClose={() => setShowAddAssetDialog(false)}
        maxWidth="400px"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Add {activeTab} Asset</h2>
          <div className="space-y-3">
            <Input
              placeholder="Asset name"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
            />
            {activeTab === 'colors' ? (
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newAssetValue}
                  onChange={(e) => setNewAssetValue(e.target.value)}
                  className="w-16 h-10 rounded border"
                />
                <Input
                  placeholder="#000000"
                  value={newAssetValue}
                  onChange={(e) => setNewAssetValue(e.target.value)}
                  className="flex-1"
                />
              </div>
            ) : activeTab === 'fonts' ? (
              <Input
                placeholder="Font family name"
                value={newAssetValue}
                onChange={(e) => setNewAssetValue(e.target.value)}
              />
            ) : (
              <Input
                placeholder="URL or path"
                value={newAssetValue}
                onChange={(e) => setNewAssetValue(e.target.value)}
              />
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddAssetDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAsset}
              disabled={!newAssetName.trim() || !newAssetValue.trim()}
              className="flex-1"
            >
              Add
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
