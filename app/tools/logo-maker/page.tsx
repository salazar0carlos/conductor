'use client';

import { useState, useEffect } from 'react';
import { ModelSelector } from '@/components/logo-maker/model-selector';
import { PromptBuilder } from '@/components/logo-maker/prompt-builder';
import { LogoPreview } from '@/components/logo-maker/logo-preview';
import { CustomizationStudio } from '@/components/logo-maker/customization-studio';
import { BrandKit } from '@/components/logo-maker/brand-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ModelConfig,
  AILogoModel,
  GeneratedLogo,
  LogoGenerationRequest,
  LogoGenerationResponse
} from '@/lib/ai/logo-models';
import {
  Wand2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  DollarSign,
  Clock,
  Package,
  Key,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

type WizardStep = 'model' | 'prompt' | 'generate' | 'customize' | 'brand-kit';

export default function LogoMakerPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('model');
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<AILogoModel>('dalle-3');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(4);
  const [userApiKey, setUserApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [generatedLogos, setGeneratedLogos] = useState<GeneratedLogo[]>([]);
  const [savedLogos, setSavedLogos] = useState<GeneratedLogo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLogoForEdit, setSelectedLogoForEdit] = useState<GeneratedLogo | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [wizardMode, setWizardMode] = useState(true);

  // Load models on mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Update cost estimate
  useEffect(() => {
    const model = models.find(m => m.id === selectedModel);
    if (model) {
      setEstimatedCost(model.pricing.perImage * batchSize);
    }
  }, [selectedModel, batchSize, models]);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/ai/models');
      const data = await response.json();
      if (data.success) {
        setModels(data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error('Failed to load AI models');
    }
  };

  const generateLogos = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setCurrentStep('generate');

    try {
      const request: LogoGenerationRequest = {
        model: selectedModel,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        style: selectedStyle || undefined,
        colorScheme: selectedColors.length > 0 ? selectedColors : undefined,
        industry: selectedIndustry || undefined,
        batchSize,
        userApiKey: userApiKey || undefined
      };

      const response = await fetch('/api/ai/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data: LogoGenerationResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedLogos(data.images);
      toast.success(`Generated ${data.images.length} logo${data.images.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate logos');
      setCurrentStep('prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToBrandKit = (logo: GeneratedLogo) => {
    if (!savedLogos.find(l => l.id === logo.id)) {
      setSavedLogos([...savedLogos, logo]);
      toast.success('Logo saved to brand kit!');
    } else {
      toast.info('Logo already in brand kit');
    }
  };

  const handleRemoveFromBrandKit = (logoId: string) => {
    setSavedLogos(savedLogos.filter(l => l.id !== logoId));
    toast.success('Logo removed from brand kit');
  };

  const handleDownload = async (logo: GeneratedLogo) => {
    try {
      const link = document.createElement('a');
      link.href = logo.url;
      link.download = `logo-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Logo downloaded!');
    } catch (error) {
      toast.error('Failed to download logo');
    }
  };

  const steps = [
    { id: 'model', label: 'Select Model', icon: Sparkles },
    { id: 'prompt', label: 'Design Prompt', icon: Wand2 },
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'customize', label: 'Customize', icon: Package },
    { id: 'brand-kit', label: 'Brand Kit', icon: Package }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'model':
        return !!selectedModel;
      case 'prompt':
        return prompt.trim().length > 0;
      case 'generate':
        return generatedLogos.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep === 'model') {
      setCurrentStep('prompt');
    } else if (currentStep === 'prompt') {
      generateLogos();
    } else if (currentStep === 'generate') {
      setCurrentStep('brand-kit');
    }
  };

  const prevStep = () => {
    if (currentStep === 'prompt') {
      setCurrentStep('model');
    } else if (currentStep === 'generate') {
      setCurrentStep('prompt');
    } else if (currentStep === 'brand-kit') {
      setCurrentStep('generate');
    }
  };

  const selectedModelConfig = models.find(m => m.id === selectedModel);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Logo Maker</h1>
              <p className="text-neutral-400">
                Create professional logos with cutting-edge AI models
              </p>
            </div>
            <button
              onClick={() => setWizardMode(!wizardMode)}
              className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 transition-colors"
            >
              {wizardMode ? 'Free Mode' : 'Wizard Mode'}
            </button>
          </div>

          {wizardMode && (
            <div className="flex items-center justify-between bg-neutral-900 rounded-lg p-4 border border-neutral-800">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = idx < currentStepIndex;
                const isDisabled = idx > currentStepIndex + 1;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => !isDisabled && setCurrentStep(step.id as WizardStep)}
                      disabled={isDisabled}
                      className={`flex items-center gap-2 transition-colors ${
                        isActive
                          ? 'text-blue-400'
                          : isCompleted
                          ? 'text-green-400 hover:text-green-300'
                          : 'text-neutral-600'
                      } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          isActive
                            ? 'border-blue-400 bg-blue-900/20'
                            : isCompleted
                            ? 'border-green-400 bg-green-900/20'
                            : 'border-neutral-700 bg-neutral-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium hidden md:inline">
                        {step.label}
                      </span>
                    </button>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-400' : 'bg-neutral-800'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {(currentStep === 'model' || !wizardMode) && (
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
                <ModelSelector
                  models={models}
                  selectedModel={selectedModel}
                  onSelectModel={(id) => setSelectedModel(id as AILogoModel)}
                  showComparison={false}
                />
              </div>
            )}

            {(currentStep === 'prompt' || !wizardMode) && (
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
                <PromptBuilder
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={setNegativePrompt}
                  selectedStyle={selectedStyle}
                  onStyleChange={setSelectedStyle}
                  selectedIndustry={selectedIndustry}
                  onIndustryChange={setSelectedIndustry}
                  selectedColors={selectedColors}
                  onColorsChange={setSelectedColors}
                />
              </div>
            )}

            {(currentStep === 'generate' || !wizardMode) && (
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
                <LogoPreview
                  logos={generatedLogos}
                  isGenerating={isGenerating}
                  onDownload={handleDownload}
                  onSaveToBrandKit={handleSaveToBrandKit}
                />
              </div>
            )}

            {currentStep === 'brand-kit' && (
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
                <BrandKit
                  logos={savedLogos}
                  onRemoveLogo={handleRemoveFromBrandKit}
                  onGenerateAssets={(logo) => toast.info('Asset generation coming soon!')}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              <h3 className="font-semibold text-white mb-4">Generation Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Batch Size
                  </label>
                  <div className="flex gap-2">
                    {[1, 4, 8, 16].map((size) => (
                      <button
                        key={size}
                        onClick={() => setBatchSize(size)}
                        className={`flex-1 px-3 py-2 text-sm rounded border transition-all ${
                          batchSize === size
                            ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                            : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedModelConfig?.requiresApiKey && (
                  <div>
                    <button
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-2"
                    >
                      <Key className="w-4 h-4" />
                      {showApiKeyInput ? 'Hide' : 'Use Your Own'} API Key
                    </button>
                    {showApiKeyInput && (
                      <Input
                        type="password"
                        placeholder="Enter your API key"
                        value={userApiKey}
                        onChange={(e) => setUserApiKey(e.target.value)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cost Estimate */}
            {selectedModelConfig && (
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-white">Cost Estimate</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-400">
                    <span>Model:</span>
                    <span className="text-white">{selectedModelConfig.name}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Per image:</span>
                    <span className="text-white">${selectedModelConfig.pricing.perImage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Batch size:</span>
                    <span className="text-white">{batchSize} images</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Speed:</span>
                    <span className="text-white capitalize">{selectedModelConfig.speed}</span>
                  </div>
                  <div className="border-t border-blue-500/30 pt-2 mt-2 flex justify-between font-semibold">
                    <span className="text-white">Total:</span>
                    <span className="text-blue-400">${estimatedCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              <h3 className="font-semibold text-white mb-4">Session Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Generated:</span>
                  <span className="text-white font-medium">{generatedLogos.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Saved:</span>
                  <span className="text-white font-medium">{savedLogos.length}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {wizardMode && (
              <div className="flex gap-2">
                {currentStepIndex > 0 && (
                  <Button
                    onClick={prevStep}
                    variant="secondary"
                    className="flex-1 justify-center"
                    disabled={isGenerating}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                {currentStep !== 'brand-kit' && (
                  <Button
                    onClick={nextStep}
                    variant="primary"
                    className="flex-1 justify-center"
                    disabled={!canProceed() || isGenerating}
                  >
                    {currentStep === 'prompt' ? (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {!wizardMode && (
              <Button
                onClick={generateLogos}
                variant="primary"
                className="w-full justify-center"
                disabled={!canProceed() || isGenerating}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Logos'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Customization Studio Modal */}
      {selectedLogoForEdit && (
        <CustomizationStudio
          logo={selectedLogoForEdit}
          onClose={() => setSelectedLogoForEdit(null)}
          onSave={handleSaveToBrandKit}
        />
      )}
    </div>
  );
}
