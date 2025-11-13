'use client'

import { useState } from 'react'
import { TemplateCategory, TemplateType, PricingType, CreateTemplateInput } from '@/lib/marketplace/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Plus, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon } from 'lucide-react'

interface TemplateCreatorProps {
  categories: TemplateCategory[]
  sourceData?: Record<string, any> // The actual entity data to convert to template
  sourceType?: TemplateType
  onSuccess?: (templateId: string) => void
}

export function TemplateCreator({ categories, sourceData, sourceType, onSuccess }: TemplateCreatorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState<TemplateType>(sourceType || 'workflow')
  const [pricingType, setPricingType] = useState<PricingType>('free')
  const [price, setPrice] = useState(0)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [features, setFeatures] = useState<string[]>([''])
  const [tags, setTags] = useState<string[]>([''])
  const [installationInstructions, setInstallationInstructions] = useState('')
  const [license, setLicense] = useState('MIT')

  const steps = [
    { title: 'Basic Info', description: 'Name, description, and category' },
    { title: 'Media', description: 'Images, videos, and demos' },
    { title: 'Details', description: 'Features, tags, and instructions' },
    { title: 'Pricing', description: 'Set pricing and license' },
    { title: 'Review', description: 'Review and publish' }
  ]

  const typeOptions: { value: TemplateType; label: string }[] = [
    { value: 'workflow', label: 'Workflow' },
    { value: 'task', label: 'Task' },
    { value: 'agent', label: 'Agent' },
    { value: 'project', label: 'Project' },
    { value: 'design', label: 'Design' },
    { value: 'integration', label: 'Integration' }
  ]

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug) {
      setSlug(generateSlug(value))
    }
  }

  const addFeature = () => {
    setFeatures([...features, ''])
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const addTag = () => {
    setTags([...tags, ''])
  }

  const updateTag = (index: number, value: string) => {
    const newTags = [...tags]
    newTags[index] = value
    setTags(newTags)
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const addScreenshot = () => {
    const url = prompt('Enter screenshot URL:')
    if (url) {
      setScreenshots([...screenshots, url])
    }
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index))
  }

  const validateStep = (): boolean => {
    if (currentStep === 0) {
      return !!(name && slug && description && categoryId && type)
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) {
      alert('Please fill in all required fields')
      return
    }

    if (isLastStep) {
      handleSubmit()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const templateData: CreateTemplateInput = {
        name,
        description,
        long_description: longDescription || undefined,
        category_id: categoryId,
        type,
        pricing_type: pricingType,
        price: pricingType === 'paid' ? price : undefined,
        template_data: sourceData || {},
        features: features.filter(f => f.trim()),
        tags: tags.filter(t => t.trim()),
        installation_instructions: installationInstructions || undefined,
        thumbnail_url: thumbnailUrl || undefined,
        screenshots: screenshots.filter(s => s.trim()),
        video_url: videoUrl || undefined,
        demo_url: demoUrl || undefined
      }

      const response = await fetch('/api/marketplace/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      const result = await response.json()
      onSuccess?.(result.id)
    } catch (error) {
      console.error('Failed to create template:', error)
      alert('Failed to create template. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={index} className="flex-1">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index <= currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${
                      index < currentStep ? 'bg-blue-500' : 'bg-neutral-800'
                    }`}
                  />
                )}
              </div>
              <div className="mt-2">
                <div className="text-sm font-medium text-white">{step.title}</div>
                <div className="text-xs text-neutral-500">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="border border-neutral-800 rounded-lg p-6 mb-6">
        {/* Step 0: Basic Info */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Template Name <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., E-commerce Checkout Workflow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Slug <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e-commerce-checkout-workflow"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Used in URL: /marketplace/{slug || 'your-template'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Short Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description that will appear in search results and cards..."
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none resize-none"
              />
              <p className="text-xs text-neutral-500 mt-1">{description.length} / 200 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Long Description
              </label>
              <textarea
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                placeholder="A detailed description with markdown support..."
                rows={6}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:border-neutral-700 focus:outline-none cursor-pointer"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TemplateType)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:border-neutral-700 focus:outline-none cursor-pointer"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Media */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Thumbnail URL
              </label>
              <Input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/thumbnail.jpg"
              />
              {thumbnailUrl && (
                <div className="mt-2 w-full h-48 rounded-lg overflow-hidden bg-neutral-900">
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Screenshots
              </label>
              <div className="space-y-2">
                {screenshots.map((screenshot, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="url"
                      value={screenshot}
                      onChange={(e) => {
                        const newScreenshots = [...screenshots]
                        newScreenshots[index] = e.target.value
                        setScreenshots(newScreenshots)
                      }}
                      placeholder="https://example.com/screenshot.jpg"
                    />
                    <Button
                      onClick={() => removeScreenshot(index)}
                      variant="secondary"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addScreenshot} variant="secondary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Screenshot
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Video URL (YouTube/Vimeo)
              </label>
              <Input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Demo URL
              </label>
              <Input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://demo.example.com"
              />
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Key Features
              </label>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="e.g., Automatic payment processing"
                    />
                    <Button
                      onClick={() => removeFeature(index)}
                      variant="secondary"
                      size="sm"
                      disabled={features.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addFeature} variant="secondary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                {tags.map((tag, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="text"
                      value={tag}
                      onChange={(e) => updateTag(index, e.target.value)}
                      placeholder="e.g., ecommerce, payment, automation"
                    />
                    <Button
                      onClick={() => removeTag(index)}
                      variant="secondary"
                      size="sm"
                      disabled={tags.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addTag} variant="secondary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tag
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Installation Instructions
              </label>
              <textarea
                value={installationInstructions}
                onChange={(e) => setInstallationInstructions(e.target.value)}
                placeholder="Step-by-step installation guide..."
                rows={6}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Pricing Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(['free', 'freemium', 'paid'] as PricingType[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setPricingType(option)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      pricingType === option
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-sm font-medium text-white capitalize">{option}</div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {option === 'free' && 'Completely free'}
                      {option === 'freemium' && 'Free with premium features'}
                      {option === 'paid' && 'One-time payment'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {pricingType === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Price (USD)
                </label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="9.99"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                License
              </label>
              <select
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:border-neutral-700 focus:outline-none cursor-pointer"
              >
                <option value="MIT">MIT</option>
                <option value="Apache-2.0">Apache 2.0</option>
                <option value="GPL-3.0">GPL 3.0</option>
                <option value="BSD-3-Clause">BSD 3-Clause</option>
                <option value="Proprietary">Proprietary</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Review Your Template</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-neutral-900">
                  <div className="text-sm text-neutral-400 mb-1">Name</div>
                  <div className="text-white">{name}</div>
                </div>
                <div className="p-4 rounded-lg bg-neutral-900">
                  <div className="text-sm text-neutral-400 mb-1">Description</div>
                  <div className="text-white">{description}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-neutral-900">
                    <div className="text-sm text-neutral-400 mb-1">Type</div>
                    <div className="text-white capitalize">{type}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-neutral-900">
                    <div className="text-sm text-neutral-400 mb-1">Pricing</div>
                    <div className="text-white capitalize">
                      {pricingType === 'paid' ? `$${price}` : pricingType}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-neutral-900">
                  <div className="text-sm text-neutral-400 mb-1">Features ({features.filter(f => f.trim()).length})</div>
                  <div className="text-white text-sm">
                    {features.filter(f => f.trim()).join(', ') || 'None'}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-neutral-900">
                  <div className="text-sm text-neutral-400 mb-1">Tags ({tags.filter(t => t.trim()).length})</div>
                  <div className="text-white text-sm">
                    {tags.filter(t => t.trim()).join(', ') || 'None'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={handleBack}
          variant="secondary"
          disabled={isFirstStep || isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isSubmitting || !validateStep()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : isLastStep ? (
            'Create Template'
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
