'use client'

import { useState, useEffect } from 'react'
import { getContactMessages, updateContactMessageStatus } from '@/lib/contact/actions'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Mail, Eye, Reply, Archive, User, Calendar, MessageSquare } from 'lucide-react'
import { canManageRoles } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
  updated_at: string
}

const STATUS_META: Record<string, { label: string; chip: string }> = {
  new: { label: 'New', chip: 'bg-primary-600/10 text-primary-700' },
  read: { label: 'Read', chip: 'bg-secondary/10 text-secondary' },
  replied: { label: 'Replied', chip: 'bg-success/10 text-success' },
  archived: { label: 'Archived', chip: 'bg-gray-100 text-gray-500' },
}

export default function AdminInboxPage() {
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: row } = await supabase.from('users').select('role').eq('id', user.id).single()
        setIsSuperAdmin(canManageRoles(row?.role ?? null))
      }
    })()
  }, [supabase])

  const fetchContactMessages = async () => {
    try {
      const messages = await getContactMessages()
      setContactMessages(messages as ContactMessage[])
    } catch (error) {
      console.error('Failed to fetch contact messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContactMessages()
  }, [])

  const handleStatusUpdate = async (messageId: string, newStatus: string) => {
    setUpdating(messageId)
    try {
      await updateContactMessageStatus(messageId, newStatus)
      await fetchContactMessages()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_META[status] || STATUS_META.new
    return <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', config.chip)}>{config.label}</span>
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  // Open the admin's mail client prefilled to reply to the sender.
  const buildReplyHref = (m: ContactMessage) => {
    const subject = m.subject ? `Re: ${m.subject}` : 'Re: your message to Rezzy'
    const body = `\n\n\n———\nOn ${formatDate(m.created_at)}, ${m.name} <${m.email}> wrote:\n${m.message}`
    return `mailto:${m.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-gray-500">
        <LoadingSpinner size="sm" />
        Loading messages…
      </div>
    )
  }

  const stats = [
    { label: 'Total', value: contactMessages.length, icon: Mail, tint: 'bg-primary-600/10 text-primary-600' },
    { label: 'New', value: contactMessages.filter(m => m.status === 'new').length, icon: MessageSquare, tint: 'bg-primary-600/10 text-primary-600' },
    { label: 'Read', value: contactMessages.filter(m => m.status === 'read').length, icon: Eye, tint: 'bg-secondary/10 text-secondary' },
    { label: 'Replied', value: contactMessages.filter(m => m.status === 'replied').length, icon: Reply, tint: 'bg-success/10 text-success' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Mission control</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">Inbox</h1>
        <p className="mt-1 text-sm text-gray-500">
          Contact form submissions. &ldquo;Reply by email&rdquo; opens your mail app prefilled to the sender.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-4 shadow-sm">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', s.tint)}>
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums text-gray-900">{s.value}</p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-4">
          <Mail className="h-5 w-5 text-primary-600" />
          <p className="text-sm font-semibold text-gray-900">Messages</p>
          {isSuperAdmin && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              Super admin summaries use AI from the API route
            </span>
          )}
        </div>
        <div className="p-4">
          {contactMessages.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {contactMessages.map(message => (
                <div key={message.id} className="rounded-xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                        <User className="h-4 w-4 text-gray-500" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{message.name}</h3>
                        <p className="text-sm text-gray-500">{message.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(message.status)}
                      <span className="flex items-center text-xs text-gray-400">
                        <Calendar className="mr-1 h-3.5 w-3.5" />
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  </div>
                  {message.subject ? (
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Subject</p>
                      <p className="text-sm text-gray-700">{message.subject}</p>
                    </div>
                  ) : null}
                  <div className="mb-4 rounded-lg bg-gray-50 p-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{message.message}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(message.id, 'read')}
                      disabled={updating === message.id || message.status === 'read'}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Read
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="bg-primary-600 text-white hover:bg-primary-700"
                      onClick={() => {
                        if (message.status !== 'replied') void handleStatusUpdate(message.id, 'replied')
                      }}
                    >
                      <a href={buildReplyHref(message)}>
                        <Reply className="mr-1 h-4 w-4" />
                        Reply by email
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(message.id, 'archived')}
                      disabled={updating === message.id || message.status === 'archived'}
                    >
                      <Archive className="mr-1 h-4 w-4" />
                      Archive
                    </Button>
                    {updating === message.id ? <LoadingSpinner size="sm" /> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
