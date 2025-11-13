'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Nav } from '@/components/ui/nav'
import { Button } from '@/components/ui/button'
import { TemplateInstaller } from '@/components/marketplace/template-installer'
import { ReviewSection } from '@/components/marketplace/review-section'
import { MarketplaceTemplate, TemplateReview } from '@/lib/marketplace/types'
import {
  ArrowLeft,
  Star,
  Download,
  Heart,
  Eye,
  ExternalLink,
  Share2,
  Flag,
  CheckCircle,
  Crown,
  Sparkles,
  Play,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function TemplateDetailsPage() {
  const params = useParams()
  const slug = params.slug as string

  const [template, setTemplate] = useState<MarketplaceTemplate | null>(null)
  const [reviews, setReviews] = useState<TemplateReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInstaller, setShowInstaller] = useState(false)
  const [currentScreenshot, setCurrentScreenshot] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    fetchTemplate()
    fetchReviews()
  }, [slug])

  const fetchTemplate = async () => {
    try {
      // First get template by slug
      const response = await fetch(`/api/marketplace/templates?search=${slug}&limit=1`)
      const data = await response.json()

      if (data.templates && data.templates.length > 0) {
        const template = data.templates[0]
        setTemplate(template)
        setIsFavorited(template.is_favorited || false)

        // Fetch full details
        const detailsResponse = await fetch(`/api/marketplace/templates/${template.id}`)
        const detailsData = await detailsResponse.json()
        setTemplate(detailsData)
        setIsFavorited(detailsData.is_favorited || false)
      }
    } catch (error) {
      console.error('Failed to fetch template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async () => {
    if (!template) return

    try {
      const response = await fetch(`/api/marketplace/reviews?template_id=${template.id}`)
      const data = await response.json()
      setReviews(data)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    }
  }

  const handleFavorite = async () => {
    if (!template) return

    try {
      const response = await fetch('/api/marketplace/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: template.id })
      })
      const data = await response.json()
      setIsFavorited(data.favorited)
      fetchTemplate() // Refresh to update favorite count
    } catch (error) {
      console.error('Failed to favorite template:', error)
    }
  }

  const handleSubmitReview = async (review: { rating: number; title?: string; content: string }) => {
    if (!template) return

    try {
      await fetch('/api/marketplace/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          ...review
        })
      })
      fetchReviews()
      fetchTemplate() // Refresh to update rating
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }

  const handleVoteReview = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    try {
      await fetch('/api/marketplace/reviews/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, vote_type: voteType })
      })
      fetchReviews() // Refresh to update vote counts
    } catch (error) {
      console.error('Failed to vote on review:', error)
    }
  }

  const nextScreenshot = () => {
    if (template && template.screenshots.length > 0) {
      setCurrentScreenshot((prev) => (prev + 1) % template.screenshots.length)
    }
  }

  const prevScreenshot = () => {
    if (template && template.screenshots.length > 0) {
      setCurrentScreenshot((prev) => (prev - 1 + template.screenshots.length) % template.screenshots.length)
    }
  }

  const shareTemplate = async () => {
    if (!template) return

    try {
      await navigator.share({
        title: template.name,
        text: template.description,
        url: window.location.href
      })
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Nav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-400">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Nav />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-2">Template not found</h2>
            <p className="text-neutral-400 mb-6">The template you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/marketplace">
              <Button>Browse Templates</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav />

      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-white">{template.name}</h1>
                    {template.is_featured && (
                      <Crown className="w-6 h-6 text-yellow-500" />
                    )}
                    {template.is_staff_pick && (
                      <Sparkles className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <p className="text-lg text-neutral-300">{template.description}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-white font-medium">{template.average_rating.toFixed(1)}</span>
                  <span className="text-neutral-400">({template.review_count} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-neutral-400">
                  <Download className="w-4 h-4" />
                  <span>{template.install_count.toLocaleString()} installs</span>
                </div>
                <div className="flex items-center gap-1 text-neutral-400">
                  <Eye className="w-4 h-4" />
                  <span>{template.view_count.toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-1 text-neutral-400">
                  <Heart className="w-4 h-4" />
                  <span>{template.favorite_count.toLocaleString()} favorites</span>
                </div>
              </div>
            </div>

            {/* Screenshots/Media */}
            {(template.screenshots.length > 0 || template.video_url) && (
              <div className="border border-neutral-800 rounded-lg overflow-hidden">
                {template.screenshots.length > 0 ? (
                  <div className="relative">
                    <div className="aspect-video bg-neutral-900">
                      <img
                        src={template.screenshots[currentScreenshot]}
                        alt={`Screenshot ${currentScreenshot + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {template.screenshots.length > 1 && (
                      <>
                        <button
                          onClick={prevScreenshot}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={nextScreenshot}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {template.screenshots.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentScreenshot(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentScreenshot ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : template.video_url ? (
                  <div className="aspect-video bg-neutral-900">
                    <iframe
                      src={template.video_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
              </div>
            )}

            {/* Description */}
            {template.long_description && (
              <div className="border border-neutral-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">About</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-neutral-300 whitespace-pre-wrap">{template.long_description}</p>
                </div>
              </div>
            )}

            {/* Features */}
            {template.features.length > 0 && (
              <div className="border border-neutral-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Key Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {template.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-neutral-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Installation Instructions */}
            {template.installation_instructions && (
              <div className="border border-neutral-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Installation Instructions</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-neutral-300 whitespace-pre-wrap">{template.installation_instructions}</p>
                </div>
              </div>
            )}

            {/* Reviews */}
            <ReviewSection
              templateId={template.id}
              reviews={reviews}
              averageRating={template.average_rating}
              totalReviews={template.review_count}
              canReview={!template.user_installation} // Can only review if not installed yet
              onSubmitReview={handleSubmitReview}
              onVoteReview={handleVoteReview}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Install Card */}
            <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/50 sticky top-4">
              <div className="mb-6">
                {template.pricing_type === 'free' ? (
                  <div className="text-3xl font-bold text-green-400">Free</div>
                ) : template.pricing_type === 'freemium' ? (
                  <div>
                    <div className="text-3xl font-bold text-white">Freemium</div>
                    <div className="text-sm text-neutral-400">Free with premium features</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold text-white">${template.price}</div>
                    <div className="text-sm text-neutral-400">One-time payment</div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setShowInstaller(true)}
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install Template
                </Button>

                {template.demo_url && (
                  <Button
                    onClick={() => window.open(template.demo_url, '_blank')}
                    variant="secondary"
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Try Demo
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleFavorite}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${
                        isFavorited ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </Button>
                  <Button
                    onClick={shareTemplate}
                    variant="secondary"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Author */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Author</h3>
              <div className="flex items-center gap-3">
                {template.author_avatar ? (
                  <img
                    src={template.author_avatar}
                    alt={template.author_name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 font-medium text-lg">
                    {template.author_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-white">{template.author_name}</div>
                  <div className="text-sm text-neutral-400">Template Creator</div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="border border-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-neutral-400">Category</div>
                  <div className="text-white">{template.category?.name}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Type</div>
                  <div className="text-white capitalize">{template.type}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Version</div>
                  <div className="text-white">{template.version}</div>
                </div>
                <div>
                  <div className="text-neutral-400">License</div>
                  <div className="text-white">{template.license}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Published</div>
                  <div className="text-white">
                    {template.published_at
                      ? formatDistanceToNow(new Date(template.published_at), { addSuffix: true })
                      : 'Draft'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div className="border border-neutral-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-lg text-sm bg-neutral-900 text-neutral-400 border border-neutral-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Installer Modal */}
      {showInstaller && (
        <TemplateInstaller
          template={template}
          isOpen={showInstaller}
          onClose={() => setShowInstaller(false)}
          onSuccess={() => {
            setShowInstaller(false)
            fetchTemplate() // Refresh to update install count
          }}
        />
      )}
    </div>
  )
}
