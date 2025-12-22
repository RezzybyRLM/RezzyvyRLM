'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Share2,
  Send,
  Image as ImageIcon,
  Briefcase,
  User,
  Loader2,
  ThumbsUp,
  MoreHorizontal,
  X,
  Plus
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PostCard } from '@/components/ui/post-card'
import { formatTime } from '@/lib/utils'
import { ScrollAnimate } from '@/components/ui/scroll-animate'

// --- Interfaces ---
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
    avatar_url?: string | null
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
    avatar_url?: string | null
  }
}

// --- Helper Components ---

function ProfileCard({ user, stats }: { user: any, stats: any }) {
  if (!user) return null

  return (
    <Card className="card-professional overflow-hidden sticky top-24">
      <div className="h-16 bg-gradient-to-r from-blue-700 to-indigo-700 w-full relative">
      </div>
      <CardContent className="pt-0 pb-4 px-4 text-center -mt-8">
        <div className="flex justify-center mb-3">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || 'User'}
              className="w-16 h-16 rounded-full border-4 border-white shadow-sm object-cover bg-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-sm bg-gray-100 flex items-center justify-center text-gray-400">
              <User className="w-8 h-8" />
            </div>
          )}
        </div>

        <Link href="/profile" className="hover:underline">
          <h3 className="font-semibold text-lg text-gray-900 leading-tight">
            {user.full_name || user.email?.split('@')[0]}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mt-1 mb-4 truncate">
          {user.headline || 'Software Engineer at Tech Co'}
        </p>

        <div className="border-t border-gray-100 pt-3 text-left">
          <div className="flex justify-between items-center text-xs font-medium text-gray-500 hover:bg-gray-50 p-1 rounded cursor-pointer transition-colors">
            <span>Profile viewers</span>
            <span className="text-primary">{stats.viewers || 0}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-medium text-gray-500 hover:bg-gray-50 p-1 rounded cursor-pointer transition-colors">
            <span>Post impressions</span>
            <span className="text-primary">{stats.impressions || 0}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-3 pt-3 text-left">
          <Link href="/bookmarks" className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:underline">
            <Briefcase className="w-3 h-3 text-gray-400" />
            <span>My Items</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function NewsWidget() {
  const news = [
    { title: "Tech hiring stabilizes", time: "2h ago", readers: "10,934" },
    { title: "AI regulation talks heat up", time: "4h ago", readers: "5,211" },
    { title: "Remote work trends 2024", time: "1d ago", readers: "22,402" },
    { title: "Startups raising billions", time: "1d ago", readers: "8,910" },
    { title: "Rezzy launches new feed", time: "Just now", readers: "1,200" },
  ]

  return (
    <Card className="card-professional sticky top-24">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-sm text-gray-900">Rezzy News</h3>
          <div className="p-1 rounded bg-gray-100">
            <span className="text-[10px] font-bold text-gray-500">i</span>
          </div>
        </div>
        <ul className="space-y-4">
          {news.map((item, i) => (
            <li key={i} className="cursor-pointer group">
              <div className="flex items-start gap-2">
                <div className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 group-hover:bg-gray-900"></div>
                <div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.time} • {item.readers} readers
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Button variant="ghost" size="sm" className="mt-4 w-full text-gray-500 text-xs font-medium flex items-center justify-center gap-1">
          Show more <Plus className="w-3 h-3" />
        </Button>
      </CardContent>
    </Card>
  )
}

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
              email: comment.user.email,
              avatar_url: null // would need to fetch generic profile logic if needed
            }
          }))

          setComments(formatted)
        } catch (error) {
          console.error('Error fetching comments:', error)
          setComments([])
        } finally {
          setLoadingComments(false)
        }
      }

      fetchComments()

      // Realtime comments
      const channel = supabase
        .channel(`comments:${postId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        }, () => {
          fetchComments()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [postId, showComments, supabase])

  if (!showComments) return null

  return (
    <div className="bg-gray-50/50 p-4 border-t border-gray-100">
      <div className="flex gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="relative">
            <Input
              value={commentContent}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Add a comment..."
              className="rounded-full bg-white border-gray-300 pr-10 focus-visible:ring-1 focus-visible:ring-primary h-10"
              onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1 h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full"
              onClick={onAddComment}
              disabled={!commentContent.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {loadingComments ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600">
                  {comment.user.full_name?.[0] || comment.user.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 bg-gray-100 rounded-r-xl rounded-bl-xl p-3">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-bold text-gray-900">
                    {comment.user.full_name || comment.user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// --- Main Page Component ---

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentContent, setCommentContent] = useState<Record<string, string>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent')

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (mounted) {
        setCurrentUserId(user.id)

        // Fetch User Profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) setUserProfile(profile)
      }

      await fetchPosts()

      // Realtime subscription for posts
      if (mounted) {
        const channel = supabase
          .channel('feed_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'social_posts' }, () => fetchPosts())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => fetchPosts())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () => fetchPosts())
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }

    initialize()
    return () => { mounted = false }
  }, [router, supabase])

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          user:users!social_posts_user_id_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const postIds = (data || []).map(p => p.id)
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)

      const likedPostIds = new Set((likes || []).map(l => l.post_id))

      const formattedPosts = (data || []).map((post: any) => {
        const isSystem = post.is_system_post
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
          is_liked: likedPostIds.has(post.id),
          user: {
            full_name: isSystem ? 'Rezzy' : (post.user?.full_name || post.user?.email.split('@')[0]),
            email: post.user?.email || '',
            avatar_url: isSystem ? '/logo.png' : null // Assuming logo.png exists in public
          }
        }
      })

      setPosts(formattedPosts)
    } catch (error) {
      console.error('Error', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const cancelImage = () => {
    setImageFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const createPost = async () => {
    if (!newPostContent.trim() && !imageFile) return

    setPosting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let imageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(filePath, imageFile)

        if (uploadError) {
          // Attempt to create bucket if it doesn't exist (though ideally done via backend/sql)
          // For now, we assume failure if bucket missing, user will see error log.
          console.error('Upload error', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('post_images')
            .getPublicUrl(filePath)
          imageUrl = publicUrl
        }
      }

      const { error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          content: newPostContent.trim(),
          image_url: imageUrl,
          post_type: 'text'
        })

      if (error) throw error

      setNewPostContent('')
      cancelImage()
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setPosting(false)
    }
  }

  const toggleLike = async (postId: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          is_liked: !p.is_liked,
          likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1
        }
      }
      return p
    }))

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const post = posts.find(p => p.id === postId)
      // Note: post state here might be stale due to closure, but we are using prev is_liked logic
      // Actually simpler to just check if it was liked before logic start.
      // Re-fetch handled purely by realtime subscription usually, but for immediate feedback we did optimistic.

      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        await supabase.from('post_likes').delete().eq('id', existingLike.id)
        await supabase.from('social_posts').update({ likes_count: (post?.likes_count || 1) - 1 }).eq('id', postId)
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
        await supabase.from('social_posts').update({ likes_count: (post?.likes_count || 0) + 1 }).eq('id', postId)
      }
    } catch (err) {
      console.error(err)
      fetchPosts() // Revert on error
    }
  }

  const addComment = async (postId: string) => {
    const content = commentContent[postId]?.trim()
    if (!content) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        content
      })

      // optimistically increment comment count? 
      // Realtime will handle it, but for UI responsiveness:
      setCommentContent(prev => ({ ...prev, [postId]: '' }))

      await supabase.rpc('increment_comment_count', { post_id: postId })
      // If RPC doesn't exist, we fallback to fetch. We'll assume direct update for now or just wait for realtime.
      // Actually, let's manual update
      const post = posts.find(p => p.id === postId)
      if (post) {
        await supabase.from('social_posts').update({ comments_count: post.comments_count + 1 }).eq('id', postId)
      }

    } catch (err) {
      console.error(err)
    }
  }

  // Derived sorted posts
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'top') {
      return b.likes_count - a.likes_count
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f2ef]"> {/* LinkedIn background color */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left Sidebar - Profile */}
          <div className="hidden md:block md:col-span-3">
            <ProfileCard user={userProfile || {}} stats={{ viewers: 42, impressions: 1205 }} />
          </div>

          {/* Main Feed */}
          <div className="col-span-1 md:col-span-6 space-y-4">
            {/* Create Post Widget */}
            <Card className="card-professional overflow-visible">
              <CardContent className="p-4">
                <div className="flex gap-3 mb-3">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      className="w-full h-12 rounded-full border-gray-300 font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer text-left px-5"
                      placeholder="Start a post, try writing with AI"
                      value=""
                      readOnly
                      onClick={() => document.getElementById('post-textarea')?.focus()}
                    />
                  </div>
                </div>

                {/* Actual Input Area (expands when active or just show always? LinkedIn shows modal, we will show inline for now) */}
                <div className="px-2">
                  <textarea
                    id="post-textarea"
                    className="w-full p-2 border-none focus:ring-0 resize-none text-gray-900 text-sm placeholder:text-gray-500 min-h-[50px] outline-none"
                    placeholder="What do you want to talk about?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={2}
                  />
                  {previewUrl && (
                    <div className="relative mb-4 mt-2">
                      <img src={previewUrl} className="max-h-60 rounded-lg border border-gray-200" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full"
                        onClick={cancelImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-medium text-gray-500">Media</span>
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100">
                      <Briefcase className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="font-medium text-gray-500">Job</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 hidden sm:flex">
                      <MessageCircle className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="font-medium text-gray-500">Article</span>
                    </Button>
                  </div>
                  <Button
                    onClick={createPost}
                    disabled={(!newPostContent.trim() && !imageFile) || posting}
                    className="rounded-full px-6 font-semibold"
                  >
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between px-2 mb-2">
              <div className="h-[1px] bg-gray-300 flex-1"></div>
              <div className="flex gap-1 ml-4 text-xs font-medium text-gray-500">
                <span>Sort by:</span>
                <button
                  onClick={() => setSortBy('top')}
                  className={`${sortBy === 'top' ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Top
                </button>
                <span>|</span>
                <button
                  onClick={() => setSortBy('recent')}
                  className={`${sortBy === 'recent' ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Recent
                </button>
              </div>
            </div>

            {/* Posts List */}
            {sortedPosts.map((post, index) => (
              <ScrollAnimate key={post.id} animation="fadeInUp" delay={index * 50} triggerOnce={true}>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
                  <PostCard
                    post={post}
                    currentUserId={currentUserId || ''}
                    onLike={() => toggleLike(post.id)}
                    onComment={() => setExpandedComments(prev => {
                      const newSet = new Set(prev)
                      if (newSet.has(post.id)) newSet.delete(post.id)
                      else newSet.add(post.id)
                      return newSet
                    })}
                    formatTime={formatTime}
                    onShare={() => {
                      navigator.clipboard.writeText(window.location.href)
                      alert("Link copied!")
                    }}
                  />

                  <PostComments
                    postId={post.id}
                    showComments={expandedComments.has(post.id)}
                    commentContent={commentContent[post.id] || ''}
                    onCommentChange={(v) => setCommentContent(prev => ({ ...prev, [post.id]: v }))}
                    onAddComment={() => addComment(post.id)}
                    formatTime={formatTime}
                  />
                </div>
              </ScrollAnimate>
            ))}
          </div>

          {/* Right Sidebar - News */}
          <div className="hidden lg:block lg:col-span-3">
            <NewsWidget />
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Rezzy Corporation © 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
