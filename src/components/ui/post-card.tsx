'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical,
  Edit,
  Trash2,
  User,
  Briefcase
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

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

  // Extract hashtags and mentions from content
  const hashtags: string[] = post.content.match(/#\w+/g) || []
  const mentions: string[] = post.content.match(/@\w+/g) || []

  return (
    <Card className="card-professional">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {post.user.avatar_url ? (
              <img
                src={post.user.avatar_url}
                alt={post.user.full_name || post.user.email.split('@')[0]}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  // Fallback to default if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {post.user.full_name || post.user.email.split('@')[0]}
              </h3>
              <p className="text-sm text-gray-500">{formatTime(post.created_at)}</p>
            </div>
          </div>
          {isOwn && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit()
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete()
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {post.job && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Job Opportunity</span>
              </div>
              <p className="text-sm text-blue-800 font-medium">{post.job.title}</p>
              <p className="text-xs text-blue-600">{post.job.company_name}</p>
            </div>
          )}
          
          <p className="text-gray-900 whitespace-pre-wrap break-words">
            {post.content.split(/(#\w+|@\w+)/g).map((part, index) => {
              if (hashtags.includes(part)) {
                return (
                  <span key={index} className="text-primary font-medium hover:underline cursor-pointer">
                    {part}
                  </span>
                )
              }
              if (mentions.includes(part)) {
                return (
                  <span key={index} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    {part}
                  </span>
                )
              }
              return <span key={index}>{part}</span>
            })}
          </p>

          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post"
              className="w-full rounded-lg cursor-pointer"
              onClick={() => window.open(post.image_url!, '_blank')}
            />
          )}

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={post.is_liked ? 'text-red-600' : 'text-gray-600'}
            >
              <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
              {post.likes_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onComment}
              className="text-gray-600"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.comments_count}
            </Button>
            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShare}
                className="text-gray-600"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

