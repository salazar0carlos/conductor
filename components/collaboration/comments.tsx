'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToComments, subscribeToCommentReactions, unsubscribeAll } from '@/lib/collaboration/realtime'
import { MessageSquare, Send, Smile, Pin, Check, X, MoreHorizontal, Reply, Trash2 } from 'lucide-react'
import { generateUserColor } from '@/lib/collaboration/presence'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Comment {
  id: string
  entity_type: string
  entity_id: string
  parent_comment_id: string | null
  author_id: string
  content: string
  mentions: string[]
  is_resolved: boolean
  resolved_by_id: string | null
  resolved_at: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
  author?: {
    name: string
    email: string
    avatar_url?: string
  }
  reactions?: CommentReaction[]
  replies?: Comment[]
}

interface CommentReaction {
  id: string
  comment_id: string
  user_id: string
  emoji: string
  created_at: string
  user?: {
    name: string
    email: string
  }
}

interface CommentsProps {
  entityType: string
  entityId: string
  currentUserId: string
  currentUserName: string
  onMentionClick?: (userId: string) => void
}

export function Comments({
  entityType,
  entityId,
  currentUserId,
  currentUserName,
  onMentionClick
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const supabase = createClient()
  const channels: RealtimeChannel[] = []

  useEffect(() => {
    fetchComments()

    // Subscribe to comment changes
    const channel = subscribeToComments(entityType, entityId, () => {
      fetchComments()
    })

    channels.push(channel)

    return () => {
      unsubscribeAll(channels)
    }
  }, [entityType, entityId, showResolved])

  const fetchComments = async () => {
    try {
      const query = supabase
        .from('comments')
        .select(`
          *,
          author:team_members!comments_author_id_fkey(name, email, avatar_url),
          reactions:comment_reactions(
            *,
            user:team_members(name, email)
          )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true })

      if (!showResolved) {
        query.eq('is_resolved', false)
      }

      const { data, error } = await query

      if (error) throw error

      // Organize into threads
      const rootComments = data?.filter(c => !c.parent_comment_id) || []
      const commentMap = new Map(data?.map(c => [c.id, { ...c, replies: [] }]) || [])

      data?.forEach(comment => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.push(commentMap.get(comment.id)!)
          }
        }
      })

      setComments(Array.from(commentMap.values()).filter(c => !c.parent_comment_id))
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (parentId: string | null = null) => {
    if (!newComment.trim()) return

    try {
      // Parse mentions (e.g., @username)
      const mentionRegex = /@(\w+)/g
      const mentions: string[] = []
      let match

      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[1])
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          parent_comment_id: parentId,
          author_id: currentUserId,
          content: newComment,
          mentions
        })

      if (error) throw error

      setNewComment('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleResolve = async (commentId: string, isResolved: boolean) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          is_resolved: !isResolved,
          resolved_by_id: !isResolved ? currentUserId : null,
          resolved_at: !isResolved ? new Date().toISOString() : null
        })
        .eq('id', commentId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to resolve comment:', error)
    }
  }

  const handlePin = async (commentId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_pinned: !isPinned })
        .eq('id', commentId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to pin comment:', error)
    }
  }

  const handleAddReaction = async (commentId: string, emoji: string) => {
    try {
      const { error } = await supabase
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: currentUserId,
          emoji
        })

      if (error) {
        // If already exists, remove it
        if (error.code === '23505') {
          await supabase
            .from('comment_reactions')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', currentUserId)
            .eq('emoji', emoji)
        }
      }
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  if (loading) {
    return (
      <div className="border border-neutral-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-800 rounded w-1/4" />
                <div className="h-16 bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const pinnedComments = comments.filter(c => c.is_pinned)
  const regularComments = comments.filter(c => !c.is_pinned)

  return (
    <div className="border border-neutral-800 rounded-lg bg-neutral-950">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </h3>
        <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded border-neutral-700 bg-neutral-900"
          />
          Show resolved
        </label>
      </div>

      {/* Comments list */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {/* Pinned comments */}
        {pinnedComments.length > 0 && (
          <div className="space-y-4 pb-4 border-b border-neutral-800">
            <div className="text-xs font-semibold text-neutral-500 uppercase flex items-center gap-1">
              <Pin className="w-3 h-3" />
              Pinned
            </div>
            {pinnedComments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onReply={() => setReplyingTo(comment.id)}
                onResolve={() => handleResolve(comment.id, comment.is_resolved)}
                onPin={() => handlePin(comment.id, comment.is_pinned)}
                onAddReaction={(emoji) => handleAddReaction(comment.id, emoji)}
                onDelete={() => handleDelete(comment.id)}
                onMentionClick={onMentionClick}
              />
            ))}
          </div>
        )}

        {/* Regular comments */}
        {regularComments.length === 0 && pinnedComments.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-sm">No comments yet</p>
          </div>
        ) : (
          regularComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={() => setReplyingTo(comment.id)}
              onResolve={() => handleResolve(comment.id, comment.is_resolved)}
              onPin={() => handlePin(comment.id, comment.is_pinned)}
              onAddReaction={(emoji) => handleAddReaction(comment.id, emoji)}
              onDelete={() => handleDelete(comment.id)}
              onMentionClick={onMentionClick}
            />
          ))
        )}
      </div>

      {/* New comment input */}
      <div className="p-4 border-t border-neutral-800">
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between text-sm text-neutral-400">
            <span>Replying to comment...</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (use @ to mention)"
            className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 resize-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleAddComment(replyingTo)
              }
            }}
          />
          <button
            onClick={() => handleAddComment(replyingTo)}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-fit"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Cmd/Ctrl + Enter to send
        </p>
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  currentUserId: string
  onReply: () => void
  onResolve: () => void
  onPin: () => void
  onAddReaction: (emoji: string) => void
  onDelete: () => void
  onMentionClick?: (userId: string) => void
  isReply?: boolean
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onResolve,
  onPin,
  onAddReaction,
  onDelete,
  onMentionClick,
  isReply = false
}: CommentItemProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const isAuthor = comment.author_id === currentUserId

  const quickEmojis = ['👍', '❤️', '🎉', '👏', '🔥', '✅']

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Group reactions by emoji
  const groupedReactions = comment.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, CommentReaction[]>) || {}

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className={`flex gap-3 p-3 rounded-lg ${comment.is_resolved ? 'opacity-60' : ''} ${comment.is_pinned ? 'bg-neutral-900/50' : ''}`}>
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full border-2 border-neutral-800 flex items-center justify-center font-semibold text-white text-sm overflow-hidden flex-shrink-0"
          style={{
            backgroundColor: comment.author?.avatar_url ? undefined : generateUserColor(comment.author_id)
          }}
        >
          {comment.author?.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt={comment.author.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>
              {(comment.author?.name || comment.author?.email || '?')[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-sm font-medium text-white">
                {comment.author?.name || comment.author?.email}
              </span>
              <span className="text-xs text-neutral-500 ml-2">
                {formatTime(comment.created_at)}
              </span>
              {comment.is_pinned && (
                <Pin className="w-3 h-3 inline-block ml-2 text-yellow-500" />
              )}
              {comment.is_resolved && (
                <Check className="w-3 h-3 inline-block ml-2 text-green-500" />
              )}
            </div>

            {/* Actions menu */}
            <div className="flex items-center gap-1">
              {!isReply && (
                <button
                  onClick={onReply}
                  className="p-1 text-neutral-500 hover:text-white rounded"
                  title="Reply"
                >
                  <Reply className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 text-neutral-500 hover:text-white rounded"
                title="React"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                onClick={onPin}
                className="p-1 text-neutral-500 hover:text-white rounded"
                title={comment.is_pinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={onResolve}
                className="p-1 text-neutral-500 hover:text-white rounded"
                title={comment.is_resolved ? 'Unresolve' : 'Resolve'}
              >
                <Check className="w-4 h-4" />
              </button>
              {isAuthor && (
                <button
                  onClick={onDelete}
                  className="p-1 text-neutral-500 hover:text-red-500 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-sm text-neutral-300 whitespace-pre-wrap break-words">
            {comment.content}
          </div>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="flex gap-2 mt-2 p-2 bg-neutral-900 border border-neutral-800 rounded-lg">
              {quickEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    onAddReaction(emoji)
                    setShowEmojiPicker(false)
                  }}
                  className="text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Reactions */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(groupedReactions).map(([emoji, reactions]) => {
                const hasReacted = reactions.some(r => r.user_id === currentUserId)
                return (
                  <button
                    key={emoji}
                    onClick={() => onAddReaction(emoji)}
                    className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
                      hasReacted
                        ? 'bg-blue-600/20 border border-blue-600'
                        : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700'
                    }`}
                    title={reactions.map(r => r.user?.name || r.user?.email).join(', ')}
                  >
                    <span>{emoji}</span>
                    <span className="text-neutral-400">{reactions.length}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3 border-l-2 border-neutral-800 pl-4">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onResolve={onResolve}
                  onPin={onPin}
                  onAddReaction={onAddReaction}
                  onDelete={onDelete}
                  onMentionClick={onMentionClick}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
