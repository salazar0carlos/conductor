'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { STYLE_PRESETS, INDUSTRY_TEMPLATES, COLOR_SCHEMES, PROMPT_SUGGESTIONS } from '@/lib/ai/logo-models';
import { Sparkles, Palette, Building2, Wand2, Plus, X } from 'lucide-react';

interface PromptBuilderProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  negativePrompt?: string;
  onNegativePromptChange?: (prompt: string) => void;
  selectedStyle?: string;
  onStyleChange?: (style: string) => void;
  selectedIndustry?: string;
  onIndustryChange?: (industry: string) => void;
  selectedColors?: string[];
  onColorsChange?: (colors: string[]) => void;
}

export function PromptBuilder({
  prompt,
  onPromptChange,
  negativePrompt = '',
  onNegativePromptChange,
  selectedStyle,
  onStyleChange,
  selectedIndustry,
  onIndustryChange,
  selectedColors = [],
  onColorsChange
}: PromptBuilderProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');

  const insertSuggestion = (text: string) => {
    const newPrompt = prompt ? `${prompt}, ${text}` : text;
    onPromptChange(newPrompt);
  };

  const applyTemplate = (industryId: string) => {
    const template = INDUSTRY_TEMPLATES.find(t => t.id === industryId);
    if (template) {
      onIndustryChange?.(industryId);
      onPromptChange(template.prompt);
    }
  };

  const toggleColor = (color: string) => {
    if (!onColorsChange) return;

    if (selectedColors.includes(color)) {
      onColorsChange(selectedColors.filter(c => c !== color));
    } else {
      onColorsChange([...selectedColors, color]);
    }
  };

  const addCustomColor = () => {
    if (!onColorsChange || selectedColors.includes(customColor)) return;
    onColorsChange([...selectedColors, customColor]);
  };

  return (
    <div className="space-y-6">
      {/* Main Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            Describe Your Logo
          </label>
          <span className="text-xs text-neutral-500">
            {prompt.length} characters
          </span>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g., Modern tech startup logo with abstract geometric shapes"
          className="min-h-[100px] resize-none"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Be specific about what you want. Include style, colors, shapes, and mood.
        </p>
      </div>

      {/* Quick Suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">Quick Additions</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-neutral-500 mb-1">Adjectives:</div>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.adjectives.slice(0, 8).map((adj) => (
                <button
                  key={adj}
                  onClick={() => insertSuggestion(adj)}
                  className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors"
                >
                  + {adj}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Elements:</div>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.elements.slice(0, 6).map((elem) => (
                <button
                  key={elem}
                  onClick={() => insertSuggestion(elem)}
                  className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors"
                >
                  + {elem}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Industry Templates */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Industry Templates</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {INDUSTRY_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template.id)}
              className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                selectedIndustry === template.id
                  ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                  : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Style Presets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Style Presets</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {STYLE_PRESETS.map((style) => (
            <button
              key={style.id}
              onClick={() => onStyleChange?.(style.id)}
              className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                selectedStyle === style.id
                  ? 'border-purple-500 bg-purple-900/20 text-purple-300'
                  : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              <div className="font-medium">{style.name}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Schemes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium text-white">Color Palette</span>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => onColorsChange?.(scheme.colors)}
                className={`p-2 rounded-lg border transition-all ${
                  JSON.stringify(selectedColors) === JSON.stringify(scheme.colors)
                    ? 'border-pink-500 bg-pink-900/20'
                    : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {scheme.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="h-6 flex-1 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="text-xs text-neutral-400">{scheme.name}</div>
              </button>
            ))}
          </div>

          {/* Custom Colors */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-12 h-10 rounded border border-neutral-700 bg-neutral-800 cursor-pointer"
            />
            <button
              onClick={addCustomColor}
              className="px-3 py-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Color
            </button>
            {selectedColors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedColors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleColor(color)}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <X className="w-3 h-3 text-neutral-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>

        {showAdvanced && onNegativePromptChange && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-white mb-2">
              Negative Prompt (What to Avoid)
            </label>
            <Textarea
              value={negativePrompt}
              onChange={(e) => onNegativePromptChange(e.target.value)}
              placeholder="e.g., photo, realistic, 3d, blurry, low quality"
              className="min-h-[80px] resize-none"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Specify elements you don&apos;t want in your logo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
