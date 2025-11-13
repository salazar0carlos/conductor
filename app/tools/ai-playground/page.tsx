'use client'

/**
 * AI Playground
 * Test and compare different AI models side-by-side
 */

import { useState } from 'react'
import { ModelSelector } from '@/components/ai-providers/model-selector'
import type { AIModel, AIExecutionResponse } from '@/types'
import {
  Play,
  Copy,
  Clock,
  DollarSign,
  Zap,
  TrendingUp,
  Plus,
  X,
} from 'lucide-react'

interface ModelTest {
  id: string
  model: AIModel | null
  response: AIExecutionResponse | null
  loading: boolean
  error: string | null
}

export default function AIPlayground() {
  const [prompt, setPrompt] = useState('')
  const [tests, setTests] = useState<ModelTest[]>([
    { id: '1', model: null, response: null, loading: false, error: null },
  ])
  const [showModelSelector, setShowModelSelector] = useState<string | null>(
    null
  )
  const [parameters, setParameters] = useState({
    temperature: 0.7,
    max_tokens: 1000,
  })

  const addTest = () => {
    setTests([
      ...tests,
      {
        id: Date.now().toString(),
        model: null,
        response: null,
        loading: false,
        error: null,
      },
    ])
  }

  const removeTest = (id: string) => {
    setTests(tests.filter((t) => t.id !== id))
  }

  const selectModel = (testId: string, model: AIModel) => {
    setTests(
      tests.map((t) =>
        t.id === testId ? { ...t, model, response: null, error: null } : t
      )
    )
    setShowModelSelector(null)
  }

  const runTest = async (testId: string) => {
    const test = tests.find((t) => t.id === testId)
    if (!test || !test.model || !prompt) return

    // Update loading state
    setTests(
      tests.map((t) =>
        t.id === testId
          ? { ...t, loading: true, error: null, response: null }
          : t
      )
    )

    try {
      const response = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'playground_test',
          prompt,
          model_id: test.model.id,
          parameters,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setTests(
          tests.map((t) =>
            t.id === testId
              ? { ...t, loading: false, response: result.data }
              : t
          )
        )
      } else {
        setTests(
          tests.map((t) =>
            t.id === testId
              ? { ...t, loading: false, error: result.error || 'Failed' }
              : t
          )
        )
      }
    } catch (error) {
      setTests(
        tests.map((t) =>
          t.id === testId
            ? {
                ...t,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed',
              }
            : t
        )
      )
    }
  }

  const runAllTests = async () => {
    for (const test of tests) {
      if (test.model) {
        await runTest(test.id)
      }
    }
  }

  const copyResponse = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            AI Playground
          </h1>
          <p className="mt-2 text-gray-600">
            Test and compare AI models side-by-side
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Input
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {parameters.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={parameters.temperature}
                    onChange={(e) =>
                      setParameters({
                        ...parameters,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={parameters.max_tokens}
                    onChange={(e) =>
                      setParameters({
                        ...parameters,
                        max_tokens: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={runAllTests}
                  disabled={!prompt || tests.every((t) => !t.model)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Play className="w-5 h-5" />
                  Run All Tests
                </button>

                <button
                  onClick={addTest}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Model
                </button>
              </div>
            </div>

            {/* Saved Tests */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Saved Tests
              </h2>
              <p className="text-sm text-gray-500">
                Save your prompts and compare results over time
              </p>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-6">
              {tests.map((test, index) => (
                <div
                  key={test.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Test Header */}
                  <div className="bg-gray-50 border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">
                          Model {index + 1}
                        </span>
                        {test.model ? (
                          <button
                            onClick={() => setShowModelSelector(test.id)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            {test.model.display_name}
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowModelSelector(test.id)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                          >
                            Select Model
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {test.model && (
                          <button
                            onClick={() => runTest(test.id)}
                            disabled={!prompt || test.loading}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {tests.length > 1 && (
                          <button
                            onClick={() => removeTest(test.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Test Content */}
                  <div className="p-6">
                    {test.loading && (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                    )}

                    {test.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {test.error}
                      </div>
                    )}

                    {test.response && (
                      <div className="space-y-4">
                        {/* Response Text */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Response
                            </span>
                            <button
                              onClick={() => copyResponse(test.response!.content)}
                              className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {test.response.content}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-gray-500">Time</div>
                              <div className="font-medium text-gray-900">
                                {test.response.duration_ms}ms
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-gray-500">Tokens</div>
                              <div className="font-medium text-gray-900">
                                {test.response.usage.total_tokens}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-gray-500">Cost</div>
                              <div className="font-medium text-gray-900">
                                ${test.response.cost_usd.toFixed(4)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fallback indicator */}
                        {test.response.was_fallback && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                            This response used a fallback model
                          </div>
                        )}
                      </div>
                    )}

                    {!test.loading && !test.error && !test.response && (
                      <div className="text-center py-12 text-gray-500">
                        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>Run a test to see results</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Model Selector Modal */}
      {showModelSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Select Model
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ModelSelector
                onSelect={(model) => selectModel(showModelSelector, model)}
                category="text"
                showPricing={true}
                showPerformance={true}
              />
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModelSelector(null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
