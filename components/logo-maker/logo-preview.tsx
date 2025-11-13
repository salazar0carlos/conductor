'use client';

import { useState } from 'react';
import { GeneratedLogo } from '@/lib/ai/logo-models';
import { Download, Heart, Share2, Eye, Grid, List, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogoPreviewProps {
  logos: GeneratedLogo[];
  isGenerating?: boolean;
  selectedLogos?: string[];
  onSelectLogo?: (logoId: string) => void;
  onDownload?: (logo: GeneratedLogo) => void;
  onSaveToBrandKit?: (logo: GeneratedLogo) => void;
}

export function LogoPreview({
  logos,
  isGenerating = false,
  selectedLogos = [],
  onSelectLogo,
  onDownload,
  onSaveToBrandKit
}: LogoPreviewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewLogo, setPreviewLogo] = useState<GeneratedLogo | null>(null);
  const [backgroundType, setBackgroundType] = useState<'white' | 'dark' | 'color'>('white');

  const backgrounds = {
    white: '#FFFFFF',
    dark: '#1A1A1A',
    color: '#667EEA'
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-neutral-900 rounded-lg border border-neutral-800">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Generating Your Logos</h3>
        <p className="text-sm text-neutral-400">This may take 10-30 seconds...</p>
        <div className="mt-4 flex gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (logos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-neutral-900 rounded-lg border border-neutral-800">
        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <Eye className="w-8 h-8 text-neutral-600" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Logos Yet</h3>
        <p className="text-sm text-neutral-400">
          Configure your settings and generate your first logo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Generated Logos</h3>
          <p className="text-sm text-neutral-400">{logos.length} variations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-400 hover:text-white'
              } transition-colors`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-400 hover:text-white'
              } transition-colors`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewLogo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewLogo(null)}
        >
          <div
            className="max-w-4xl w-full bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h4 className="font-semibold text-white">Logo Preview</h4>
              <button
                onClick={() => setPreviewLogo(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-8">
              <div className="flex gap-2 mb-4">
                {(['white', 'dark', 'color'] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setBackgroundType(bg)}
                    className={`px-3 py-1 text-xs rounded capitalize ${
                      backgroundType === bg
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
              <div
                className="rounded-lg p-12 flex items-center justify-center"
                style={{ backgroundColor: backgrounds[backgroundType] }}
              >
                <img
                  src={previewLogo.url}
                  alt="Logo preview"
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => onDownload?.(previewLogo)}
                  variant="primary"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => onSaveToBrandKit?.(previewLogo)}
                  variant="secondary"
                  className="flex-1"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Save to Brand Kit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className={`group relative bg-neutral-900 rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${
                selectedLogos.includes(logo.id)
                  ? 'border-blue-500'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Selection Checkbox */}
              {onSelectLogo && (
                <div className="absolute top-2 left-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLogo(logo.id);
                    }}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      selectedLogos.includes(logo.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-neutral-800/50 border-neutral-600 group-hover:border-neutral-500'
                    }`}
                  >
                    {selectedLogos.includes(logo.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
              )}

              {/* Logo Image */}
              <div
                className="aspect-square bg-white p-4 flex items-center justify-center"
                onClick={() => setPreviewLogo(logo)}
              >
                <img
                  src={logo.url}
                  alt={logo.prompt}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewLogo(logo);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                  title="Preview"
                >
                  <Eye className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload?.(logo);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveToBrandKit?.(logo);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
                  title="Save"
                >
                  <Heart className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Metadata */}
              <div className="p-2 bg-neutral-900 border-t border-neutral-800">
                <div className="text-xs text-neutral-500 truncate">
                  {logo.metadata.resolution}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className={`flex items-center gap-4 p-4 bg-neutral-900 rounded-lg border-2 transition-all ${
                selectedLogos.includes(logo.id)
                  ? 'border-blue-500'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {onSelectLogo && (
                <button
                  onClick={() => onSelectLogo(logo.id)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selectedLogos.includes(logo.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-neutral-800 border-neutral-600'
                  }`}
                >
                  {selectedLogos.includes(logo.id) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              )}

              <div className="w-16 h-16 bg-white rounded flex items-center justify-center flex-shrink-0">
                <img
                  src={logo.url}
                  alt={logo.prompt}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-neutral-400 truncate">
                  {logo.prompt}
                </div>
                <div className="flex gap-4 mt-1 text-xs text-neutral-500">
                  <span>{logo.metadata.resolution}</span>
                  <span>{logo.model}</span>
                  <span>{new Date(logo.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setPreviewLogo(logo)}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                >
                  <Eye className="w-4 h-4 text-neutral-400" />
                </button>
                <button
                  onClick={() => onDownload?.(logo)}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                >
                  <Download className="w-4 h-4 text-neutral-400" />
                </button>
                <button
                  onClick={() => onSaveToBrandKit?.(logo)}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                >
                  <Heart className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
