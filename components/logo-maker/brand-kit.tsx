'use client';

import { useState } from 'react';
import { GeneratedLogo } from '@/lib/ai/logo-models';
import {
  Palette,
  Download,
  FileText,
  Share2,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  Type,
  Mail,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrandKitProps {
  logos: GeneratedLogo[];
  onRemoveLogo?: (logoId: string) => void;
  onGenerateAssets?: (logo: GeneratedLogo) => void;
}

interface ColorPalette {
  name: string;
  colors: string[];
}

export function BrandKit({ logos, onRemoveLogo, onGenerateAssets }: BrandKitProps) {
  const [selectedLogo, setSelectedLogo] = useState<GeneratedLogo | null>(
    logos.length > 0 ? logos[0] : null
  );
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Extract color palette from selected logo
  const colorPalette: ColorPalette = {
    name: 'Logo Colors',
    colors: selectedLogo?.metadata.colorPalette || [
      '#667EEA',
      '#764BA2',
      '#F093FB',
      '#FFFFFF',
      '#000000'
    ]
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const assetTypes = [
    {
      id: 'favicon',
      name: 'Favicon',
      description: '16x16, 32x32, 64x64 ICO',
      icon: Globe
    },
    {
      id: 'social',
      name: 'Social Media',
      description: 'Twitter, Facebook, LinkedIn headers',
      icon: Share2
    },
    {
      id: 'email',
      name: 'Email Signature',
      description: 'Logo for email signatures',
      icon: Mail
    },
    {
      id: 'documents',
      name: 'Documents',
      description: 'Letterhead, business cards',
      icon: FileText
    }
  ];

  if (logos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-neutral-900 rounded-lg border border-neutral-800">
        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-neutral-600" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Saved Logos</h3>
        <p className="text-sm text-neutral-400">
          Generate and save logos to build your brand kit
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saved Logos */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Saved Logos</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className={`relative group cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                selectedLogo?.id === logo.id
                  ? 'border-blue-500'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
              onClick={() => setSelectedLogo(logo)}
            >
              <div className="aspect-square bg-white p-2 flex items-center justify-center">
                <img
                  src={logo.url}
                  alt="Saved logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              {onRemoveLogo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLogo(logo.id);
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedLogo && (
        <>
          {/* Color Palette */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Color Palette</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {colorPalette.colors.map((color, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden"
                >
                  <div
                    className="h-24 cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => copyToClipboard(color)}
                  />
                  <div className="p-2">
                    <button
                      onClick={() => copyToClipboard(color)}
                      className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                      <span className="font-mono">{color}</span>
                      {copiedColor === color ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography Suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Typography Suggestions</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Heading', font: 'Inter', weight: '700', sample: 'Your Brand Name' },
                { name: 'Subheading', font: 'Inter', weight: '600', sample: 'Tagline goes here' },
                { name: 'Body', font: 'Inter', weight: '400', sample: 'Lorem ipsum dolor sit amet' }
              ].map((typography, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-neutral-900 rounded-lg border border-neutral-800"
                >
                  <div className="text-xs text-neutral-500 mb-2">
                    {typography.name}
                  </div>
                  <div
                    className="text-white mb-2"
                    style={{
                      fontFamily: typography.font,
                      fontWeight: typography.weight,
                      fontSize: idx === 0 ? '1.5rem' : idx === 1 ? '1.125rem' : '1rem'
                    }}
                  >
                    {typography.sample}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {typography.font} • {typography.weight}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Assets Generator */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Generate Brand Assets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assetTypes.map((asset) => {
                const Icon = asset.icon;
                return (
                  <div
                    key={asset.id}
                    className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-neutral-800 rounded">
                        <Icon className="w-5 h-5 text-neutral-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{asset.name}</h4>
                        <p className="text-sm text-neutral-400 mb-3">
                          {asset.description}
                        </p>
                        <Button
                          onClick={() => onGenerateAssets?.(selectedLogo)}
                          variant="secondary"
                          size="sm"
                        >
                          <Download className="w-3 h-3 mr-2" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brand Guidelines */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Brand Guidelines</h3>
            <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-2">Logo Usage</h4>
                  <ul className="text-sm text-neutral-400 space-y-1">
                    <li>• Minimum size: 48px width</li>
                    <li>• Clear space: Equal to logo height</li>
                    <li>• Use on white or dark backgrounds</li>
                    <li>• Do not distort or rotate</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Color Usage</h4>
                  <ul className="text-sm text-neutral-400 space-y-1">
                    <li>• Primary colors for key elements</li>
                    <li>• Maintain color consistency</li>
                    <li>• Ensure WCAG AA contrast</li>
                    <li>• Use approved color combinations</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Complete Guidelines (PDF)
                </Button>
              </div>
            </div>
          </div>

          {/* Export All */}
          <div className="flex justify-center pt-4">
            <Button variant="primary" className="px-8">
              <Download className="w-4 h-4 mr-2" />
              Export Complete Brand Kit
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
