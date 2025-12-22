'use client'

import { useState, useEffect } from 'react'
// Using Card instead of Dialog for now
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Search, UserPlus, X, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface User {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

interface NewGroupDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (conversationId: string) => void
}

export function NewGroupDialog({ isOpen, onClose, onSuccess }: NewGroupDialogProps) {
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && searchQuery.length > 0) {
      searchUsers()
    } else {
      setUsers([])
    }
  }, [searchQuery, isOpen])

  const searchUsers = async () => {
    setLoading(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      const searchPattern = `%${searchQuery}%`

      const nameResult = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .ilike('full_name', searchPattern)
        .neq('id', currentUser.id)
        .limit(20)

      const emailResult = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .ilike('email', searchPattern)
        .neq('id', currentUser.id)
        .limit(20)

      const combined = [
        ...(nameResult.data || []),
        ...(emailResult.data || [])
      ]

      const uniqueUsers = combined.filter((user, index, self) =>
        index === self.findIndex((u) => u.id === user.id)
      )

      uniqueUsers.sort((a, b) => {
        const nameA = (a.full_name || a.email || '').toLowerCase()
        const nameB = (b.full_name || b.email || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })

      setUsers(uniqueUsers)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
      setSearchQuery('')
      setUsers([])
    }
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert('Please provide a group name and select at least one member')
      return
    }

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let avatarUrl = null
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `group_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, imageFile)

        if (uploadError) {
          console.error('Error uploading group avatar:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)
          avatarUrl = publicUrl
        }
      }

      // Create group conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          created_by: user.id,
          avatar_url: avatarUrl
        })
        .select()
        .single()

      if (convError) throw convError

      // Add creator as admin
      await supabase
        .from('group_members')
        .insert({
          conversation_id: conversation.id,
          user_id: user.id,
          role: 'admin'
        })

      // Add selected members
      if (selectedUsers.length > 0) {
        await supabase
          .from('group_members')
          .insert(
            selectedUsers.map(u => ({
              conversation_id: conversation.id,
              user_id: u.id,
              role: 'member'
            }))
          )
      }

      // Send system message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: `Group "${groupName}" created. ${selectedUsers.length} member${selectedUsers.length !== 1 ? 's' : ''} added.`,
          message_type: 'system'
        })

      onSuccess(conversation.id)
      setGroupName('')
      setGroupDescription('')
      setImageFile(null)
      setPreviewUrl(null)
      setSelectedUsers([])
      onClose()
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>Create Group Chat</CardTitle>
          <CardDescription>
            Create a group chat and add members
          </CardDescription>
        </CardHeader>
        <CardContent>

          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary transition-colors"
                  onClick={() => document.getElementById('group-avatar-upload')?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <UserPlus className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-[10px] text-gray-500">Upload PFP</span>
                    </div>
                  )}
                </div>
                <input
                  id="group-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setImageFile(file)
                      setPreviewUrl(URL.createObjectURL(file))
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="groupDescription">Description (Optional)</Label>
              <Textarea
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label>Add Members *</Label>
              <div className="mt-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name or email"
                  className="pl-10"
                />
              </div>

              {searchQuery && (
                <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No users found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {users
                        .filter(u => !selectedUsers.find(su => su.id === u.id))
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => addUser(user)}
                            className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Avatar>
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name || 'User'} />
                              ) : (
                                <AvatarFallback>
                                  {(user.full_name || user.email.split('@')[0])?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {user.full_name || user.email.split('@')[0]}
                              </div>
                              <div className="text-sm text-gray-500 truncate">{user.email}</div>
                            </div>
                            <UserPlus className="h-4 w-4 text-gray-400" />
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div>
                <Label>Selected Members ({selectedUsers.length})</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full"
                    >
                      <Avatar className="h-6 w-6">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name || 'User'} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {(user.full_name || user.email.split('@')[0])?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm">
                        {user.full_name || user.email.split('@')[0]}
                      </span>
                      <button
                        onClick={() => removeUser(user.id)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={createGroup} disabled={creating || !groupName.trim() || selectedUsers.length === 0}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

