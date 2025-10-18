'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getContactMessages, updateContactMessageStatus } from '@/lib/contact/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Mail, 
  Eye, 
  Reply, 
  Archive, 
  User, 
  Calendar, 
  MessageSquare,
  Shield,
  AlertCircle
} from 'lucide-react'

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

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userData || userData.role !== 'admin') {
        router.push('/')
        return
      }

      setIsAdmin(true)
      await fetchContactMessages()
    }

    checkUser()
  }, [router, supabase.auth])

  const fetchContactMessages = async () => {
    try {
      const messages = await getContactMessages()
      setContactMessages(messages)
    } catch (error) {
      console.error('Failed to fetch contact messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (messageId: string, newStatus: string) => {
    setUpdating(messageId)
    try {
      await updateContactMessageStatus(messageId, newStatus)
      await fetchContactMessages() // Refresh the list
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
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Manage contact messages and system settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800">
                Admin Access
              </Badge>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
              >
                Back to Site
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{contactMessages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Messages</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contactMessages.filter(m => m.status === 'new').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Read Messages</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contactMessages.filter(m => m.status === 'read').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Reply className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Replied</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contactMessages.filter(m => m.status === 'replied').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Contact Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contactMessages.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600">Contact form submissions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contactMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{message.name}</h3>
                          <p className="text-sm text-gray-600">{message.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(message.status)}
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(message.created_at)}
                        </div>
                      </div>
                    </div>

                    {message.subject && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900">Subject:</h4>
                        <p className="text-gray-700">{message.subject}</p>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(message.id, 'read')}
                        disabled={updating === message.id || message.status === 'read'}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Mark as Read
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(message.id, 'replied')}
                        disabled={updating === message.id || message.status === 'replied'}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Mark as Replied
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(message.id, 'archived')}
                        disabled={updating === message.id || message.status === 'archived'}
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                      {updating === message.id && (
                        <LoadingSpinner size="sm" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
