'use client';

import { useState } from 'react';
import { GeneratedLogo } from '@/lib/ai/logo-models';
import {
  Download,
  Image as ImageIcon,
  Palette,
  Maximize2,
  FileText,
  RefreshCw,
  Smartphone,
  Monitor,
  Shirt,
  Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomizationStudioProps {
  logo: GeneratedLogo;
  onClose: () => void;
  onSave?: (logo: GeneratedLogo) => void;
}

export function CustomizationStudio({ logo, onClose, onSave }: CustomizationStudioProps) {
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [logoSize, setLogoSize] = useState(100);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'pdf' | 'ico'>('png');
  const [mockupType, setMockupType] = useState<'none' | 'phone' | 'desktop' | 'shirt' | 'mug'>('none');

  const exportFormats = [
    { id: 'png', name: 'PNG', description: 'Raster image' },
    { id: 'svg', name: 'SVG', description: 'Vector (scalable)' },
    { id: 'pdf', name: 'PDF', description: 'Print-ready' },
    { id: 'ico', name: 'ICO', description: 'Favicon' }
  ] as const;

  const mockupTypes = [
    { id: 'none', name: 'No Mockup', icon: ImageIcon },
    { id: 'phone', name: 'Mobile', icon: Smartphone },
    { id: 'desktop', name: 'Desktop', icon: Monitor },
    { id: 'shirt', name: 'T-Shirt', icon: Shirt },
    { id: 'mug', name: 'Mug', icon: Coffee }
  ] as const;

  const backgroundPresets = [
    { name: 'White', color: '#FFFFFF' },
    { name: 'Light Gray', color: '#F5F5F5' },
    { name: 'Dark', color: '#1A1A1A' },
    { name: 'Black', color: '#000000' },
    { name: 'Blue', color: '#667EEA' },
    { name: 'Green', color: '#48BB78' },
    { name: 'Purple', color: '#9F7AEA' },
    { name: 'Transparent', color: 'transparent' }
  ];

  const handleDownload = async () => {
    // In production, this would call an API to generate the proper format
    const link = document.createElement('a');
    link.href = logo.url;
    link.download = `logo-${Date.now()}.${exportFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateVariation = () => {
    // In production, this would call the API to generate a color variation
    alert('Color variation generation would happen here');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="max-w-7xl w-full h-[90vh] bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">Customization Studio</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xl px-2"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-auto">
            {mockupType === 'none' ? (
              <div
                className="rounded-lg flex items-center justify-center transition-all"
                style={{
                  backgroundColor: backgroundColor === 'transparent' ? '#F5F5F5' : backgroundColor,
                  backgroundImage: backgroundColor === 'transparent'
                    ? 'repeating-conic-gradient(#E5E5E5 0% 25%, transparent 0% 50%) 50% / 20px 20px'
                    : 'none',
                  width: `${logoSize}%`,
                  aspectRatio: '1'
                }}
              >
                <img
                  src={logo.url}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain p-8"
                />
              </div>
            ) : (
              <div className="relative">
                {/* Mockup templates would be rendered here */}
                <div className="bg-neutral-800 rounded-lg p-8 border border-neutral-700">
                  <div className="text-center text-neutral-400 mb-4">
                    {mockupTypes.find(m => m.id === mockupType)?.name} Mockup
                  </div>
                  <div
                    className="bg-white rounded p-4 flex items-center justify-center"
                    style={{ width: '300px', height: '300px' }}
                  >
                    <img
                      src={logo.url}
                      alt="Logo mockup"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Size Info */}
            <div className="mt-6 flex gap-4 text-sm text-neutral-400">
              <span>Resolution: {logo.metadata.resolution}</span>
              <span>Format: {exportFormat.toUpperCase()}</span>
              <span>Size: {logoSize}%</span>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-80 border-l border-neutral-800 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Background */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <h4 className="font-semibold text-white">Background</h4>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {backgroundPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setBackgroundColor(preset.color)}
                      className={`h-10 rounded border-2 transition-all ${
                        backgroundColor === preset.color
                          ? 'border-purple-500 scale-105'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                      style={{
                        backgroundColor: preset.color === 'transparent' ? '#F5F5F5' : preset.color,
                        backgroundImage: preset.color === 'transparent'
                          ? 'repeating-conic-gradient(#E5E5E5 0% 25%, transparent 0% 50%) 50% / 10px 10px'
                          : 'none'
                      }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor === 'transparent' ? '#FFFFFF' : backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-10 rounded border border-neutral-700 bg-neutral-800 cursor-pointer"
                  />
                </div>
              </div>

              {/* Size */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Maximize2 className="w-4 h-4 text-blue-400" />
                  <h4 className="font-semibold text-white">Size</h4>
                </div>
                <input
                  type="range"
                  min="25"
                  max="100"
                  value={logoSize}
                  onChange={(e) => setLogoSize(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-neutral-400 mt-2">
                  {logoSize}%
                </div>
              </div>

              {/* Export Format */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-green-400" />
                  <h4 className="font-semibold text-white">Export Format</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {exportFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setExportFormat(format.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        exportFormat === format.id
                          ? 'border-green-500 bg-green-900/20'
                          : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                      }`}
                    >
                      <div className="font-medium text-white text-sm">{format.name}</div>
                      <div className="text-xs text-neutral-500">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mockups */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-4 h-4 text-pink-400" />
                  <h4 className="font-semibold text-white">Mockups</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {mockupTypes.map((mockup) => {
                    const Icon = mockup.icon;
                    return (
                      <button
                        key={mockup.id}
                        onClick={() => setMockupType(mockup.id)}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          mockupType === mockup.id
                            ? 'border-pink-500 bg-pink-900/20'
                            : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                        }`}
                      >
                        <Icon className="w-5 h-5 text-neutral-400" />
                        <span className="text-xs text-neutral-400">{mockup.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Variations */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-4 h-4 text-yellow-400" />
                  <h4 className="font-semibold text-white">Variations</h4>
                </div>
                <button
                  onClick={generateVariation}
                  className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 transition-colors text-sm"
                >
                  Generate Color Variation
                </button>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-neutral-800">
                <Button
                  onClick={handleDownload}
                  variant="primary"
                  className="w-full justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {exportFormat.toUpperCase()}
                </Button>
                {onSave && (
                  <Button
                    onClick={() => onSave(logo)}
                    variant="secondary"
                    className="w-full justify-center"
                  >
                    Save to Brand Kit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
