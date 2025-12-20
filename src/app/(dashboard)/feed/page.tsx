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
import { ScrollAnimate } from '@/components/ui/scroll-animate'

// Client-side functions for tracking user interests
const trackUserInterestClient = async (
  userId: string,
  interestType: 'job_category' | 'skill' | 'industry' | 'hashtag' | 'company',
  interestValue: string,
  source: 'like' | 'view' | 'search' | 'apply' | 'bookmark'
) => {
  const supabase = createClient()
  
  const { data: existing } = await supabase
    .from('user_interests')
    .select('weight')
    .eq('user_id', userId)
    .eq('interest_type', interestType)
    .eq('interest_value', interestValue)
    .single()

  if (existing) {
    const weightMultiplier = {
      'like': 2.0,
      'apply': 3.0,
      'bookmark': 2.5,
      'view': 1.2,
      'search': 1.5
    }[source] || 1.0

    const newWeight = Math.min((existing.weight || 1.0) * weightMultiplier, 10.0)

    await supabase
      .from('user_interests')
      .update({
        weight: newWeight,
        source: source,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('interest_type', interestType)
      .eq('interest_value', interestValue)
  } else {
    await supabase
      .from('user_interests')
      .insert({
        user_id: userId,
        interest_type: interestType,
        interest_value: interestValue,
        weight: 1.0,
        source: source
      })
  }
}

const extractInterestsFromPostClient = (content: string): Array<{ type: 'hashtag', value: string }> => {
  const interests: Array<{ type: 'hashtag', value: string }> = []
  const hashtags = content.match(/#(\w+)/g) || []
  hashtags.forEach(tag => {
    interests.push({
      type: 'hashtag',
      value: tag.replace('#', '').toLowerCase()
    })
  })
  return interests
}

const scorePostForUserClient = async (
  userId: string,
  postContent: string,
  postHashtags: string[],
  isSystemPost: boolean
): Promise<number> => {
  const supabase = createClient()
  
  if (isSystemPost) {
    const { count } = await supabase
      .from('user_interests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if ((count || 0) === 0) {
      return 0.7 // Higher base score for new users
    }
    return 0.6 // Boosted score for system posts
  }

  const { data: interests } = await supabase
    .from('user_interests')
    .select('interest_type, interest_value, weight')
    .eq('user_id', userId)
    .order('weight', { ascending: false })
    .limit(10)

  if (!interests || interests.length === 0) {
    return 0.5
  }

  let score = 0
  let totalWeight = 0

  const postHashtagValues = postHashtags.map(h => h.toLowerCase())
  
  interests.forEach(interest => {
    if (interest.interest_type === 'hashtag') {
      if (postHashtagValues.includes(interest.interest_value.toLowerCase())) {
        score += interest.weight || 1.0
        totalWeight += interest.weight || 1.0
      }
    }
    
    if (postContent.toLowerCase().includes(interest.interest_value.toLowerCase())) {
      score += (interest.weight || 1.0) * 0.5
      totalWeight += (interest.weight || 1.0) * 0.5
    }
  })

  if (totalWeight === 0) return 0.5
  return Math.min(score / totalWeight, 1.0)
}

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
    let mounted = true
    let channel: any = null

    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      if (!mounted) return
      
      setCurrentUserId(user.id)
      await fetchPosts()

      // Set up comprehensive realtime subscription
      if (mounted) {
        channel = supabase
          .channel('social_feed_realtime')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'social_posts'
          }, () => {
            if (mounted) fetchPosts()
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'social_posts'
          }, () => {
            if (mounted) fetchPosts()
          })
          .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'social_posts'
          }, () => {
            if (mounted) fetchPosts()
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'post_likes'
          }, () => {
            if (mounted) fetchPosts()
          })
          .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'post_likes'
          }, () => {
            if (mounted) fetchPosts()
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'post_comments'
          }, () => {
            if (mounted) fetchPosts()
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'post_comments'
          }, () => {
            if (mounted) fetchPosts()
          })
          .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'post_comments'
          }, () => {
            if (mounted) fetchPosts()
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Feed realtime subscription active')
            }
          })
      }
    }

    initialize()

    return () => {
      mounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [router, supabase])

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
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

      // Format posts and calculate personalization scores
      const postsWithScores = await Promise.all(
        (data || []).map(async (post: any) => {
          // Check if this is a system/website post
          const isSystemPost = post.is_system_post === true
          
          // Extract interests from post
          const postInterests = extractInterestsFromPostClient(post.content)
          
          // Calculate personalization score
          const personalizationScore = await scorePostForUserClient(
            user.id,
            post.content,
            postInterests.map(i => i.value),
            isSystemPost
          )
          
          return {
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            image_url: post.image_url,
            post_type: post.post_type,
            job_id: post.job_id,
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            created_at: post.created_at,
            is_system_post: isSystemPost,
            personalization_score: personalizationScore,
            user: {
              full_name: isSystemPost ? 'Rezzy' : (post.user?.full_name || post.user?.email?.split('@')[0] || 'User'),
              email: post.user?.email || '',
              avatar_url: isSystemPost ? '/logo.png' : (post.user?.avatar_url || null)
            },
            is_liked: likedPostIds.has(post.id),
            job: post.job ? {
              title: post.job.title,
              company_name: post.job.companies?.name || 'Unknown Company'
            } : undefined
          }
        })
      )

      // Sort posts: personalized first, then by date
      // System posts should always show if they're the only ones
      const nonSystemPosts = postsWithScores.filter(p => !p.is_system_post)
      const systemPosts = postsWithScores.filter(p => p.is_system_post)
      
      // If there are no non-system posts, show system posts
      if (nonSystemPosts.length === 0) {
        const sortedSystem = systemPosts.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setPosts(sortedSystem)
        setLoading(false)
        return
      }
      
      // Sort non-system posts by personalization score, then by date
      const sortedNonSystem = nonSystemPosts.sort((a, b) => {
        if (Math.abs(a.personalization_score - b.personalization_score) > 0.1) {
          return b.personalization_score - a.personalization_score
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      
      // Sort system posts by date
      const sortedSystem = systemPosts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      // Combine: personalized posts first, then system posts
      const sortedPosts = [...sortedNonSystem, ...sortedSystem]
      setPosts(sortedPosts)
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

        // Track interests from liked post
        const interests = extractInterestsFromPostClient(post.content)
        for (const interest of interests) {
          await trackUserInterestClient(user.id, interest.type, interest.value, 'like')
        }
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

        // Track interests from viewing/interacting with post
        const interests = extractInterestsFromPostClient(post.content)
        for (const interest of interests) {
          await trackUserInterestClient(user.id, interest.type, interest.value, 'view')
        }
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
                    placeholder="What's on your mind? Share an update, achievement, or job opportunity... Use #hashtags and @mentions!"
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
            posts.map((post, index) => {
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
                <ScrollAnimate key={post.id} animation="fadeInUp" delay={index * 100} triggerOnce={true}>
                  <div>
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
                </ScrollAnimate>
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

