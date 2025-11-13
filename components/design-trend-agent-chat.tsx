'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Bot, Send, Loader2, X, Maximize2, Minimize2 } from 'lucide-react'
import type { DesignTemplate } from '@/lib/design-system'

interface Message {
  role: 'user' | 'agent'
  content: string
  modifications?: any
  timestamp: Date
}

interface DesignTrendAgentChatProps {
  templateId?: string
  currentTemplate?: Partial<DesignTemplate>
  onApplyModifications?: (modifications: any) => void
}

export function DesignTrendAgentChat({
  templateId,
  currentTemplate,
  onApplyModifications,
}: DesignTrendAgentChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content:
        "Hi! I'm your Design Trend Agent. I can help you customize templates with modern design trends. Try asking me to: \n\n• Make buttons more rounded\n• Suggest a modern color palette\n• Use a bold font for headings\n• Add more spacing\n• Create a glassmorphic effect",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/design-trend-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          templateId,
          currentTemplate,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const agentMessage: Message = {
          role: 'agent',
          content: data.data.response,
          modifications: data.data.modifications,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, agentMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleApplyModifications = (modifications: any) => {
    if (onApplyModifications) {
      onApplyModifications(modifications)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{
          backgroundColor: 'var(--conductor-primary)',
          color: 'var(--conductor-button-primary-text)',
        }}
        aria-label="Open Design Trend Agent"
      >
        <Bot className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div
      className={`fixed ${
        isExpanded
          ? 'inset-4'
          : 'bottom-6 right-6 w-96'
      } bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl flex flex-col transition-all z-50`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--conductor-primary)' }}
          >
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Design Trend Agent</h3>
            <p className="text-xs text-neutral-500">AI Design Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'agent' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--conductor-primary)' }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-800/50 text-neutral-300'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.modifications && (
                <div className="mt-3 pt-3 border-t border-neutral-700">
                  <Button
                    size="sm"
                    onClick={() => handleApplyModifications(message.modifications)}
                    className="w-full"
                  >
                    Apply Changes
                  </Button>
                </div>
              )}
              <p className="text-xs text-neutral-500 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--conductor-primary)' }}
            >
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me to customize your design..."
            className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
