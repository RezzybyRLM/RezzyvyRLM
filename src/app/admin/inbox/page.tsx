'use client'

import { useState, useEffect } from 'react'
import { getContactMessages, updateContactMessageStatus } from '@/lib/contact/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Mail, Eye, Reply, Archive, User, Calendar, MessageSquare } from 'lucide-react'
import { canManageRoles } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/client'

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
    const statusConfig = {
      new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
      read: { color: 'bg-yellow-100 text-yellow-800', label: 'Read' },
      replied: { color: 'bg-green-100 text-green-800', label: 'Replied' },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <LoadingSpinner size="sm" />
        Loading messages…
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">Contact form submissions</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="glass-card border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total</p>
              <p className="text-xl font-semibold tabular-nums">{contactMessages.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">New</p>
              <p className="text-xl font-semibold tabular-nums">
                {contactMessages.filter(m => m.status === 'new').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Eye className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Read</p>
              <p className="text-xl font-semibold tabular-nums">
                {contactMessages.filter(m => m.status === 'read').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Reply className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Replied</p>
              <p className="text-xl font-semibold tabular-nums">
                {contactMessages.filter(m => m.status === 'replied').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Mail className="h-5 w-5" />
            Messages
            {isSuperAdmin && (
              <Badge variant="secondary" className="font-normal">
                Super admin summaries use AI from the API route
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contactMessages.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            <div className="space-y-4">
              {contactMessages.map(message => (
                <div
                  key={message.id}
                  className="rounded-lg border border-[hsl(var(--glass-border))] bg-white/50 p-5"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{message.name}</h3>
                        <p className="text-sm text-muted-foreground">{message.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(message.status)}
                      <span className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="mr-1 h-3.5 w-3.5" />
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  </div>
                  {message.subject ? (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium">Subject</h4>
                      <p className="text-sm text-muted-foreground">{message.subject}</p>
                    </div>
                  ) : null}
                  <div className="mb-4">
                    <h4 className="mb-1 text-sm font-medium">Message</h4>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(message.id, 'replied')}
                      disabled={updating === message.id || message.status === 'replied'}
                    >
                      <Reply className="mr-1 h-4 w-4" />
                      Replied
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
        </CardContent>
      </Card>
    </div>
  )
}
