'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, User, Loader2, MessageSquare, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

interface NewConversationDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function NewConversationDialog({ isOpen, onClose }: NewConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (isOpen && searchQuery.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery.trim())
      }, 300) // Debounce search

      return () => clearTimeout(timeoutId)
    } else {
      setUsers([])
    }
  }, [searchQuery, isOpen])

  const searchUsers = async (query: string) => {
    setLoading(true)
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !currentUser) {
        console.error('Authentication error:', authError)
        setUsers([])
        return
      }

      console.log('Searching for users with query:', query)
      console.log('Current user ID:', currentUser.id)

      // Search users by name or email (case-insensitive)
      // Use separate queries and combine results for better reliability
      const searchPattern = `%${query}%`
      
      // Search by name (only if full_name is not null)
      const nameResult = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .not('full_name', 'is', null)
        .ilike('full_name', searchPattern)
        .neq('id', currentUser.id)
        .limit(20)

      // Search by email
      const emailResult = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .ilike('email', searchPattern)
        .neq('id', currentUser.id)
        .limit(20)

      console.log('Name search result:', nameResult)
      console.log('Email search result:', emailResult)

      if (nameResult.error) {
        console.error('Error searching by name:', nameResult.error)
      }
      if (emailResult.error) {
        console.error('Error searching by email:', emailResult.error)
      }

      // Combine results and remove duplicates
      const combined = [
        ...(nameResult.data || []),
        ...(emailResult.data || [])
      ]
      
      const uniqueUsers = combined.filter((user, index, self) => 
        index === self.findIndex((u) => u.id === user.id)
      )

      // Sort by full_name
      uniqueUsers.sort((a, b) => {
        const nameA = a.full_name || a.email || ''
        const nameB = b.full_name || b.email || ''
        return nameA.localeCompare(nameB)
      })

      console.log('Final users found:', uniqueUsers.length, uniqueUsers)
      setUsers(uniqueUsers)
    } catch (error) {
      console.error('Error searching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const startConversation = async (recipientId: string) => {
    setStarting(recipientId)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Authentication error:', authError)
        alert('Please sign in to start a conversation')
        return
      }

      // Check if conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${recipientId}),and(participant1_id.eq.${recipientId},participant2_id.eq.${user.id})`)
        .limit(1)

      if (fetchError) {
        console.error('Error fetching existing conversation:', fetchError)
        throw fetchError
      }

      let conversationId: string

      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            participant1_id: user.id,
            participant2_id: recipientId,
          })
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
          throw createError
        }
        
        if (!newConversation) {
          throw new Error('Failed to create conversation')
        }

        conversationId = newConversation.id
      }

      // Navigate to conversation
      router.push(`/messages?conversation=${conversationId}`)
      onClose()
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to start conversation. Please try again.')
    } finally {
      setStarting(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto bg-white" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Start New Conversation</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Search for a user by name or email to start a conversation
          </p>
        </CardHeader>
        <CardContent className="p-6">

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!pl-12 !pr-4"
              autoFocus
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && searchQuery.trim().length > 0 && users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No users found</p>
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startConversation(user.id)}
                  disabled={starting === user.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || user.email}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {user.full_name || user.email.split('@')[0]}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  {starting === user.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          )}

          {!loading && searchQuery.trim().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>Start typing to search for users</p>
            </div>
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  )
}

