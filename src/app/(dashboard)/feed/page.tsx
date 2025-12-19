'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Image as ImageIcon,
  Briefcase,
  User,
  Loader2,
  MoreVertical
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Post {
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
  }
  is_liked: boolean
  job?: {
    title: string
    company_name: string
  }
}

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  user: {
    full_name: string | null
    email: string
  }
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentContent, setCommentContent] = useState<Record<string, string>>({})
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
    const interval = setInterval(fetchPosts, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          user:users!social_posts_user_id_fkey(id, full_name, email),
          job:jobs(id, title, companies(name))
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Check which posts are liked by current user
      const postIds = (data || []).map(p => p.id)
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)

      const likedPostIds = new Set((likes || []).map(l => l.post_id))

      const formattedPosts = (data || []).map((post: any) => ({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        post_type: post.post_type,
        job_id: post.job_id,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        created_at: post.created_at,
        user: {
          full_name: post.user.full_name,
          email: post.user.email
        },
        is_liked: likedPostIds.has(post.id),
        job: post.job ? {
          title: post.job.title,
          company_name: post.job.companies?.name || 'Unknown Company'
        } : undefined
      }))

      setPosts(formattedPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!newPostContent.trim()) return

    setPosting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          content: newPostContent.trim(),
          post_type: 'text'
        })

      if (error) throw error

      setNewPostContent('')
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setPosting(false)
    }
  }

  const toggleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const post = posts.find(p => p.id === postId)
      if (!post) return

      if (post.is_liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        await supabase
          .from('social_posts')
          .update({ likes_count: post.likes_count - 1 })
          .eq('id', postId)
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        await supabase
          .from('social_posts')
          .update({ likes_count: post.likes_count + 1 })
          .eq('id', postId)
      }

      fetchPosts()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const addComment = async (postId: string) => {
    const content = commentContent[postId]?.trim()
    if (!content) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content
        })

      if (error) throw error

      // Update comment count
      const post = posts.find(p => p.id === postId)
      if (post) {
        await supabase
          .from('social_posts')
          .update({ comments_count: post.comments_count + 1 })
          .eq('id', postId)
      }

      setCommentContent(prev => ({ ...prev, [postId]: '' }))
      fetchPosts()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const fetchComments = async (postId: string): Promise<Comment[]> => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:users!post_comments_user_id_fkey(id, full_name, email)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return (data || []).map((comment: any) => ({
        id: comment.id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          full_name: comment.user.full_name,
          email: comment.user.email
        }
      }))
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  }

  const toggleComments = async (postId: string) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    } else {
      setExpandedComments(prev => new Set(prev).add(postId))
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Feed</h1>
          <p className="text-gray-600">Share updates, achievements, and connect with professionals</p>
        </div>

        {/* Create Post */}
        <Card className="card-professional mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind? Share an update, achievement, or job opportunity..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" disabled>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photo
                  </Button>
                  <Button variant="ghost" size="sm" disabled>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Job
                  </Button>
                </div>
                <Button
                  onClick={createPost}
                  disabled={posting || !newPostContent.trim()}
                  className="btn-primary"
                >
                  {posting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="card-professional">
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">Be the first to share something with the community!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => toggleLike(post.id)}
                onComment={() => toggleComments(post.id)}
                onAddComment={() => addComment(post.id)}
                commentContent={commentContent[post.id] || ''}
                onCommentChange={(content) => setCommentContent(prev => ({ ...prev, [post.id]: content }))}
                showComments={expandedComments.has(post.id)}
                fetchComments={fetchComments}
                formatTime={formatTime}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function PostCard({
  post,
  onLike,
  onComment,
  onAddComment,
  commentContent,
  onCommentChange,
  showComments,
  fetchComments,
  formatTime
}: {
  post: Post
  onLike: () => void
  onComment: () => void
  onAddComment: () => void
  commentContent: string
  onCommentChange: (content: string) => void
  showComments: boolean
  fetchComments: (postId: string) => Promise<Comment[]>
  formatTime: (date: string) => string
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)

  useEffect(() => {
    if (showComments) {
      setLoadingComments(true)
      fetchComments(post.id).then(data => {
        setComments(data)
        setLoadingComments(false)
      })
    }
  }, [showComments, post.id, fetchComments])

  return (
    <Card className="card-professional">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {post.user.full_name || post.user.email.split('@')[0]}
              </h3>
              <p className="text-sm text-gray-500">{formatTime(post.created_at)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
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
              <Link href={`/jobs/${post.job_id}`} className="hover:underline">
                <p className="text-sm text-blue-800 font-medium">{post.job.title}</p>
                <p className="text-xs text-blue-600">{post.job.company_name}</p>
              </Link>
            </div>
          )}
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          {post.image_url && (
            <img src={post.image_url} alt="Post" className="w-full rounded-lg" />
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
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
          {showComments && (
            <div className="pt-4 border-t space-y-3">
              {loadingComments ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                </div>
              ) : (
                <>
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-sm font-medium text-gray-900">
                            {comment.user.full_name || comment.user.email.split('@')[0]}
                          </p>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(comment.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={commentContent}
                      onChange={(e) => onCommentChange(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          onAddComment()
                        }
                      }}
                    />
                    <Button onClick={onAddComment} disabled={!commentContent.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

