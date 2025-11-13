'use client';

import React, { useState } from 'react';
import { X, Zap, MousePointer, Settings, Play, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
  onStartTutorial?: () => void;
  onBrowseTemplates?: () => void;
}

export function WelcomeModal({ onClose, onStartTutorial, onBrowseTemplates }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <Sparkles className="w-12 h-12 text-blue-600" />,
      title: 'Welcome to Workflow Builder',
      description: 'Create powerful automation workflows with a visual drag-and-drop interface.',
      details: [
        'Connect to APIs, databases, and external services',
        'Build complex logic with conditions and loops',
        'Transform and process data in real-time',
        'Schedule workflows or trigger them manually',
      ],
    },
    {
      icon: <MousePointer className="w-12 h-12 text-green-600" />,
      title: 'Drag and Drop Nodes',
      description: 'Build workflows by dragging nodes from the left sidebar onto the canvas.',
      details: [
        'Choose from 25+ pre-built node types',
        'Connect nodes by dragging from output to input handles',
        'Pan with Space + Drag, zoom with mouse wheel',
        'Select multiple nodes for bulk operations',
      ],
    },
    {
      icon: <Settings className="w-12 h-12 text-purple-600" />,
      title: 'Configure Nodes',
      description: 'Click any node to open the configuration panel and customize its behavior.',
      details: [
        'Switch between Form and JSON modes',
        'Use {{variables}} to reference other nodes',
        'Test individual nodes before running the full workflow',
        'Validate configurations in real-time',
      ],
    },
    {
      icon: <Play className="w-12 h-12 text-orange-600" />,
      title: 'Execute and Monitor',
      description: 'Run your workflow and watch real-time execution logs at the bottom.',
      details: [
        'See step-by-step execution progress',
        'View data flowing between nodes',
        'Debug errors with detailed logs',
        'Track execution time and success rates',
      ],
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6" />
              <h2 className="text-xl font-bold">Quick Start Guide</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
              {currentStepData.icon}
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
            {currentStepData.title}
          </h3>

          <p className="text-gray-600 text-center mb-6">{currentStepData.description}</p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <ul className="space-y-3">
              {currentStepData.details.map((detail, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Get Started
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onBrowseTemplates}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Browse Templates
            </button>
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
