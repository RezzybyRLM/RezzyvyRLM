'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit,
  Trash2,
  User,
  Briefcase,
  Send,
  Repeat
} from 'lucide-react'

interface PostCardProps {
  post: {
    id: string
    user_id: string
    content: string
    image_url: string | null
    post_type: 'text' | 'job' | 'achievement' | 'update'
    job_id: string | null
    likes_count: number
    comments_count: number
    created_at: string
    user: {
      full_name: string | null
      email: string
      avatar_url?: string | null
    }
    is_liked: boolean
    job?: {
      title: string
      company_name: string
    }
  }
  currentUserId: string
  onLike: () => void
  onComment: () => void
  onShare?: () => void
  onEdit?: () => void
  onDelete?: () => void
  formatTime: (date: string) => string
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  formatTime
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const isOwn = post.user_id === currentUserId

  // Extract hashtags and mentions
  const hashtags: string[] = post.content.match(/#\w+/g) || []
  const mentions: string[] = post.content.match(/@\w+/g) || []

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="p-4 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {post.user.avatar_url ? (
            <img
              src={post.user.avatar_url}
              alt={post.user.full_name || 'User'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <User className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {post.user.full_name || post.user.email.split('@')[0]}
            </h3>
            <p className="text-xs text-gray-500">
              {/* Headline placeholder */}
              User  • {formatTime(post.created_at)}
            </p>
          </div>
        </div>

        {isOwn && (
          <div className="relative">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowMenu(!showMenu)}>
              <MoreHorizontal className="h-5 w-5 text-gray-600" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-20">
                {onEdit && (
                  <button onClick={() => { onEdit(); setShowMenu(false) }} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => { onDelete(); setShowMenu(false) }} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        {post.job && (
          <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded shadow-sm">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{post.job.title}</p>
              <p className="text-xs text-gray-600">{post.job.company_name}</p>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
          {post.content.split(/(#\w+|@\w+)/g).map((part, index) => {
            if (hashtags.includes(part)) return <span key={index} className="text-blue-600 font-medium hover:underline cursor-pointer">{part}</span>
            if (mentions.includes(part)) return <span key={index} className="text-blue-600 font-semibold hover:underline cursor-pointer">{part}</span>
            return <span key={index}>{part}</span>
          })}
        </p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="mt-2 w-full bg-gray-100">
          <img
            src={post.image_url}
            alt="Post content"
            className="w-full max-h-[600px] object-contain mx-auto cursor-pointer"
            onClick={() => window.open(post.image_url!, '_blank')}
          />
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1">
          {(post.likes_count > 0) && (
            <>
              <div className="flex -space-x-1">
                <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-white z-10">
                  <ThumbsUp className="h-2 w-2 text-white" />
                </span>
                {/* Could add heart/clap icons for reaction pile */}
              </div>
              <span className="hover:text-blue-600 hover:underline cursor-pointer">{post.likes_count}</span>
            </>
          )}
        </div>
        <div>
          {post.comments_count > 0 && <span className="hover:text-blue-600 hover:underline cursor-pointer mr-2">{post.comments_count} comments</span>}
          <span className="hover:text-blue-600 hover:underline cursor-pointer">0 reposts</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-1 flex items-center justify-between">
        <Button
          variant="ghost"
          className={`flex-1 flex gap-2 rounded hover:bg-gray-100 h-12 ${post.is_liked ? 'text-blue-600' : 'text-gray-600'}`}
          onClick={onLike}
        >
          <ThumbsUp className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} />
          <span className="font-medium">Like</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex gap-2 rounded hover:bg-gray-100 h-12 text-gray-600"
          onClick={onComment}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Comment</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex gap-2 rounded hover:bg-gray-100 h-12 text-gray-600"
          onClick={onShare}
        >
          <Repeat className="h-5 w-5" />
          <span className="font-medium">Repost</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex gap-2 rounded hover:bg-gray-100 h-12 text-gray-600"
        >
          <Send className="h-5 w-5" />
          <span className="font-medium">Send</span>
        </Button>
      </div>
    </div>
  )
}

