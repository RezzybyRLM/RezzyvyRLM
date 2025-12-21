'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { NewGroupDialog } from '@/components/ui/new-group-dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollAnimate } from '@/components/ui/scroll-animate'
import { formatTime } from '@/lib/utils'
import { Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Conversation {
  id: string
  participant1_id: string
  participant2_id: string
  last_message_at: string
  type?: 'direct' | 'group'
  name?: string | null
  description?: string | null
  avatar_url?: string | null
  created_by?: string | null
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
  member_count?: number
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
  is_deleted?: boolean
  deleted_at?: string | null
  reactions?: Record<string, string[]>
  image_caption?: string | null
  file_caption?: string | null
  forwarded_from_id?: string | null
  read_by?: string[]
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
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesChannelRef = useRef<any>(null)
  const typingChannelRef = useRef<any>(null)
  const conversationChannelRef = useRef<any>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null)
  const [forwardingToConversation, setForwardingToConversation] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
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

      // Set up realtime subscription for conversations list with optimized updates
      if (mounted) {
        conversationsChannel = supabase
          .channel('conversations_list')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'conversations',
            filter: `or(participant1_id.eq.${user.id},participant2_id.eq.${user.id})`
          }, async (payload) => {
            if (!mounted) return
            
            const newConv = payload.new as any
            const otherUserId = newConv.participant1_id === user.id 
              ? newConv.participant2_id 
              : newConv.participant1_id
            
            // Fetch other user data
            const { data: otherUserData } = await supabase
              .from('users')
              .select('id, full_name, email, phone_number, avatar_url')
              .eq('id', otherUserId)
              .single()
            
            // Fetch last message
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', newConv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            // Get unread count
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', newConv.id)
              .eq('is_read', false)
              .neq('sender_id', user.id)
            
            const formattedConv: Conversation = {
              id: newConv.id,
              participant1_id: newConv.participant1_id,
              participant2_id: newConv.participant2_id,
              last_message_at: newConv.last_message_at,
              other_user: {
                id: otherUserData?.id || otherUserId,
                full_name: otherUserData?.full_name || null,
                email: otherUserData?.email || '',
                phone_number: otherUserData?.phone_number || null,
                avatar_url: otherUserData?.avatar_url || null
              },
              last_message: lastMsg ? {
                content: lastMsg.content,
                sender_id: lastMsg.sender_id,
                created_at: lastMsg.created_at,
                is_read: lastMsg.is_read
              } : null,
              unread_count: count || 0
            }
            
            setConversations(prev => {
              const exists = prev.find(c => c.id === formattedConv.id)
              if (exists) return prev
              return [formattedConv, ...prev]
            })
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations',
            filter: `or(participant1_id.eq.${user.id},participant2_id.eq.${user.id})`
          }, async (payload) => {
            if (!mounted) return
            
            const updatedConv = payload.new as any
            
            // Update conversation in state
            setConversations(prev => prev.map(conv => 
              conv.id === updatedConv.id
                ? { ...conv, last_message_at: updatedConv.last_message_at }
                : conv
            ))
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        }, async (payload) => {
          if (!mounted) return
          
          console.log('📨 Realtime message INSERT received:', payload)
          const newMessage = payload.new as any
          
          // Verify this message is for the current conversation
          if (newMessage.conversation_id !== selectedConversation) {
            console.log('⚠️ Message is for different conversation, ignoring')
            return
          }
            
            // Update conversation's last message if it's in our conversations
            const conv = conversations.find(c => c.id === newMessage.conversation_id)
            if (conv) {
              const { data: { user: currentUser } } = await supabase.auth.getUser()
              
              // Get unread count
              const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', newMessage.conversation_id)
                .eq('is_read', false)
                .neq('sender_id', currentUser?.id)
              
              setConversations(prev => prev.map(c => 
                c.id === newMessage.conversation_id
                  ? {
                      ...c,
                      last_message: {
                        content: newMessage.content,
                        sender_id: newMessage.sender_id,
                        created_at: newMessage.created_at,
                        is_read: newMessage.is_read
                      },
                      last_message_at: newMessage.created_at,
                      unread_count: count || 0
                    }
                  : c
              ))
            }
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

  // Enhanced message handler - memoized to prevent recreation
  // Use ref to access current selectedConversation without recreating callback
  const selectedConversationRef = useRef<string | null>(null)
  selectedConversationRef.current = selectedConversation

  const handleRealtimeMessage = useCallback(async (payload: any) => {
    // Handle postgres_changes events from Supabase Realtime
    // This is called when messages are inserted, updated, or deleted
    const eventType = payload.eventType || (payload.new ? 'INSERT' : payload.old ? 'DELETE' : 'UPDATE')
    console.log('🔔 Realtime event triggered:', eventType, payload)
    console.log('📋 Current conversation ref:', selectedConversationRef.current)
    console.log('📋 Message conversation_id:', payload.new?.conversation_id || payload.old?.conversation_id)
    
    // Handle different event types
    if (eventType === 'INSERT') {
      const newMessage = payload.new as any
      
      // Verify this message is for the current conversation
      if (newMessage.conversation_id !== selectedConversationRef.current) {
        console.log('⚠️ Message is for different conversation, ignoring. Current:', selectedConversationRef.current, 'Message:', newMessage.conversation_id)
        return
      }
      
      console.log('✅ Processing new INSERT message for current conversation:', newMessage.id)
      
          const { data: { user } } = await supabase.auth.getUser()
      
      // Fetch sender data for the new message
      const { data: senderData } = await supabase
        .from('users')
        .select('id, full_name, email, phone_number')
        .eq('id', newMessage.sender_id)
        .single()
      
      // Fetch attachments if any
      const { data: attachments } = await supabase
        .from('message_attachments')
        .select('id, file_url, file_type, file_name')
        .eq('message_id', newMessage.id)
      
      // Add new message to state immediately
      setMessages(prev => {
        const exists = prev.find(m => m.id === newMessage.id)
        if (exists) {
          console.log('⚠️ Message already exists in state, updating instead')
          // Update existing message (might be from optimistic update)
          return prev.map(msg => 
            msg.id === newMessage.id
              ? {
                  ...msg,
                  id: newMessage.id,
                  created_at: newMessage.created_at,
                  is_read: newMessage.is_read,
                  read_by: newMessage.read_by || [],
                  content: newMessage.content,
                  attachment_url: newMessage.attachment_url,
                  attachment_type: newMessage.attachment_type,
                  image_caption: newMessage.image_caption,
                  file_caption: newMessage.file_caption,
                  sender: senderData ? {
                    full_name: senderData.full_name || null,
                    email: senderData.email || '',
                    phone_number: senderData.phone_number || null
                  } : msg.sender
                }
              : msg
          )
        }
        
        console.log('➕ Adding new message to state:', newMessage.id)
        const message: Message = {
          id: newMessage.id,
          sender_id: newMessage.sender_id,
          content: newMessage.content || '',
          is_read: newMessage.is_read || false,
          created_at: newMessage.created_at,
          reply_to_message_id: newMessage.reply_to_message_id,
          attachment_url: newMessage.attachment_url,
          attachment_type: newMessage.attachment_type,
          is_edited: newMessage.is_edited || false,
          edited_at: newMessage.edited_at,
          is_deleted: newMessage.is_deleted || false,
          deleted_at: newMessage.deleted_at,
          reactions: newMessage.reactions || {},
          image_caption: newMessage.image_caption,
          file_caption: newMessage.file_caption,
          forwarded_from_id: newMessage.forwarded_from_id,
          read_by: newMessage.read_by || [],
          sender: senderData ? {
            full_name: senderData.full_name || null,
            email: senderData.email || '',
            phone_number: senderData.phone_number || null
          } : {
            full_name: null,
            email: '',
            phone_number: null
          },
          reply_to: null, // Will be fetched if needed
          attachments: attachments || []
        }
        
        return [...prev, message]
      })
      
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      
      // Update conversations list (optimized - only update this conversation)
      setConversations(prev => prev.map(conv => 
        conv.id === newMessage.conversation_id
          ? {
              ...conv,
              last_message: {
                content: newMessage.content,
                sender_id: newMessage.sender_id,
                created_at: newMessage.created_at,
                is_read: newMessage.is_read
              },
              last_message_at: newMessage.created_at,
              unread_count: conv.id === selectedConversationRef.current ? conv.unread_count : conv.unread_count + 1
            }
          : conv
      ))
      
      // Mark as read if it's not from current user
      if (user && newMessage.sender_id !== user.id) {
        const readBy = Array.isArray(newMessage.read_by) ? [...newMessage.read_by] : []
        if (!readBy.includes(user.id)) {
          readBy.push(user.id)
        }
        
            await supabase
              .from('messages')
          .update({ 
            is_read: true,
            read_by: readBy
          })
          .eq('id', newMessage.id)
      }
    } else if (eventType === 'UPDATE') {
      const updatedMessage = payload.new as any
      
      console.log('🔄 Processing UPDATE event for message:', updatedMessage.id)
      
      // Update message in state
      setMessages(prev => prev.map(msg =>
        msg.id === updatedMessage.id
          ? { ...msg, ...updatedMessage }
          : msg
      ))
      
      // Update conversations list (optimized)
      setConversations(prev => prev.map(conv => 
        conv.id === updatedMessage.conversation_id && conv.last_message?.sender_id === updatedMessage.sender_id
          ? {
              ...conv,
              last_message: {
                content: updatedMessage.content,
                sender_id: updatedMessage.sender_id,
                created_at: updatedMessage.created_at,
                is_read: updatedMessage.is_read
              }
            }
          : conv
      ))
    } else if (eventType === 'DELETE') {
      const deletedMessage = payload.old as any
      
      console.log('🗑️ Processing DELETE event for message:', deletedMessage.id)
      
      // Remove deleted message from state
      setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id))
    }
  }, []) // No dependencies - uses ref to access current conversation

  // Enhanced realtime subscription setup - memoized like reference code
  const setupRealtimeSubscription = useCallback(async (conversationId: string) => {
    if (!conversationId || !currentUserId) return

    console.log(`🔌 Setting up subscription for conversation: ${conversationId}`)

    // Clean up any existing channels first
    if (messagesChannelRef.current) {
      console.log('🧹 Cleaning up existing messages channel')
      supabase.removeChannel(messagesChannelRef.current)
      messagesChannelRef.current = null
    }
    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current)
      typingChannelRef.current = null
    }
    if (conversationChannelRef.current) {
      supabase.removeChannel(conversationChannelRef.current)
      conversationChannelRef.current = null
    }

    // Fetch initial messages first
    await fetchMessages(conversationId)
    
    // Small delay to ensure initial fetch completes
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log('🔌 Creating realtime subscription for conversation:', conversationId)
      
    // Set up realtime subscription for messages
    // Following Supabase best practices: simple channel name pattern
    // This ensures reliable real-time delivery between all connected clients
    const channelName = `room-${conversationId}`
    console.log(`📡 Creating channel: ${channelName} for conversation: ${conversationId}`)
    
    messagesChannelRef.current = supabase
      .channel(channelName)
      // Listen for INSERT events - following Supabase best practices
      // Simple channel name and direct INSERT subscription for reliable delivery
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as any
          console.log('🎯 Realtime INSERT received:', {
            messageId: newMessage.id,
            conversationId: newMessage.conversation_id,
            senderId: newMessage.sender_id,
            currentConversation: selectedConversationRef.current
          })
          handleRealtimeMessage(payload)
        }
      )
      // Also subscribe to UPDATE events for message edits, reactions, etc.
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMessage = payload.new as any
          console.log('🔄 Realtime UPDATE received:', {
            messageId: updatedMessage.id,
            conversationId: updatedMessage.conversation_id
          })
          handleRealtimeMessage(payload)
        }
      )
      // Subscribe to DELETE events for message deletions
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const deletedMessage = payload.old as any
          console.log('🗑️ Realtime DELETE received:', {
            messageId: deletedMessage.id,
            conversationId: deletedMessage.conversation_id
          })
          handleRealtimeMessage(payload)
        }
      )
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_attachments',
        filter: `message_id=in.(SELECT id FROM messages WHERE conversation_id=eq.${conversationId})`
      }, async (payload) => {
        const newAttachment = payload.new as any
        
        // Update message with new attachment
        setMessages(prev => prev.map(msg => 
          msg.id === newAttachment.message_id
            ? {
                ...msg,
                attachments: [
                  ...(msg.attachments || []),
                  {
                    id: newAttachment.id,
                    file_url: newAttachment.file_url,
                    file_type: newAttachment.file_type,
                    file_name: newAttachment.file_name
                  }
                ]
              }
            : msg
        ))
        })
        .on('postgres_changes', {
        event: 'UPDATE',
          schema: 'public',
          table: 'message_attachments',
        filter: `message_id=in.(SELECT id FROM messages WHERE conversation_id=eq.${conversationId})`
      }, async (payload) => {
        const updatedAttachment = payload.new as any
        
        // Update attachment in message
        setMessages(prev => prev.map(msg => 
          msg.id === updatedAttachment.message_id
            ? {
                ...msg,
                attachments: (msg.attachments || []).map(att =>
                  att.id === updatedAttachment.id
                    ? {
                        ...att,
                        file_url: updatedAttachment.file_url,
                        file_type: updatedAttachment.file_type,
                        file_name: updatedAttachment.file_name
                      }
                    : att
                )
              }
            : msg
        ))
      })
      .on('presence', { event: 'sync' }, () => {
        console.log('👥 Presence synced')
      })
      .subscribe((status, err) => {
        console.log(`📡 Realtime subscription status: ${status}`, err || '')
        
        switch (status) {
          case 'SUBSCRIBED':
            console.log(`✅ Realtime subscription ACTIVE for conversation ${conversationId}`)
            console.log('📋 Channel details:', {
              channel: channelName,
              conversation: conversationId,
              userId: currentUserId,
              status: 'SUBSCRIBED'
            })
            console.log('🎯 Ready to receive realtime messages for conversation:', conversationId)
            break
          case 'CHANNEL_ERROR':
            console.error('❌ Realtime channel error:', err)
            // Try to resubscribe on error
            if (messagesChannelRef.current) {
              setTimeout(() => {
                console.log('🔄 Attempting to resubscribe...')
                messagesChannelRef.current?.subscribe()
              }, 2000)
            }
            break
          case 'TIMED_OUT':
            console.warn('⏱️ Realtime subscription timed out, retrying...')
            // Channel will auto-retry, but we can also manually retry
            if (messagesChannelRef.current) {
              setTimeout(() => {
                console.log('🔄 Retrying subscription after timeout...')
                messagesChannelRef.current?.subscribe()
              }, 3000)
            }
            break
          case 'CLOSED':
            console.log('🔒 Realtime channel closed')
            // Reconnect if conversation hasn't changed
            if (conversationId === selectedConversationRef.current && messagesChannelRef.current) {
              setTimeout(() => {
                if (messagesChannelRef.current) {
                  console.log('🔄 Reconnecting closed channel...')
                  messagesChannelRef.current.subscribe()
                }
              }, 1000)
            }
            break
        }
      })

      // Set up typing indicator subscription
    typingChannelRef.current = supabase
      .channel(`typing:${conversationId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`
        }, async (payload) => {
          const { data: { user } } = await supabase.auth.getUser()
          if (user && payload.new && (payload.new as any).user_id !== user.id) {
            setOtherUserTyping((payload.new as any).is_typing || false)
            
            // Auto-hide typing indicator after 3 seconds
            if ((payload.new as any).is_typing) {
              setTimeout(() => {
              setOtherUserTyping(false)
              }, 3000)
            }
          }
        })
        .subscribe()

      // Set up conversation updates subscription
    conversationChannelRef.current = supabase
      .channel(`conversation:${conversationId}:${currentUserId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        filter: `id=eq.${conversationId}`
      }, async (payload) => {
        const updatedConv = payload.new as any
        
        // Update conversation in state
        setConversations(prev => prev.map(conv => 
          conv.id === updatedConv.id
            ? { ...conv, last_message_at: updatedConv.last_message_at }
            : conv
        ))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Conversation updates subscription active`)
        }
      })
  }, [currentUserId, handleRealtimeMessage])

  useEffect(() => {
    if (!selectedConversation || !currentUserId) {
      // Clean up channels if no conversation selected
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current)
        messagesChannelRef.current = null
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current)
        typingChannelRef.current = null
      }
      if (conversationChannelRef.current) {
        supabase.removeChannel(conversationChannelRef.current)
        conversationChannelRef.current = null
      }
      return
    }

    setupRealtimeSubscription(selectedConversation)

      return () => {
      // Cleanup: Always unsubscribe when component unmounts or conversation changes
      console.log(`🧹 Cleaning up channels for conversation ${selectedConversation}`)
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current)
        messagesChannelRef.current = null
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current)
        typingChannelRef.current = null
      }
      if (conversationChannelRef.current) {
        supabase.removeChannel(conversationChannelRef.current)
        conversationChannelRef.current = null
      }
    }
  }, [selectedConversation, currentUserId, setupRealtimeSubscription])

  // Fetch conversation details if it's not in the list yet (newly created)
  useEffect(() => {
    if (!selectedConversation || !currentUserId || loading) return
    
    const conv = conversations.find(c => c.id === selectedConversation)
    if (conv) {
      // Conversation is in list, messages will be fetched by the realtime effect
      return
    }
    
    // Conversation not in list, fetch it directly (only once per conversation ID)
    let isMounted = true
    let hasFetched = false
    
    const fetchMissingConversation = async () => {
      if (hasFetched || !isMounted) return
      hasFetched = true
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isMounted) return
      
      try {
        const { data: convData, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', selectedConversation)
          .single()
        
        if (error) {
          console.error('Error fetching missing conversation:', error)
          return
        }
        
        // Verify user is a participant
        if (convData && convData.participant1_id !== user.id && convData.participant2_id !== user.id) {
          console.error('User is not a participant in this conversation')
          return
        }
        
        if (convData && isMounted) {
          // Fetch user data for the other participant
          const otherUserId = convData.participant1_id === user.id 
            ? convData.participant2_id 
            : convData.participant1_id
          
          const { data: otherUserData } = await supabase
            .from('users')
            .select('id, full_name, email, phone_number, avatar_url')
            .eq('id', otherUserId)
            .single()
          
          const otherUser = otherUserData || {
            id: otherUserId,
            full_name: null,
            email: '',
            phone_number: null,
            avatar_url: null
          }
          
          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convData.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
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
          
          // Add to conversations list only if not already there
          setConversations(prev => {
            const exists = prev.find(c => c.id === formattedConv.id)
            if (exists) return prev
            return [formattedConv, ...prev]
          })
        }
      } catch (err) {
        console.error('Error in fetchMissingConversation:', err)
      }
    }
    fetchMissingConversation()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, currentUserId, loading])

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get direct conversations
      const { data: directConvs, error: directError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .or('type.is.null,type.eq.direct')
      
      // Get group conversations where user is a member
      const { data: groupMemberships } = await supabase
        .from('group_members')
        .select('conversation_id')
        .eq('user_id', user.id)
      
      const groupConvIds = groupMemberships?.map(gm => gm.conversation_id) || []
      
      const { data: groupConvs, error: groupError } = groupConvIds.length > 0
        ? await supabase
            .from('conversations')
            .select('*')
            .in('id', groupConvIds)
            .eq('type', 'group')
        : { data: [], error: null }
      
      if (directError || groupError) {
        console.error('Error fetching conversations:', directError || groupError)
        throw directError || groupError
      }
      
      // Combine and deduplicate
      const allConvs = [
        ...(directConvs || []),
        ...(groupConvs || [])
      ]
      
      const uniqueConvs = allConvs.filter((conv, index, self) =>
        index === self.findIndex(c => c.id === conv.id)
      )
      
      // Sort by last_message_at
      const data = uniqueConvs.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
        return bTime - aTime
      })

      // Fetch user data for direct conversations
      const directConvsOnly = data.filter((c: any) => !c.type || c.type === 'direct')
      const allParticipantIds = new Set<string>()
      directConvsOnly.forEach((conv: any) => {
        allParticipantIds.add(conv.participant1_id)
        allParticipantIds.add(conv.participant2_id)
      })
      
      const { data: usersData } = allParticipantIds.size > 0
        ? await supabase
            .from('users')
            .select('id, full_name, email, phone_number, avatar_url')
            .in('id', Array.from(allParticipantIds))
        : { data: [] }
      
      const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]))
      
      // Fetch member counts for group chats
      const groupConvsOnly = data.filter((c: any) => c.type === 'group')
      const memberCounts = new Map<string, number>()
      if (groupConvsOnly.length > 0) {
        const { data: memberData } = await supabase
          .from('group_members')
          .select('conversation_id')
          .in('conversation_id', groupConvsOnly.map((c: any) => c.id))
        
        if (memberData) {
          memberData.forEach((m: any) => {
            memberCounts.set(m.conversation_id, (memberCounts.get(m.conversation_id) || 0) + 1)
          })
        }
      }
      
      const formattedConversations = data.map((conv: any) => {
        if (conv.type === 'group') {
          // Group chat
        return {
          id: conv.id,
          participant1_id: conv.participant1_id,
          participant2_id: conv.participant2_id,
          last_message_at: conv.last_message_at,
            type: 'group' as const,
            name: conv.name,
            description: conv.description,
            avatar_url: conv.avatar_url,
            created_by: conv.created_by,
            other_user: {
              id: '',
              full_name: conv.name || 'Group Chat',
              email: '',
              phone_number: null,
              avatar_url: conv.avatar_url
            },
            member_count: memberCounts.get(conv.id) || 0
          }
        } else {
          // Direct chat
          const otherUserId = conv.participant1_id === user.id 
            ? conv.participant2_id 
            : conv.participant1_id
          
          const otherUser = usersMap.get(otherUserId) || {
            id: otherUserId,
            full_name: null,
            email: '',
            phone_number: null,
            avatar_url: null
          }
          
          return {
            id: conv.id,
            participant1_id: conv.participant1_id,
            participant2_id: conv.participant2_id,
            last_message_at: conv.last_message_at,
            type: 'direct' as const,
          other_user: {
            id: otherUser.id,
            full_name: otherUser.full_name,
            email: otherUser.email,
              phone_number: otherUser.phone_number || null,
              avatar_url: otherUser.avatar_url || null
            }
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

  const fetchMessages = async (conversationId: string, beforeDate?: string, limit: number = 50) => {
    if (!conversationId) return
    
    setMessagesLoading(true)
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          attachments:message_attachments(id, file_url, file_type, file_name)
        `, { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (beforeDate) {
        query = query.lt('created_at', beforeDate)
      }
      
      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      // Fetch sender data for all messages
      const senderIds = new Set<string>()
      ;(data || []).forEach((msg: any) => {
        senderIds.add(msg.sender_id)
      })
      
      const { data: sendersData } = await supabase
        .from('users')
        .select('id, full_name, email, phone_number')
        .in('id', Array.from(senderIds))
      
      const sendersMap = new Map((sendersData || []).map((u: any) => [u.id, u]))

          // Fetch reply_to messages for messages that have replies
          const messagesWithReplies = await Promise.all(
            (data || []).map(async (msg: any) => {
              let replyTo = null
              if (msg.reply_to_message_id) {
                const { data: replyData } = await supabase
                  .from('messages')
              .select('id, content, sender_id')
                  .eq('id', msg.reply_to_message_id)
                  .single()
                
            if (replyData) {
              const replySender = sendersMap.get(replyData.sender_id) || {
                full_name: null,
                email: ''
              }
                  replyTo = {
                    id: replyData.id,
                    content: replyData.content,
                    sender: {
                  full_name: replySender.full_name || null,
                  email: replySender.email || ''
                }
              }
            }
          }

          // Get sender data from map
          const senderData = sendersMap.get(msg.sender_id) || {
            id: msg.sender_id,
            full_name: null,
            email: '',
            phone_number: null
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
              full_name: senderData.full_name || null,
              email: senderData.email || '',
              phone_number: senderData.phone_number || null
            },
            reply_to: replyTo,
            attachments: Array.isArray(msg.attachments) ? msg.attachments : []
          }
        })
      )

      // Reverse to show oldest first, newest last
      const sortedMessages = (messagesWithReplies || []).reverse()
      
      if (beforeDate) {
        // Loading older messages - prepend to existing
        setMessages(prev => [...sortedMessages, ...prev])
      } else {
        // Initial load - replace all
        setMessages(sortedMessages)
        
        // Find the latest read message and scroll to it
        const { data: { user } } = await supabase.auth.getUser()
        if (user && sortedMessages.length > 0) {
          // Find the last message that was read by the current user
          let lastReadIndex = -1
          for (let i = sortedMessages.length - 1; i >= 0; i--) {
            const msg = sortedMessages[i]
            const readBy = Array.isArray(msg.read_by) ? msg.read_by : []
            if (msg.sender_id !== user.id && (msg.is_read || readBy.includes(user.id))) {
              lastReadIndex = i
              break
            }
          }
          
          // If no read messages found, scroll to bottom
          // Otherwise scroll to the last read message
          setTimeout(() => {
            if (lastReadIndex >= 0 && messagesContainerRef.current) {
              // Find the message element and scroll to it
              const messageElements = messagesContainerRef.current.querySelectorAll('[data-message-id]')
              console.log(`📍 Found ${messageElements.length} message elements, scrolling to index ${lastReadIndex}`)
              if (messageElements[lastReadIndex]) {
                messageElements[lastReadIndex].scrollIntoView({ behavior: 'auto', block: 'center' })
                console.log('✅ Scrolled to last read message')
              } else {
                // Fallback to bottom if element not found
                console.log('⚠️ Message element not found, scrolling to bottom')
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
              }
            } else {
              // No read messages or all are unread - scroll to bottom
              console.log('📍 No read messages found, scrolling to bottom')
              messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
            }
          }, 300)
        } else {
          // No user or no messages - scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
          }, 100)
        }
      }
      
      // Check if there are more messages
      setHasMoreMessages((count || 0) > (data?.length || 0))

      // Mark messages as read and add to read_by array
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get unread messages
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('id, read_by')
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('is_read', false)
        
        if (unreadMessages && unreadMessages.length > 0) {
          // Update each message to mark as read and add user to read_by
          await Promise.all(unreadMessages.map(async (msg) => {
            const readBy = Array.isArray(msg.read_by) ? [...msg.read_by] : []
            if (!readBy.includes(user.id)) {
              readBy.push(user.id)
            }
            
            await supabase
              .from('messages')
              .update({ 
                is_read: true,
                read_by: readBy
              })
              .eq('id', msg.id)
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const sendMessage = async () => {
    if ((!messageContent.trim() && !selectedImage) || !selectedConversation) return

      const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please sign in to send messages')
      return
    }

    // Optimistic update - add message to UI immediately
    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      sender_id: user.id,
      content: messageContent.trim() || '',
      is_read: false,
      created_at: new Date().toISOString(),
      reply_to_message_id: replyingTo?.id || null,
      attachment_url: selectedImage ? URL.createObjectURL(selectedImage) : null,
      attachment_type: selectedImage?.type || null,
      is_edited: false,
      is_deleted: false,
      reactions: {},
      read_by: [],
      sender: {
        full_name: user.user_metadata?.full_name || null,
        email: user.email || '',
        phone_number: user.user_metadata?.phone_number || null
      },
      reply_to: replyingTo || null,
      attachments: selectedImage ? [{
        id: `temp-attach-${Date.now()}`,
        file_url: URL.createObjectURL(selectedImage),
        file_type: selectedImage.type,
        file_name: selectedImage.name
      }] : [],
      image_caption: selectedImage && messageContent.trim() ? messageContent.trim() : null,
      file_caption: null,
      forwarded_from_id: null
    }

    // Add optimistic message to state immediately
    setMessages(prev => [...prev, tempMessage])
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    // Clear form immediately for better UX
    const originalContent = messageContent.trim()
    const originalImage = selectedImage
    setMessageContent('')
    setReplyingTo(null)
    setForwardingMessage(null)
    setSelectedImage(null)
    setImagePreview(null)

    setSending(true)
    try {
      // Create message with content (can be used as caption for images)
      const messageData: any = {
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: originalContent || '',
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
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId))
        throw msgError
      }

      // Replace temp message with real message when it arrives
      setMessages(prev => prev.map(msg => 
        msg.id === tempId
          ? {
              ...msg,
              id: newMessage.id,
              created_at: newMessage.created_at,
              is_read: newMessage.is_read,
              read_by: newMessage.read_by || []
            }
          : msg
      ))

      // Upload image if selected (image with optional caption)
      if (originalImage && newMessage) {
        try {
        const formData = new FormData()
          formData.append('file', originalImage)
        formData.append('messageId', newMessage.id)

        const uploadResponse = await fetch('/api/messages/attachments/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadResponse.ok) {
            const result = await uploadResponse.json()
            const url = result.url
            
            // The attachment should already be saved to message_attachments table by the upload function
            // But we also update the message with attachment_url for legacy support
            const updateData: any = {
              attachment_url: url,
              attachment_type: originalImage.type
            }
            
            // If there's content and it's an image, use it as caption
            if (originalContent && originalImage.type.startsWith('image/')) {
              updateData.image_caption = originalContent
            } else if (originalContent && !originalImage.type.startsWith('image/')) {
              updateData.file_caption = originalContent
            }

            const { error: updateError } = await supabase
              .from('messages')
              .update(updateData)
            .eq('id', newMessage.id)

            if (updateError) {
              console.error('Error updating message with attachment:', updateError)
            }

            // Update the message in state with the real attachment URL
            setMessages(prev => prev.map(msg => 
              msg.id === newMessage.id
                ? {
                    ...msg,
                    attachment_url: url,
                    attachment_type: originalImage.type,
                    image_caption: originalImage.type.startsWith('image/') && originalContent ? originalContent : msg.image_caption,
                    file_caption: !originalImage.type.startsWith('image/') && originalContent ? originalContent : msg.file_caption
                  }
                : msg
            ))
          } else {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Error uploading attachment:', errorData.error || 'Upload failed')
            alert('Failed to upload image. Please try again.')
            // Remove optimistic message on upload error
            setMessages(prev => prev.filter(m => m.id !== newMessage.id))
          }
        } catch (error) {
          console.error('Error in image upload process:', error)
          alert('Failed to upload image. Please try again.')
          // Remove optimistic message on error
          setMessages(prev => prev.filter(m => m.id !== newMessage.id))
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

      // Update conversation last_message_at
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation
          ? {
              ...conv,
              last_message: {
                content: originalContent || '[Image]',
                sender_id: user.id,
                created_at: newMessage.created_at,
                is_read: false
              },
              last_message_at: newMessage.created_at
            }
          : conv
      ))

      // Stop typing indicator
      await handleStopTyping()

      // Scroll to bottom after message is sent
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
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
      }, {
        onConflict: 'conversation_id,user_id'
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
      }, {
        onConflict: 'conversation_id,user_id'
      })
  }


  const filteredConversations = conversations.filter(conv =>
    conv.type === 'group'
      ? (conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         conv.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      : (conv.other_user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         conv.other_user.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <Card className="card-professional overflow-hidden flex flex-col h-full">
            <CardHeader className="border-b space-y-3 flex-shrink-0">
              <div className="flex gap-2">
              <Button
                onClick={() => setShowNewConversation(true)}
                  className="flex-1 btn-primary text-xs sm:text-sm"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">New Message</span>
                  <span className="sm:hidden">New</span>
              </Button>
                <Button
                  onClick={() => setShowNewGroup(true)}
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">New Group</span>
                  <span className="sm:hidden">Group</span>
                </Button>
              </div>
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
            <CardContent className="p-0 overflow-y-auto flex-1 min-h-0">
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
                            {conv.type === 'group' ? (
                              conv.avatar_url ? (
                                <img
                                  src={conv.avatar_url}
                                  alt={conv.name || 'Group'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                  <Users className="h-6 w-6" />
                                </div>
                              )
                            ) : conv.other_user.avatar_url ? (
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
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                  {conv.type === 'group' 
                                    ? conv.name || 'Group Chat'
                                    : conv.other_user.full_name || conv.other_user.email.split('@')[0]}
                              </h3>
                                {conv.type === 'group' && conv.member_count !== undefined && (
                                  <Badge variant="outline" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    {conv.member_count}
                                  </Badge>
                                )}
                              </div>
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
          <div className="lg:col-span-2 flex flex-col min-h-0">
            {selectedConversation ? (
              <Card className="card-professional h-full flex flex-col min-h-0">
                <CardHeader className="border-b flex-shrink-0">
                  {(() => {
                    const conv = conversations.find(c => c.id === selectedConversation)
                    return conv ? (
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {conv.type === 'group' ? (
                            conv.avatar_url ? (
                              <img
                                src={conv.avatar_url}
                                alt={conv.name || 'Group'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                                <Users className="h-6 w-6" />
                        </div>
                            )
                          ) : conv.other_user.avatar_url ? (
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
                          <div className="font-semibold text-lg truncate">
                            {conv.type === 'group' 
                              ? conv.name || 'Group Chat'
                              : conv.other_user.full_name || conv.other_user.email.split('@')[0]}
                          </div>
                          {conv.type === 'group' ? (
                            <div className="text-sm font-normal text-gray-500 truncate">
                              {conv.member_count !== undefined ? `${conv.member_count} member${conv.member_count !== 1 ? 's' : ''}` : 'Group chat'}
                            </div>
                          ) : (
                            <>
                              <div className="text-sm font-normal text-gray-500 truncate">{conv.other_user.email}</div>
                          {conv.other_user.phone_number && (
                            <div className="text-xs font-normal text-gray-400 flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {conv.other_user.phone_number}
                            </div>
                              )}
                            </>
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
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0"
                    onScroll={(e) => {
                      const target = e.target as HTMLDivElement
                      // Load older messages when scrolling to top
                      if (target.scrollTop === 0 && hasMoreMessages && !loadingOlderMessages) {
                        const oldestMessage = messages[0]
                        if (oldestMessage) {
                          setLoadingOlderMessages(true)
                          fetchMessages(selectedConversation, oldestMessage.created_at, 50).then(() => {
                            setLoadingOlderMessages(false)
                            // Maintain scroll position
                            setTimeout(() => {
                              if (messagesContainerRef.current) {
                                const newScrollHeight = messagesContainerRef.current.scrollHeight
                                const oldScrollHeight = target.scrollHeight
                                messagesContainerRef.current.scrollTop = newScrollHeight - oldScrollHeight
                              }
                            }, 100)
                          })
                        }
                      }
                    }}
                  >
                    {loadingOlderMessages && (
                      <div className="text-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
                      </div>
                    )}
                    {messagesLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-600">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No messages yet</p>
                        <p className="text-sm text-gray-500 mt-2">Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => {
                          const isOwn = message.sender_id === currentUserId
                          return (
                              <MessageBubble
                              key={message.id}
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
                          )
                        })}
                        <div ref={messagesEndRef} />
                        {otherUserTyping && <TypingIndicator />}
                      </>
                    )}
                  </div>
                  <div className="border-t p-3 flex-shrink-0 space-y-2">
                    {/* Reply preview */}
                    {replyingTo && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded flex items-start justify-between text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-blue-900 mb-0.5">
                            Replying to {replyingTo.sender.full_name || replyingTo.sender.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-blue-800 truncate">{replyingTo.content}</p>
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
                      <div className="flex-1 flex gap-2 items-end">
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
                        className="flex-1 min-h-[40px] max-h-[100px] resize-none text-sm"
                        rows={1}
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
      
      <NewGroupDialog
        isOpen={showNewGroup}
        onClose={() => setShowNewGroup(false)}
        onSuccess={(conversationId) => {
          setSelectedConversation(conversationId)
          const params = new URLSearchParams(searchParams.toString())
          params.set('conversation', conversationId)
          router.replace(`/messages?${params.toString()}`, { scroll: false })
          fetchConversations()
        }}
      />
    </div>
  )
}


