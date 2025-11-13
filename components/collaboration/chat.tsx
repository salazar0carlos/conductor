'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToChatRoom, unsubscribe } from '@/lib/collaboration/realtime'
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  Hash,
  Lock,
  Users,
  Smile,
  Paperclip,
  Code,
  MoreVertical,
  Pin,
  Trash2,
  Edit3,
  Reply
} from 'lucide-react'
import { generateUserColor } from '@/lib/collaboration/presence'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ChatRoom {
  id: string
  name: string | null
  type: 'direct' | 'project' | 'team' | 'channel'
  project_id: string | null
  is_private: boolean
  avatar_url: string | null
  description: string | null
  created_at: string
  unread_count?: number
  last_message?: ChatMessage
}

interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'file' | 'code' | 'system'
  reply_to_id: string | null
  mentions: string[]
  attachments: any[]
  is_edited: boolean
  is_deleted: boolean
  is_pinned: boolean
  edited_at: string | null
  created_at: string
  sender?: {
    name: string
    email: string
    avatar_url?: string
  }
  reactions?: MessageReaction[]
  reply_to?: ChatMessage
}

interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  user?: {
    name: string
    email: string
  }
}

interface ChatProps {
  currentUserId: string
  currentUserName: string
  projectId?: string
}

export function Chat({ currentUserId, currentUserName, projectId }: ChatProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [messageType, setMessageType] = useState<'text' | 'code'>('text')
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchRooms()
  }, [currentUserId, projectId])

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id)
      subscribeToRoom(activeRoom.id)

      return () => {
        if (channelRef.current) {
          unsubscribe(channelRef.current)
        }
      }
    }
  }, [activeRoom])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchRooms = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', currentUserId)

      if (memberError) throw memberError

      const roomIds = memberData?.map(m => m.room_id) || []

      if (roomIds.length === 0) {
        setRooms([])
        setLoading(false)
        return
      }

      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('updated_at', { ascending: false })

      if (roomsError) throw roomsError

      setRooms(roomsData || [])

      // Auto-select first room or project room
      if (roomsData && roomsData.length > 0) {
        if (projectId) {
          const projectRoom = roomsData.find(r => r.project_id === projectId)
          setActiveRoom(projectRoom || roomsData[0])
        } else {
          setActiveRoom(roomsData[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:team_members!chat_messages_sender_id_fkey(name, email, avatar_url),
          reactions:chat_message_reactions(
            *,
            user:team_members(name, email)
          ),
          reply_to:chat_messages!chat_messages_reply_to_id_fkey(
            id,
            content,
            sender:team_members!chat_messages_sender_id_fkey(name, email)
          )
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      setMessages(data || [])

      // Mark as read
      await supabase
        .from('chat_room_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', currentUserId)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const subscribeToRoom = (roomId: string) => {
    channelRef.current = subscribeToChatRoom(roomId, () => {
      fetchMessages(roomId)
    })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return

    try {
      // Parse mentions
      const mentionRegex = /@(\w+)/g
      const mentions: string[] = []
      let match

      while ((match = mentionRegex.exec(newMessage)) !== null) {
        mentions.push(match[1])
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: activeRoom.id,
          sender_id: currentUserId,
          content: newMessage,
          message_type: messageType,
          reply_to_id: replyingTo?.id || null,
          mentions
        })

      if (error) throw error

      setNewMessage('')
      setReplyingTo(null)
      setMessageType('text')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const { error } = await supabase
        .from('chat_message_reactions')
        .insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji
        })

      if (error) {
        // If already exists, remove it
        if (error.code === '23505') {
          await supabase
            .from('chat_message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', currentUserId)
            .eq('emoji', emoji)
        }
      }
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_deleted: true })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_pinned: !isPinned })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to pin message:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex border border-neutral-800 rounded-lg bg-neutral-950 overflow-hidden">
      {/* Sidebar - Rooms list */}
      <div className="w-64 border-r border-neutral-800 flex flex-col">
        {/* Sidebar header */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat
            </h3>
            <button
              className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-sm">
              No chat rooms
            </div>
          ) : (
            filteredRooms.map(room => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`w-full flex items-start gap-3 p-3 hover:bg-neutral-900/50 transition-colors ${
                  activeRoom?.id === room.id ? 'bg-neutral-900' : ''
                }`}
              >
                {/* Room icon */}
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  {room.type === 'direct' ? (
                    <Users className="w-5 h-5 text-neutral-400" />
                  ) : room.is_private ? (
                    <Lock className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <Hash className="w-5 h-5 text-neutral-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white truncate">
                      {room.name || 'Unnamed room'}
                    </span>
                    {room.unread_count && room.unread_count > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                  {room.last_message && (
                    <p className="text-xs text-neutral-500 truncate">
                      {room.last_message.content}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                {activeRoom.type === 'direct' ? (
                  <Users className="w-5 h-5" />
                ) : activeRoom.is_private ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Hash className="w-5 h-5" />
                )}
                {activeRoom.name || 'Unnamed room'}
              </h4>
              {activeRoom.description && (
                <p className="text-sm text-neutral-500 mt-1">
                  {activeRoom.description}
                </p>
              )}
            </div>
            <button className="p-2 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <MessageItem
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                onReply={() => setReplyingTo(message)}
                onAddReaction={(emoji) => handleAddReaction(message.id, emoji)}
                onPin={() => handlePinMessage(message.id, message.is_pinned)}
                onDelete={() => handleDeleteMessage(message.id)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="p-4 border-t border-neutral-800">
            {replyingTo && (
              <div className="mb-2 px-3 py-2 bg-neutral-900 border-l-2 border-blue-500 rounded flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-neutral-500">Replying to </span>
                  <span className="text-white font-medium">
                    {replyingTo.sender?.name}
                  </span>
                  <p className="text-neutral-400 text-xs truncate">
                    {replyingTo.content}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-neutral-500 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1 flex gap-2 items-end">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${activeRoom.name || 'room'}...`}
                  className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => setMessageType(messageType === 'text' ? 'code' : 'text')}
                    className={`p-2 rounded-lg transition-colors ${
                      messageType === 'code'
                        ? 'bg-blue-600 text-white'
                        : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
                    }`}
                    title="Code snippet"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-neutral-500 hover:text-white rounded-lg hover:bg-neutral-900"
                    title="Add emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-500">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
            <p>Select a room to start chatting</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface MessageItemProps {
  message: ChatMessage
  currentUserId: string
  onReply: () => void
  onAddReaction: (emoji: string) => void
  onPin: () => void
  onDelete: () => void
}

function MessageItem({
  message,
  currentUserId,
  onReply,
  onAddReaction,
  onPin,
  onDelete
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const isOwnMessage = message.sender_id === currentUserId

  const quickEmojis = ['👍', '❤️', '😂', '🎉', '👏', '🔥']

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Group reactions
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, MessageReaction[]>) || {}

  return (
    <div
      className={`group flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full border-2 border-neutral-800 flex items-center justify-center font-semibold text-white text-xs overflow-hidden flex-shrink-0"
        style={{
          backgroundColor: message.sender?.avatar_url ? undefined : generateUserColor(message.sender_id)
        }}
      >
        {message.sender?.avatar_url ? (
          <img
            src={message.sender.avatar_url}
            alt={message.sender.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>
            {(message.sender?.name || message.sender?.email || '?')[0].toUpperCase()}
          </span>
        )}
      </div>

      <div className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Message header */}
        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          <span className="text-sm font-medium text-white">
            {message.sender?.name || message.sender?.email}
          </span>
          <span className="text-xs text-neutral-600">
            {formatTime(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-xs text-neutral-600">(edited)</span>
          )}
          {message.is_pinned && (
            <Pin className="w-3 h-3 text-yellow-500" />
          )}
        </div>

        {/* Reply context */}
        {message.reply_to && (
          <div className={`px-2 py-1 mb-2 bg-neutral-900 border-l-2 border-blue-500 rounded text-xs ${isOwnMessage ? 'ml-auto' : ''}`}>
            <span className="text-neutral-500">
              Replying to <span className="text-white font-medium">{message.reply_to.sender?.name}</span>
            </span>
            <p className="text-neutral-400 truncate">{message.reply_to.content}</p>
          </div>
        )}

        {/* Message content */}
        <div
          className={`px-4 py-2 rounded-lg max-w-2xl ${
            isOwnMessage
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-900 text-white'
          } ${
            message.message_type === 'code'
              ? 'font-mono text-sm'
              : ''
          }`}
        >
          {message.message_type === 'code' ? (
            <pre className="whitespace-pre-wrap break-words">
              <code>{message.content}</code>
            </pre>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className={`flex gap-1 mt-1 ${isOwnMessage ? 'ml-auto' : ''}`}>
            <button
              onClick={onReply}
              className="p-1 text-neutral-500 hover:text-white rounded"
              title="Reply"
            >
              <Reply className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-neutral-500 hover:text-white rounded"
              title="React"
            >
              <Smile className="w-3 h-3" />
            </button>
            <button
              onClick={onPin}
              className="p-1 text-neutral-500 hover:text-white rounded"
              title={message.is_pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-3 h-3" />
            </button>
            {isOwnMessage && (
              <button
                onClick={onDelete}
                className="p-1 text-neutral-500 hover:text-red-500 rounded"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className={`flex gap-2 mt-1 p-2 bg-neutral-900 border border-neutral-800 rounded-lg ${isOwnMessage ? 'ml-auto' : ''}`}>
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
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwnMessage ? 'ml-auto' : ''}`}>
            {Object.entries(groupedReactions).map(([emoji, reactions]) => {
              const hasReacted = reactions.some(r => r.user_id === currentUserId)
              return (
                <button
                  key={emoji}
                  onClick={() => onAddReaction(emoji)}
                  className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors ${
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
      </div>
    </div>
  )
}
