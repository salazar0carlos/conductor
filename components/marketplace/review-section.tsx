'use client'

import { useState } from 'react'
import { TemplateReview } from '@/lib/marketplace/types'
import { Button } from '@/components/ui/button'
import { Star, ThumbsUp, ThumbsDown, Flag, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ReviewSectionProps {
  templateId: string
  reviews: TemplateReview[]
  averageRating: number
  totalReviews: number
  canReview?: boolean
  onSubmitReview?: (review: { rating: number; title?: string; content: string }) => Promise<void>
  onVoteReview?: (reviewId: string, voteType: 'helpful' | 'not_helpful') => Promise<void>
  onReportReview?: (reviewId: string, reason: string) => Promise<void>
}

export function ReviewSection({
  templateId,
  reviews,
  averageRating,
  totalReviews,
  canReview = true,
  onSubmitReview,
  onVoteReview,
  onReportReview
}: ReviewSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent')

  // Calculate rating distribution
  const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
    const starCount = 5 - i
    const count = reviews.filter(r => r.rating === starCount).length
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
    return { stars: starCount, count, percentage }
  })

  const handleSubmitReview = async () => {
    if (!content.trim() || !onSubmitReview) return

    setIsSubmitting(true)
    try {
      await onSubmitReview({ rating, title: title || undefined, content })
      setShowReviewForm(false)
      setRating(5)
      setTitle('')
      setContent('')
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === 'helpful') {
      return b.helpful_count - a.helpful_count
    } else {
      return b.rating - a.rating
    }
  })

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <div className="border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Reviews & Ratings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-5xl font-bold text-white mb-2">{averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.floor(averageRating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : i < averageRating
                      ? 'fill-yellow-500/50 text-yellow-500'
                      : 'text-neutral-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-neutral-400">Based on {totalReviews} reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm text-neutral-400">{stars}</span>
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                </div>
                <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-neutral-400 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        {canReview && !showReviewForm && (
          <div className="mt-6 pt-6 border-t border-neutral-800">
            <Button onClick={() => setShowReviewForm(true)} className="w-full">
              Write a Review
            </Button>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-900/50">
          <h4 className="text-lg font-semibold text-white mb-4">Write Your Review</h4>

          {/* Star Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">Rating</label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoveredStar(i + 1)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      i < (hoveredStar || rating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-neutral-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-neutral-400">{rating} stars</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your experience"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none"
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Review <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this template..."
              rows={4}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none resize-none"
            />
            <p className="text-xs text-neutral-500 mt-1">{content.length} characters</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitReview}
              disabled={!content.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button
              onClick={() => {
                setShowReviewForm(false)
                setRating(5)
                setTitle('')
                setContent('')
              }}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div>
          {/* Sort Options */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Reviews</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-white hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="helpful">Most Helpful</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onVote={onVoteReview}
                onReport={onReportReview}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ReviewCardProps {
  review: TemplateReview
  onVote?: (reviewId: string, voteType: 'helpful' | 'not_helpful') => Promise<void>
  onReport?: (reviewId: string, reason: string) => Promise<void>
}

function ReviewCard({ review, onVote, onReport }: ReviewCardProps) {
  const [showReportModal, setShowReportModal] = useState(false)

  const handleVote = async (voteType: 'helpful' | 'not_helpful') => {
    if (!onVote) return
    await onVote(review.id, voteType)
  }

  return (
    <div className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {review.user_avatar ? (
            <img
              src={review.user_avatar}
              alt={review.user_name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 font-medium">
              {review.user_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{review.user_name}</span>
              {review.is_verified_purchase && (
                <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 border border-green-500/30 text-green-400">
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-neutral-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-neutral-500">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      {review.title && (
        <h5 className="font-medium text-white mb-2">{review.title}</h5>
      )}

      {/* Content */}
      <p className="text-neutral-300 mb-4">{review.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 text-sm text-neutral-400">
        <button
          onClick={() => handleVote('helpful')}
          className={`flex items-center gap-1.5 hover:text-white transition-colors ${
            review.user_vote === 'helpful' ? 'text-green-400' : ''
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Helpful ({review.helpful_count})</span>
        </button>
        <button
          onClick={() => handleVote('not_helpful')}
          className={`flex items-center gap-1.5 hover:text-white transition-colors ${
            review.user_vote === 'not_helpful' ? 'text-red-400' : ''
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span>Not Helpful ({review.not_helpful_count})</span>
        </button>
      </div>
    </div>
  )
}
