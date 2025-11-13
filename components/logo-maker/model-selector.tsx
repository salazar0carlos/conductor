'use client';

import { useState } from 'react';
import { ModelConfig } from '@/lib/ai/logo-models';
import { Check, Zap, DollarSign, Clock, Info } from 'lucide-react';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  showComparison?: boolean;
}

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  showComparison = false
}: ModelSelectorProps) {
  const [compareMode, setCompareMode] = useState(showComparison);

  const getSpeedIcon = (speed: string) => {
    const speedColors = {
      fast: 'text-green-400',
      medium: 'text-yellow-400',
      slow: 'text-orange-400'
    };
    return speedColors[speed as keyof typeof speedColors] || 'text-gray-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Select AI Model</h3>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {compareMode ? 'List View' : 'Compare Models'}
        </button>
      </div>

      {compareMode ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-4 text-neutral-400 font-medium">Model</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium">Speed</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium">Cost</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium">Best For</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr
                  key={model.id}
                  className={`border-b border-neutral-800 hover:bg-neutral-800/50 cursor-pointer transition-colors ${
                    selectedModel === model.id ? 'bg-blue-900/20' : ''
                  }`}
                  onClick={() => onSelectModel(model.id)}
                >
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-white">{model.name}</div>
                      <div className="text-xs text-neutral-500">{model.provider}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${getSpeedIcon(model.speed)}`} />
                      <span className="capitalize text-neutral-300">{model.speed}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-neutral-300">
                      <DollarSign className="w-4 h-4" />
                      {model.pricing.perImage.toFixed(2)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{model.strengths[0]}</td>
                  <td className="py-3 px-4">
                    {selectedModel === model.id && (
                      <Check className="w-5 h-5 text-green-400" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selectedModel === model.id
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white mb-1">{model.name}</h4>
                  <p className="text-xs text-neutral-500">{model.provider}</p>
                </div>
                {selectedModel === model.id && (
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                )}
              </div>

              <p className="text-sm text-neutral-400 mb-3">{model.description}</p>

              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className={`w-3 h-3 ${getSpeedIcon(model.speed)}`} />
                  <span className="capitalize">{model.speed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>${model.pricing.perImage.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>{model.maxResolution}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-neutral-500 font-medium">Strengths:</div>
                <div className="flex flex-wrap gap-1">
                  {model.strengths.slice(0, 3).map((strength, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-1 text-xs bg-neutral-700 text-neutral-300 rounded"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              {model.requiresApiKey && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                  <Info className="w-3 h-3" />
                  <span>Requires API key</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedModel && (
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">
                Selected: {models.find(m => m.id === selectedModel)?.name}
              </p>
              <p className="text-blue-200/70">
                {models.find(m => m.id === selectedModel)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
