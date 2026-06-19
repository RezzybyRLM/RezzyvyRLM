'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { resolveSessionUser } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import {
  Bookmark,
  MapPin,
  DollarSign,
  ExternalLink,
  Loader2,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatRelativeTime, formatSalary, cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

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
  const supabase = createClient()

  useEffect(() => {
    const fetchBookmarks = async () => {
      const user = await resolveSessionUser(supabase)
      if (!user) {
        // Middleware gates this route; a null here is a transient race. Don't
        // self-redirect to login (it loops). Just stop loading.
        setLoading(false)
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
  }, [supabase])

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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="space-y-6"
    >
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.1] via-white to-white p-6 shadow-card">
        <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Bookmark className="h-3 w-3" /> Saved
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">My bookmarks</h1>
        <p className="mt-1 text-sm text-text/55">
          {bookmarks.length} {bookmarks.length === 1 ? 'job saved' : 'jobs saved'} — revisit them anytime.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bookmark className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-text">No bookmarks yet</h3>
          <p className="mb-4 text-sm text-text/55">Start saving jobs that interest you to view them here.</p>
          <Button asChild className="bg-primary text-white hover:bg-primary-600">
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {bookmarks.map((bookmark, i) => {
            const job = bookmark.job_snapshot
            return (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut, delay: Math.min(i * 0.04, 0.3) }}
                className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-text">{job?.title || 'Job title'}</h3>
                    <p className="truncate text-sm text-text/60">{job?.company_name || 'Company'}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-medium capitalize text-secondary">
                    {bookmark.source}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text/55">
                  {job?.location && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                  )}
                  {job?.salary_range && (
                    <span className="inline-flex items-center gap-1"><DollarSign className="h-4 w-4" />{formatSalary(job.salary_range)}</span>
                  )}
                  {job?.job_type && (
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-text/60">{job.job_type}</span>
                  )}
                </div>

                {job?.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-text/55">
                    {job.description.substring(0, 200)}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-4">
                  {job?.apply_url && (
                    <Button size="sm" className="bg-primary text-white hover:bg-primary-600" asChild>
                      <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                        Apply now
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveBookmark(bookmark.id)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text/50 transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>

                <p className={cn('mt-3 text-xs text-text/45')}>Saved {formatRelativeTime(bookmark.created_at)}</p>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
