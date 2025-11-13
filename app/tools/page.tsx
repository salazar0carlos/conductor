'use client'

import Link from 'next/link'
import {
  Palette,
  Code2,
  Brain,
  ArrowRight
} from 'lucide-react'

const tools = [
  {
    title: 'AI Logo Maker',
    description: 'Create professional logos with DALL-E 3, Stable Diffusion XL, and Midjourney. Includes brand kit management and customization studio.',
    href: '/tools/logo-maker',
    icon: Palette,
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'API Playground',
    description: 'Test and document APIs with a full HTTP client. Generate code in 8 languages, manage environments, and create documentation.',
    href: '/api-playground',
    icon: Code2,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'AI Playground',
    description: 'Test and compare 20+ AI models from 16 providers. Configure settings, manage costs, and explore different AI capabilities.',
    href: '/tools/ai-playground',
    icon: Brain,
    color: 'from-orange-500 to-red-500'
  }
]

export default function ToolsPage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--conductor-background)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              color: 'var(--conductor-title-color)',
              fontFamily: 'var(--conductor-title-font)'
            }}
          >
            Developer Tools
          </h1>
          <p style={{ color: 'var(--conductor-muted-color)' }}>
            Powerful tools to build, test, and optimize your AI applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group block"
            >
              <div
                className="h-full p-6 rounded-lg border transition-all duration-200 hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--conductor-card-background)',
                  borderColor: 'var(--conductor-card-border)'
                }}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>

                <h3
                  className="text-xl font-semibold mb-2 flex items-center justify-between"
                  style={{ color: 'var(--conductor-title-color)' }}
                >
                  {tool.title}
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>

                <p
                  className="text-sm"
                  style={{ color: 'var(--conductor-muted-color)' }}
                >
                  {tool.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div
          className="mt-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--conductor-card-background)',
            borderColor: 'var(--conductor-card-border)'
          }}
        >
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--conductor-title-color)' }}
          >
            More Tools Coming Soon
          </h2>
          <p style={{ color: 'var(--conductor-muted-color)' }}>
            We're continuously adding new developer tools and AI capabilities. Check back regularly for updates.
          </p>
        </div>
      </div>
    </div>
  )
}
