'use client'

import { useState } from 'react'
import { MarketplaceTemplate, ConfigStep, InstallationResult } from '@/lib/marketplace/types'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

interface TemplateInstallerProps {
  template: MarketplaceTemplate
  isOpen: boolean
  onClose: () => void
  onSuccess?: (result: InstallationResult) => void
}

export function TemplateInstaller({ template, isOpen, onClose, onSuccess }: TemplateInstallerProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [configuration, setConfiguration] = useState<Record<string, any>>({})
  const [isInstalling, setIsInstalling] = useState(false)
  const [installResult, setInstallResult] = useState<InstallationResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const configSchema = template.config_schema as { steps: ConfigStep[] } | undefined
  const steps = configSchema?.steps || []
  const hasSteps = steps.length > 0

  const currentStepData = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const handleFieldChange = (fieldName: string, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      [fieldName]: value
    }))
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const validateCurrentStep = (): boolean => {
    if (!currentStepData) return true

    const newErrors: Record<string, string> = {}

    currentStepData.fields.forEach(field => {
      const value = configuration[field.name]

      // Required field validation
      if (field.required && (!value || value === '')) {
        newErrors[field.name] = `${field.label} is required`
        return
      }

      // Type-specific validation
      if (value && field.validation) {
        const { min, max, pattern, message } = field.validation

        if (field.type === 'number') {
          const numValue = Number(value)
          if (min !== undefined && numValue < min) {
            newErrors[field.name] = message || `Value must be at least ${min}`
          }
          if (max !== undefined && numValue > max) {
            newErrors[field.name] = message || `Value must be at most ${max}`
          }
        }

        if (field.type === 'text' && pattern) {
          const regex = new RegExp(pattern)
          if (!regex.test(value)) {
            newErrors[field.name] = message || 'Invalid format'
          }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return

    if (isLastStep) {
      handleInstall()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const response = await fetch('/api/marketplace/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          configuration
        })
      })

      if (!response.ok) {
        throw new Error('Installation failed')
      }

      const result: InstallationResult = await response.json()
      setInstallResult(result)
      onSuccess?.(result)
    } catch (error) {
      setInstallResult({
        installation: null as any,
        success: false,
        message: error instanceof Error ? error.message : 'Installation failed'
      })
    } finally {
      setIsInstalling(false)
    }
  }

  const handleQuickInstall = async () => {
    setIsInstalling(true)
    try {
      const response = await fetch('/api/marketplace/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          configuration: {}
        })
      })

      if (!response.ok) {
        throw new Error('Installation failed')
      }

      const result: InstallationResult = await response.json()
      setInstallResult(result)
      onSuccess?.(result)
    } catch (error) {
      setInstallResult({
        installation: null as any,
        success: false,
        message: error instanceof Error ? error.message : 'Installation failed'
      })
    } finally {
      setIsInstalling(false)
    }
  }

  const resetInstaller = () => {
    setCurrentStep(0)
    setConfiguration({})
    setInstallResult(null)
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={resetInstaller}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Install {template.name}</h2>
        <div className="space-y-6">
        {!installResult ? (
          <>
            {hasSteps ? (
              <>
                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-400">
                      Step {currentStep + 1} of {steps.length}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {Math.round(((currentStep + 1) / steps.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Current Step */}
                {currentStepData && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {currentStepData.title}
                    </h3>
                    {currentStepData.description && (
                      <p className="text-sm text-neutral-400 mb-4">
                        {currentStepData.description}
                      </p>
                    )}

                    {/* Fields */}
                    <div className="space-y-4">
                      {currentStepData.fields.map(field => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </label>

                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={configuration[field.name] || ''}
                              onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none"
                            />
                          )}

                          {field.type === 'number' && (
                            <input
                              type="number"
                              value={configuration[field.name] || field.default || ''}
                              onChange={(e) => handleFieldChange(field.name, Number(e.target.value))}
                              placeholder={field.placeholder}
                              min={field.validation?.min}
                              max={field.validation?.max}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none"
                            />
                          )}

                          {field.type === 'boolean' && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={configuration[field.name] || field.default || false}
                                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 text-blue-500 focus:ring-blue-500"
                              />
                              <span className="text-sm text-neutral-400">{field.help_text}</span>
                            </label>
                          )}

                          {field.type === 'select' && (
                            <select
                              value={configuration[field.name] || field.default || ''}
                              onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:border-neutral-700 focus:outline-none cursor-pointer"
                            >
                              <option value="">Select an option</option>
                              {field.options?.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {field.type === 'textarea' && (
                            <textarea
                              value={configuration[field.name] || ''}
                              onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              placeholder={field.placeholder}
                              rows={4}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none resize-none"
                            />
                          )}

                          {field.help_text && field.type !== 'boolean' && (
                            <p className="text-xs text-neutral-500 mt-1">{field.help_text}</p>
                          )}

                          {errors[field.name] && (
                            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors[field.name]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t border-neutral-800">
                  <Button
                    onClick={handleBack}
                    variant="secondary"
                    disabled={isFirstStep || isInstalling}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={isInstalling}
                  >
                    {isInstalling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Installing...
                      </>
                    ) : isLastStep ? (
                      'Install'
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              // Quick Install (no configuration needed)
              <div>
                <p className="text-neutral-300 mb-6">
                  This template will be installed with default settings. You can customize it after installation.
                </p>

                {template.installation_instructions && (
                  <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <h4 className="text-sm font-medium text-blue-400 mb-2">Installation Notes</h4>
                    <p className="text-sm text-neutral-300">{template.installation_instructions}</p>
                  </div>
                )}

                <Button
                  onClick={handleQuickInstall}
                  disabled={isInstalling}
                  className="w-full"
                >
                  {isInstalling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    'Install Now'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          // Installation Result
          <div className="text-center py-6">
            {installResult.success ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Installation Successful!
                </h3>
                <p className="text-neutral-400 mb-6">
                  {installResult.message || `${template.name} has been installed successfully.`}
                </p>
                {installResult.entity_id && (
                  <p className="text-sm text-neutral-500 mb-6">
                    Created {installResult.entity_type}: {installResult.entity_id}
                  </p>
                )}
                <Button onClick={resetInstaller}>Done</Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Installation Failed
                </h3>
                <p className="text-neutral-400 mb-6">
                  {installResult.message || 'An error occurred during installation.'}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setInstallResult(null)}>Try Again</Button>
                  <Button onClick={resetInstaller} variant="secondary">Cancel</Button>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </Modal>
  )
}
