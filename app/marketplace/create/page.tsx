'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/ui/nav'
import { TemplateCreator } from '@/components/marketplace/template-creator'
import { TemplateCategory } from '@/lib/marketplace/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateTemplatePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<TemplateCategory[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/marketplace/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSuccess = (templateId: string) => {
    router.push(`/marketplace/my-templates`)
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Template</h1>
          <p className="text-neutral-400">
            Share your workflow, task, or agent configuration with the community
          </p>
        </div>

        <TemplateCreator
          categories={categories}
          onSuccess={handleSuccess}
        />
      </main>
    </div>
  )
}
