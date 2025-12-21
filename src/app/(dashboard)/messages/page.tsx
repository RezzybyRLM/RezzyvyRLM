'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send, 
  Search, 
  User, 
  Loader2,
  Clock,
  Check,
  CheckCheck,
  Phone,
  Image as ImageIcon,
  X,
  Reply
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MessageBubble } from '@/components/ui/message-bubble'
import { TypingIndicator } from '@/components/ui/typing-indicator'
import { NewConversationDialog } from '@/components/ui/new-conversation-dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollAnimate } from '@/components/ui/scroll-animate'
import { formatTime } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Conversation {
  id: string
  participant1_id: string
  participant2_id: string
  last_message_at: string
  other_user: {
    id: string
    full_name: string | null
    email: string
    phone_number?: string | null
    avatar_url?: string | null
  }
  last_message: {
    content: string
    sender_id: string
    created_at: string
    is_read: boolean
  } | null
  unread_count: number
}

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  reply_to_message_id?: string | null
  attachment_url?: string | null
  attachment_type?: string | null
  is_edited?: boolean
  edited_at?: string | null
  sender: {
    full_name: string | null
    email: string
    phone_number?: string | null
  }
  reply_to?: {
    id: string
    content: string
    sender: {
      full_name: string | null
      email: string
    }
  } | null
  attachments?: Array<{
    id: string
    file_url: string
    file_type: string
    file_name: string
  }>
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null)
  const [forwardingToConversation, setForwardingToConversation] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    let mounted = true
    let conversationsChannel: any = null

    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      if (!mounted) return
      
      setCurrentUserId(user.id)
      await fetchConversations()
      
      // After conversations are loaded, check if there's a conversation ID in URL
      const conversationId = searchParams.get('conversation')
      if (conversationId && mounted) {
        // Verify conversation exists or wait a bit for it to appear
        const checkAndSetConversation = () => {
          if (mounted) {
            setSelectedConversation(conversationId)
          }
        }
        // Small delay to ensure state is updated
        setTimeout(checkAndSetConversation, 200)
      }

      // Set up realtime subscription for conversations list
      if (mounted) {
        conversationsChannel = supabase
          .channel('conversations_list')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `participant1_id=eq.${user.id}`
          }, () => {
            if (mounted) fetchConversations()
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `participant2_id=eq.${user.id}`
          }, () => {
            if (mounted) fetchConversations()
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages'
          }, () => {
            if (mounted) fetchConversations()
          })
          .subscribe()
      }
    }

    initialize()

    return () => {
      mounted = false
      if (conversationsChannel) {
        supabase.removeChannel(conversationsChannel)
      }
    }
  }, [router, supabase])

  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    if (conversationId && !loading) {
      // Set selected conversation immediately if it's in the URL
      if (selectedConversation !== conversationId) {
        setSelectedConversation(conversationId)
      }
      
      // Check if conversation exists in list, if not it will be fetched by the other useEffect
      const conversationExists = conversations.some(c => c.id === conversationId)
      if (!conversationExists && conversations.length > 0) {
        // Conversation not in list, it will be fetched by the fetchMissingConversation effect
        console.log('Conversation not in list, will be fetched:', conversationId)
      }
    } else if (!conversationId && selectedConversation) {
      // No conversation in URL, clear selection
      setSelectedConversation(null)
    }
  }, [searchParams, loading])

  useEffect(() => {
    if (!selectedConversation || !currentUserId) return

    let mounted = true
    let messagesChannel: any = null
    let typingChannel: any = null

    const setupRealtime = async () => {
      // Fetch initial messages
      await fetchMessages(selectedConversation)
      
      // Set up realtime subscription for messages
      messagesChannel = supabase
        .channel(`messages:${selectedConversation}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`
        }, async (payload) => {
          if (!mounted) return
          await fetchMessages(selectedConversation)
          await fetchConversations()
          
          // Mark as read if it's not from current user
          const { data: { user } } = await supabase.auth.getUser()
          if (user && payload.new && (payload.new as any).sender_id !== user.id) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', payload.new.id)
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`
        }, () => {
          if (mounted) {
            fetchMessages(selectedConversation)
            fetchConversations()
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'message_attachments',
          filter: `message_id=in.(${selectedConversation})`
        }, () => {
          if (mounted) fetchMessages(selectedConversation)
        })
        .subscribe()

      // Set up typing indicator subscription
      typingChannel = supabase
        .channel(`typing:${selectedConversation}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${selectedConversation}`
        }, async (payload) => {
          if (!mounted) return
          const { data: { user } } = await supabase.auth.getUser()
          if (user && payload.new && (payload.new as any).user_id !== user.id) {
            setOtherUserTyping((payload.new as any).is_typing || false)
            
            // Auto-hide typing indicator after 3 seconds
            if ((payload.new as any).is_typing) {
              setTimeout(() => {
                if (mounted) setOtherUserTyping(false)
              }, 3000)
            }
          }
        })
        .subscribe()

      // Set up conversation updates subscription
      const conversationChannel = supabase
        .channel(`conversation:${selectedConversation}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${selectedConversation}`
        }, () => {
          if (mounted) {
            fetchConversations()
          }
        })
        .subscribe()

      return () => {
        if (messagesChannel) supabase.removeChannel(messagesChannel)
        if (typingChannel) supabase.removeChannel(typingChannel)
        if (conversationChannel) supabase.removeChannel(conversationChannel)
      }
    }

    setupRealtime()

    return () => {
      mounted = false
      if (messagesChannel) supabase.removeChannel(messagesChannel)
      if (typingChannel) supabase.removeChannel(typingChannel)
    }
  }, [selectedConversation, currentUserId, supabase])

  // Fetch conversation details if it's not in the list yet (newly created)
  useEffect(() => {
    if (selectedConversation && !loading && currentUserId) {
      const conv = conversations.find(c => c.id === selectedConversation)
      if (!conv) {
        // Conversation not in list, fetch it directly and refresh list
        const fetchMissingConversation = async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          
          try {
            const { data: convData, error } = await supabase
              .from('conversations')
              .select(`
                *,
                participant1:users!conversations_participant1_id_fkey(id, full_name, email, phone_number, avatar_url),
                participant2:users!conversations_participant2_id_fkey(id, full_name, email, phone_number, avatar_url)
              `)
              .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
              .eq('id', selectedConversation)
              .single()
            
            if (error) {
              console.error('Error fetching missing conversation:', error)
              return
            }
            
            if (convData) {
              // Format the conversation and add it to the list
              const otherUser = convData.participant1_id === user.id 
                ? convData.participant2 
                : convData.participant1
              
              // Get last message
              const { data: lastMsg } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', convData.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
              
              // Get unread count
              const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', convData.id)
                .eq('is_read', false)
                .neq('sender_id', user.id)
              
              const formattedConv = {
                id: convData.id,
                participant1_id: convData.participant1_id,
                participant2_id: convData.participant2_id,
                last_message_at: convData.last_message_at,
                other_user: {
                  id: otherUser.id,
                  full_name: otherUser.full_name,
                  email: otherUser.email,
                  phone_number: otherUser.phone_number || null,
                  avatar_url: otherUser.avatar_url || null
                },
                last_message: lastMsg || null,
                unread_count: count || 0
              }
              
              // Add to conversations list
              setConversations(prev => {
                const exists = prev.find(c => c.id === formattedConv.id)
                if (exists) return prev
                return [formattedConv, ...prev]
              })
              
              // Also fetch messages for this conversation
              await fetchMessages(selectedConversation)
            }
          } catch (err) {
            console.error('Error in fetchMissingConversation:', err)
          }
        }
        fetchMissingConversation()
      } else if (conv) {
        // Conversation is in list, just fetch messages
        fetchMessages(selectedConversation)
      }
    }
  }, [selectedConversation, conversations, loading, currentUserId, supabase])

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:users!conversations_participant1_id_fkey(id, full_name, email, phone_number, avatar_url),
          participant2:users!conversations_participant2_id_fkey(id, full_name, email, phone_number, avatar_url)
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error

      const formattedConversations = (data || []).map((conv: any) => {
        const otherUser = conv.participant1_id === user.id 
          ? conv.participant2 
          : conv.participant1
        
        return {
          id: conv.id,
          participant1_id: conv.participant1_id,
          participant2_id: conv.participant2_id,
          last_message_at: conv.last_message_at,
          other_user: {
            id: otherUser.id,
            full_name: otherUser.full_name,
            email: otherUser.email,
            phone_number: otherUser.phone_number || null,
            avatar_url: otherUser.avatar_url || null
          }
        }
      })

      // Fetch last message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        formattedConversations.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id)

          return {
            ...conv,
            last_message: lastMsg || null,
            unread_count: count || 0
          }
        })
      )

      setConversations(conversationsWithDetails)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, full_name, email, phone_number),
          attachments:message_attachments(id, file_url, file_type, file_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

          // Fetch reply_to messages for messages that have replies
          const messagesWithReplies = await Promise.all(
            (data || []).map(async (msg: any) => {
              let replyTo = null
              if (msg.reply_to_message_id) {
                const { data: replyData } = await supabase
                  .from('messages')
                  .select(`
                    id,
                    content,
                    sender:users!messages_sender_id_fkey(id, full_name, email)
                  `)
                  .eq('id', msg.reply_to_message_id)
                  .single()
                
                if (replyData && replyData.sender) {
                  const sender = Array.isArray(replyData.sender) ? replyData.sender[0] : replyData.sender
                  replyTo = {
                    id: replyData.id,
                    content: replyData.content,
                    sender: {
                      full_name: sender?.full_name || null,
                      email: sender?.email || ''
                    }
                  }
                }
              }

          return {
            id: msg.id,
            sender_id: msg.sender_id,
            content: msg.content,
            is_read: msg.is_read,
            created_at: msg.created_at,
            reply_to_message_id: msg.reply_to_message_id,
            attachment_url: msg.attachment_url,
            attachment_type: msg.attachment_type,
            is_edited: msg.is_edited || false,
            edited_at: msg.edited_at,
            is_deleted: msg.is_deleted || false,
            deleted_at: msg.deleted_at,
            reactions: msg.reactions || {},
            image_caption: msg.image_caption,
            file_caption: msg.file_caption,
            forwarded_from_id: msg.forwarded_from_id,
            read_by: msg.read_by || [],
            sender: {
              full_name: msg.sender.full_name,
              email: msg.sender.email,
              phone_number: msg.sender.phone_number || null
            },
            reply_to: replyTo,
            attachments: msg.attachments || []
          }
        })
      )

      setMessages(messagesWithReplies)

      // Mark messages as read
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('is_read', false)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if ((!messageContent.trim() && !selectedImage) || !selectedConversation) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to send messages')
        return
      }

      // Create message with content (can be used as caption for images)
      const messageData: any = {
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: messageContent.trim() || '',
      }

      if (replyingTo) {
        messageData.reply_to_message_id = replyingTo.id
      }

      // Insert message to database
      const { data: newMessage, error: msgError } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (msgError) {
        console.error('Error creating message:', msgError)
        throw msgError
      }

      // Upload image if selected (image with optional caption)
      if (selectedImage && newMessage) {
        const formData = new FormData()
        formData.append('file', selectedImage)
        formData.append('messageId', newMessage.id)

        const uploadResponse = await fetch('/api/messages/attachments/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json()
          // Update message with attachment URL and caption
          const updateData: any = {
            attachment_url: url,
            attachment_type: selectedImage.type
          }
          
          // If there's content and it's an image, use it as caption
          if (messageContent.trim() && selectedImage.type.startsWith('image/')) {
            updateData.image_caption = messageContent.trim()
            updateData.content = '' // Clear content if it's just a caption
          } else if (messageContent.trim() && !selectedImage.type.startsWith('image/')) {
            updateData.file_caption = messageContent.trim()
            updateData.content = '' // Clear content if it's just a caption
          }

          const { error: updateError } = await supabase
            .from('messages')
            .update(updateData)
            .eq('id', newMessage.id)

          if (updateError) {
            console.error('Error updating message with attachment:', updateError)
          }
        } else {
          console.error('Error uploading attachment')
        }
      }

      // Update conversation last_message_at for both participants
      const { error: convError } = await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation)

      if (convError) {
        console.error('Error updating conversation:', convError)
      }

      // Clear form
      setMessageContent('')
      setReplyingTo(null)
      setForwardingMessage(null)
      setSelectedImage(null)
      setImagePreview(null)

      // Stop typing indicator
      await handleStopTyping()

      // Messages and conversations will update via realtime subscriptions
      // But we also fetch to ensure immediate update on both ends
      await fetchMessages(selectedConversation)
      await fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageRemove = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setReplyingTo(message)
      setForwardingMessage(null)
    }
  }

  const handleForward = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setForwardingMessage(message)
      setReplyingTo(null)
      // Open conversation selector or use current conversation
      // For now, we'll forward to the same conversation with a note
      // In a full implementation, you'd open a dialog to select destination
    }
  }

  const handleReaction = async (messageId: string, reaction: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction })
      })

      if (response.ok) {
        // Refresh messages to show updated reactions
        if (selectedConversation) {
          await fetchMessages(selectedConversation)
        }
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })

      if (response.ok) {
        // Refresh messages to show updated content
        if (selectedConversation) {
          await fetchMessages(selectedConversation)
        }
      }
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/delete`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh messages to show deleted state
        if (selectedConversation) {
          await fetchMessages(selectedConversation)
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const forwardMessage = async () => {
    if (!forwardingMessage || !selectedConversation) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create forwarded message
      const forwardedContent = forwardingMessage.content 
        ? `Forwarded: ${forwardingMessage.content}`
        : 'Forwarded message'

      const messageData: any = {
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: forwardedContent,
      }

      // If forwarding a message with attachments, copy them
      if (forwardingMessage.attachments && forwardingMessage.attachments.length > 0) {
        const { data: newMessage, error: msgError } = await supabase
          .from('messages')
          .insert(messageData)
          .select()
          .single()

        if (msgError) throw msgError

        // Copy attachments
        for (const attachment of forwardingMessage.attachments) {
          await supabase
            .from('message_attachments')
            .insert({
              message_id: newMessage.id,
              file_url: attachment.file_url,
              file_type: attachment.file_type,
              file_name: attachment.file_name,
              file_size: null
            })
        }

        // Update message with attachment URL if it's an image
        const imageAttachment = forwardingMessage.attachments.find(a => a.file_type.startsWith('image/'))
        if (imageAttachment) {
          await supabase
            .from('messages')
            .update({
              attachment_url: imageAttachment.file_url,
              attachment_type: imageAttachment.file_type
            })
            .eq('id', newMessage.id)
        }
      } else if (forwardingMessage.attachment_url) {
        // Handle legacy attachment_url
        messageData.attachment_url = forwardingMessage.attachment_url
        messageData.attachment_type = forwardingMessage.attachment_type

        const { data: newMessage, error: msgError } = await supabase
          .from('messages')
          .insert(messageData)
          .select()
          .single()

        if (msgError) throw msgError
      } else {
        const { data: newMessage, error: msgError } = await supabase
          .from('messages')
          .insert(messageData)
          .select()
          .single()

        if (msgError) throw msgError
      }

      // Update conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation)

      setForwardingMessage(null)
      setForwardingToConversation(null)
      fetchMessages(selectedConversation)
      fetchConversations()
    } catch (error) {
      console.error('Error forwarding message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleTyping = async () => {
    if (!selectedConversation || !currentUserId) return
    
    setIsTyping(true)
    await supabase
      .from('typing_indicators')
      .upsert({
        conversation_id: selectedConversation,
        user_id: currentUserId,
        is_typing: true,
        updated_at: new Date().toISOString()
      })
  }

  const handleStopTyping = async () => {
    if (!selectedConversation || !currentUserId) return
    
    setIsTyping(false)
    await supabase
      .from('typing_indicators')
      .upsert({
        conversation_id: selectedConversation,
        user_id: currentUserId,
        is_typing: false,
        updated_at: new Date().toISOString()
      })
  }


  const filteredConversations = conversations.filter(conv =>
    conv.other_user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Connect and communicate with employers and professionals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="card-professional overflow-hidden">
            <CardHeader className="border-b space-y-3">
              <Button
                onClick={() => setShowNewConversation(true)}
                className="w-full btn-primary"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                New Message
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="!pl-12 !pr-4"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto h-[calc(100vh-20rem)]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No conversations yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start a conversation from a job application or profile</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv, index) => (
                    <ScrollAnimate key={conv.id} animation="slideInLeft" delay={index * 50} triggerOnce={true}>
                      <button
                        onClick={() => {
                          setSelectedConversation(conv.id)
                          // Update URL to reflect selected conversation
                          const params = new URLSearchParams(searchParams.toString())
                          params.set('conversation', conv.id)
                          router.replace(`/messages?${params.toString()}`, { scroll: false })
                        }}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedConversation === conv.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {conv.other_user.avatar_url ? (
                              <img
                                src={conv.other_user.avatar_url}
                                alt={conv.other_user.full_name || 'User'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                {(conv.other_user.full_name || conv.other_user.email.split('@')[0])?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {conv.other_user.full_name || conv.other_user.email.split('@')[0]}
                              </h3>
                              {conv.unread_count > 0 && (
                                <Badge className="bg-primary text-white text-xs">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                            {conv.last_message && (
                              <p className="text-sm text-gray-600 truncate">
                                {conv.last_message.content || '[Message deleted]'}
                              </p>
                            )}
                            {!conv.last_message && (
                              <p className="text-sm text-gray-400 italic truncate">
                                No messages yet
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {conv.last_message_at ? formatTime(conv.last_message_at) : 'New conversation'}
                            </p>
                          </div>
                        </div>
                      </button>
                    </ScrollAnimate>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="card-professional h-full flex flex-col">
                <CardHeader className="border-b flex-shrink-0">
                  {(() => {
                    const conv = conversations.find(c => c.id === selectedConversation)
                    return conv ? (
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {conv.other_user.avatar_url ? (
                            <img
                              src={conv.other_user.avatar_url}
                              alt={conv.other_user.full_name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                              {(conv.other_user.full_name || conv.other_user.email.split('@')[0])?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg truncate">{conv.other_user.full_name || conv.other_user.email.split('@')[0]}</div>
                          <div className="text-sm font-normal text-gray-500 truncate">{conv.other_user.email}</div>
                          {conv.other_user.phone_number && (
                            <div className="text-xs font-normal text-gray-400 flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {conv.other_user.phone_number}
                            </div>
                          )}
                        </div>
                      </CardTitle>
                    ) : (
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div>Loading conversation...</div>
                          <div className="text-sm font-normal text-gray-500">Please wait</div>
                        </div>
                      </CardTitle>
                    )
                  })()}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No messages yet</p>
                        <p className="text-sm text-gray-500 mt-2">Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => {
                          const isOwn = message.sender_id === currentUserId
                          return (
                            <ScrollAnimate key={message.id} animation={isOwn ? "slideInRight" : "slideInLeft"} delay={index * 50} triggerOnce={true}>
                              <MessageBubble
                                message={message}
                                isOwn={isOwn}
                                currentUserId={currentUserId || ''}
                                onReply={handleReply}
                                onForward={handleForward}
                                onEdit={handleEditMessage}
                                onDelete={handleDeleteMessage}
                                onReaction={handleReaction}
                                formatTime={formatTime}
                              />
                            </ScrollAnimate>
                          )
                        })}
                        {otherUserTyping && <TypingIndicator />}
                      </>
                    )}
                  </div>
                  <div className="border-t p-4 flex-shrink-0 space-y-3">
                    {/* Reply preview */}
                    {replyingTo && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-900 mb-1">
                            Replying to {replyingTo.sender.full_name || replyingTo.sender.email.split('@')[0]}
                          </p>
                          <p className="text-sm text-blue-800 truncate">{replyingTo.content}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Forward preview */}
                    {forwardingMessage && (
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-purple-900 mb-1">
                            Forwarding message from {forwardingMessage.sender.full_name || forwardingMessage.sender.email.split('@')[0]}
                          </p>
                          <p className="text-sm text-purple-800 truncate">
                            {forwardingMessage.content || (forwardingMessage.attachment_url ? 'Image' : 'Message')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForwardingMessage(null)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Image preview */}
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs max-h-48 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        sendMessage()
                      }}
                      className="flex gap-2"
                    >
                      <div className="flex-1 flex gap-2">
                      <Textarea
                        value={messageContent}
                        onChange={async (e) => {
                          setMessageContent(e.target.value)
                          
                          // Update typing indicator
                          if (e.target.value.trim().length > 0) {
                            await handleTyping()
                          } else {
                            await handleStopTyping()
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        onBlur={() => handleStopTyping()}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                        rows={2}
                      />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => document.getElementById('image-upload-input')?.click()}
                          disabled={sending}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <input
                          id="image-upload-input"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageSelect(file)
                          }}
                          className="hidden"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={sending || (!messageContent.trim() && !selectedImage && !forwardingMessage)}
                        onClick={(e) => {
                          if (forwardingMessage && !replyingTo) {
                            e.preventDefault()
                            forwardMessage()
                          }
                        }}
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-professional h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <NewConversationDialog
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
      />
    </div>
  )
}


