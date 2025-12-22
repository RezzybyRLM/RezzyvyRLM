'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import {
    Users,
    Settings,
    UserPlus,
    LogOut,
    Trash2,
    X,
    Loader2,
    Camera,
    MoreVertical,
    ShieldAlert,
    Shield
} from 'lucide-react'

interface User {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
}

interface GroupMember {
    id: string
    user_id: string
    role: 'admin' | 'member'
    user: User
}

interface GroupInfoDialogProps {
    conversationId: string
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void // Trigger refresh in parent
}

export function GroupInfoDialog({ conversationId, isOpen, onClose, onUpdate }: GroupInfoDialogProps) {
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [group, setGroup] = useState<any>(null)
    const [members, setMembers] = useState<GroupMember[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    // Edit State
    const [isEditing, setIsEditing] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [groupDescription, setGroupDescription] = useState('')
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Add Member State
    const [isAddingMembers, setIsAddingMembers] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<User[]>([])
    const [searchLoading, setSearchLoading] = useState(false)

    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen && conversationId) {
            loadGroupDetails()
        }
    }, [isOpen, conversationId])

    useEffect(() => {
        if (searchQuery.length > 0) {
            searchUsers()
        } else {
            setSearchResults([])
        }
    }, [searchQuery])

    const loadGroupDetails = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUser(user)

            // Fetch Group Info
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single()

            if (convError) throw convError
            setGroup(conv)
            setGroupName(conv.name)
            setGroupDescription(conv.description || '')
            setPreviewAvatar(conv.avatar_url)

            // Fetch Members
            const { data: memberData, error: membError } = await supabase
                .from('group_members')
                .select(`
          *,
          user:users (id, full_name, email, avatar_url)
        `)
                .eq('conversation_id', conversationId)

            if (membError) throw membError

            const formattedMembers = memberData as unknown as GroupMember[]
            setMembers(formattedMembers)

            // Check Admin Status
            const currentMember = formattedMembers.find(m => m.user_id === user.id)
            setIsAdmin(currentMember?.role === 'admin') // Only 'admin' role has privileges (checks logic in RLS too)

        } catch (error) {
            console.error('Error loading group details:', error)
        } finally {
            setLoading(false)
        }
    }

    const searchUsers = async () => {
        setSearchLoading(true)
        try {
            const searchPattern = `%${searchQuery}%`
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, email, avatar_url')
                .or(`full_name.ilike.${searchPattern},email.ilike.${searchPattern}`)
                .limit(10)

            if (error) throw error

            // Filter out existing members
            const existingIds = new Set(members.map(m => m.user_id))
            setSearchResults((data || []).filter(u => !existingIds.has(u.id)))

        } catch (error) {
            console.error(error)
        } finally {
            setSearchLoading(false)
        }
    }

    const handleSaveGroup = async () => {
        setSaving(true)
        try {
            let avatarUrl = group.avatar_url

            if (newAvatarFile) {
                const fileExt = newAvatarFile.name.split('.').pop()
                const fileName = `group_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
                const filePath = `avatars/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, newAvatarFile)

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath)
                    avatarUrl = publicUrl
                }
            }

            const { error } = await supabase
                .from('conversations')
                .update({
                    name: groupName,
                    description: groupDescription,
                    avatar_url: avatarUrl
                })
                .eq('id', conversationId)

            if (error) throw error

            setIsEditing(false)
            loadGroupDetails()
            onUpdate()
        } catch (error) {
            console.error('Failed to update group:', error)
            alert('Failed to update group information')
        } finally {
            setSaving(false)
        }
    }

    const handleAddMember = async (user: User) => {
        try {
            const { error } = await supabase
                .from('group_members')
                .insert({
                    conversation_id: conversationId,
                    user_id: user.id,
                    role: 'member'
                })

            if (error) throw error

            // System message
            await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: `added ${user.full_name || user.email}`,
                message_type: 'system'
            })

            loadGroupDetails()
            setSearchResults(prev => prev.filter(u => u.id !== user.id))
        } catch (error) {
            console.error('Error adding member:', error)
            alert('Failed to add member')
        }
    }

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!confirm(`Are you sure you want to remove ${memberName}?`)) return

        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('id', memberId) // Using row ID of group_members

            if (error) throw error

            // System message
            await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: `removed ${memberName}`,
                message_type: 'system'
            })

            loadGroupDetails()
        } catch (error) {
            console.error('Error removing member:', error)
        }
    }

    const handleLeaveGroup = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return

        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('conversation_id', conversationId)
                .eq('user_id', currentUser.id)

            if (error) throw error

            // System message
            await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: `left the group`,
                message_type: 'system'
            })

            onClose()
            window.location.reload() // Force reload to update list
        } catch (error) {
            console.error('Error leaving group:', error)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto m-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        <CardHeader className="relative pb-0">
                            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>

                            {isEditing ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <Avatar className="w-24 h-24 border-4 border-white shadow-sm">
                                            {previewAvatar ? (
                                                <img src={previewAvatar} alt="Group" className="object-cover w-full h-full" />
                                            ) : (
                                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                                    {groupName.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="h-6 w-6 text-white" />
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0]
                                                if (f) {
                                                    setNewAvatarFile(f)
                                                    setPreviewAvatar(URL.createObjectURL(f))
                                                }
                                            }}
                                        />
                                    </div>
                                    <Input
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="text-center font-bold text-lg"
                                        placeholder="Group Name"
                                    />
                                    <Textarea
                                        value={groupDescription}
                                        onChange={(e) => setGroupDescription(e.target.value)}
                                        placeholder="Description"
                                        className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setPreviewAvatar(group.avatar_url); }}>Cancel</Button>
                                        <Button size="sm" onClick={handleSaveGroup} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center space-y-2">
                                    <Avatar className="w-24 h-24 border-4 border-white shadow-sm">
                                        {group.avatar_url ? (
                                            <img src={group.avatar_url} alt={group.name} className="object-cover w-full h-full" />
                                        ) : (
                                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                                {group.name?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <CardTitle className="text-center text-xl">{group.name}</CardTitle>
                                    {group.description && <p className="text-sm text-gray-500 text-center">{group.description}</p>}

                                    {isAdmin && (
                                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => setIsEditing(true)}>
                                            <Settings className="h-4 w-4 mr-1" /> Edit Group Info
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardHeader>

                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Members ({members.length})
                                </h3>
                                {isAdmin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsAddingMembers(!isAddingMembers)}
                                        className={isAddingMembers ? 'bg-gray-100' : ''}
                                    >
                                        <UserPlus className="h-4 w-4 mr-1" /> Add Member
                                    </Button>
                                )}
                            </div>

                            {isAddingMembers && (
                                <div className="mb-4 bg-gray-50 p-3 rounded-lg border">
                                    <Input
                                        placeholder="Search people to add..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="mb-2 bg-white"
                                    />
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {searchLoading && <p className="text-xs text-center text-gray-400">Searching...</p>}
                                        {searchResults.map(user => (
                                            <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleAddMember(user)}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <img src={user.avatar_url || ''} />
                                                        <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{user.full_name || user.email}</span>
                                                </div>
                                                <UserPlus className="h-3 w-3 text-blue-500" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                {member.user.avatar_url ? (
                                                    <img src={member.user.avatar_url} alt={member.user.full_name || ''} />
                                                ) : (
                                                    <AvatarFallback>{(member.user.full_name || member.user.email)[0]}</AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-sm text-gray-900">
                                                    {member.user.full_name || member.user.email}
                                                    {member.user_id === currentUser.id && <span className="text-gray-400 ml-1">(You)</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    {member.role === 'admin' ? (
                                                        <span className="text-blue-600 font-semibold flex items-center">
                                                            <Shield className="h-3 w-3 mr-0.5" /> Group Admin
                                                        </span>
                                                    ) : (
                                                        <span>Member</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && member.user_id !== currentUser.id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveMember(member.id, member.user.full_name || member.user.email)}
                                                title="Remove from group"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-4 border-t">
                                <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLeaveGroup}>
                                    <LogOut className="h-4 w-4 mr-2" /> Leave Group
                                </Button>
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    )
}
