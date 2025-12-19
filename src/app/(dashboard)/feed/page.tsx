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
import { PostCard } from '@/components/ui/post-card'
import { formatTime } from '@/lib/utils'

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
    fetchPosts()

    // Set up realtime subscription
    const channel = supabase
      .channel('social_posts_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'social_posts'
      }, () => {
        fetchPosts()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes'
      }, () => {
        fetchPosts()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_comments'
      }, () => {
        fetchPosts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

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

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.user.full_name || post.user.email.split('@')[0]}`,
          text: post.content,
          url: window.location.href
        })
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${post.content}\n\n${window.location.href}`)
      alert('Post link copied to clipboard!')
    }
  }

  const handleEdit = (post: Post) => {
    setEditingPost(post.id)
    setEditContent(post.content)
  }

  const handleSaveEdit = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({
          content: editContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (error) throw error

      setEditingPost(null)
      setEditContent('')
      fetchPosts()
    } catch (error) {
      console.error('Error editing post:', error)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
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
            posts.map((post) => {
              if (editingPost === post.id) {
                return (
                  <Card key={post.id} className="card-professional">
                    <CardContent className="p-6">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        rows={4}
                      />
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleSaveEdit(post.id)}
                          disabled={!editContent.trim()}
                          className="btn-primary"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingPost(null)
                            setEditContent('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <div key={post.id}>
                  <PostCard
                    post={post}
                    currentUserId={currentUserId || ''}
                    onLike={() => toggleLike(post.id)}
                    onComment={() => toggleComments(post.id)}
                    onShare={() => handleShare(post)}
                    onEdit={() => handleEdit(post)}
                    onDelete={() => handleDelete(post.id)}
                    formatTime={formatTime}
                  />
                  {expandedComments.has(post.id) && (
                    <Card className="card-professional mt-2">
                      <CardContent className="p-4">
                        <PostComments
                          postId={post.id}
                          showComments={true}
                          commentContent={commentContent[post.id] || ''}
                          onCommentChange={(content) => setCommentContent(prev => ({ ...prev, [post.id]: content }))}
                          onAddComment={() => addComment(post.id)}
                          formatTime={formatTime}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// Comments section component
function PostComments({
  postId,
  showComments,
  commentContent,
  onCommentChange,
  onAddComment,
  formatTime
}: {
  postId: string
  showComments: boolean
  commentContent: string
  onCommentChange: (content: string) => void
  onAddComment: () => void
  formatTime: (date: string) => string
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (showComments) {
      setLoadingComments(true)
      const fetchComments = async () => {
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

          const formatted = (data || []).map((comment: any) => ({
            id: comment.id,
            user_id: comment.user_id,
            content: comment.content,
            created_at: comment.created_at,
            user: {
              full_name: comment.user.full_name,
              email: comment.user.email
            }
          }))

          setComments(formatted)
        } catch (error) {
          console.error('Error fetching comments:', error)
        } finally {
          setLoadingComments(false)
        }
      }
      fetchComments()
    }
  }, [showComments, postId, supabase])

  if (!showComments) return null

  return (
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
  )
}

