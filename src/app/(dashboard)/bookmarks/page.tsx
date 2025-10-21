'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bookmark,
  MapPin,
  DollarSign,
  ExternalLink,
  Loader2,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime, formatSalary } from '@/lib/utils'

interface BookmarkedJob {
  id: string
  job_id: string | null
  job_snapshot: any
  source: string
  created_at: string
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedJob[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setBookmarks(data || [])
      } catch (error) {
        console.error('Error fetching bookmarks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarks()
  }, [router, supabase])

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)

      if (error) throw error

      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId))
    } catch (error) {
      console.error('Error removing bookmark:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bookmark className="h-8 w-8 mr-3 text-primary" />
            My Bookmarks
          </h1>
          <p className="text-gray-600 mt-2">
            {bookmarks.length} {bookmarks.length === 1 ? 'job saved' : 'jobs saved'}
          </p>
        </div>

        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No bookmarks yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start saving jobs that interest you to view them here.
              </p>
              <Button asChild>
                <Link href="/jobs">
                  Browse Jobs
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => {
              const job = bookmark.job_snapshot
              return (
                <Card key={bookmark.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {job?.title || 'Job Title'}
                            </h3>
                            <p className="text-lg text-gray-700">
                              {job?.company_name || 'Company Name'}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-4">
                            {bookmark.source}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                          {job?.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                          )}
                          {job?.salary_range && (
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatSalary(job.salary_range)}
                            </div>
                          )}
                          {job?.job_type && (
                            <Badge variant="secondary">{job.job_type}</Badge>
                          )}
                        </div>

                        {job?.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {job.description.substring(0, 200)}...
                          </p>
                        )}

                        <div className="flex items-center gap-3">
                          {job?.apply_url && (
                            <Button size="sm" asChild>
                              <a 
                                href={job.apply_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                Apply Now
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveBookmark(bookmark.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                          Saved {formatRelativeTime(bookmark.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

