import { createClient } from '@/lib/supabase/server'

export interface MessageStats {
  total_messages: number
  unread_count: number
  last_message_at: string | null
}

export interface ConversationStats {
  conversation_id: string
  total_messages: number
  unread_count: number
  last_message_at: string | null
}

/**
 * Get total unread message count for a user
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = await createClient()
  
  // First get all conversation IDs for this user
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)

  if (convError || !conversations) {
    console.error('Error getting conversations:', convError)
    return 0
  }

  const conversationIds = conversations.map(c => c.id)

  if (conversationIds.length === 0) {
    return 0
  }

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', userId)
    .in('conversation_id', conversationIds)

  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }

  return count || 0
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(
  conversationId: string,
  userId: string
): Promise<ConversationStats | null> {
  const supabase = await createClient()

  // Get conversation to determine which participant the user is
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('participant1_id, participant2_id')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    console.error('Error getting conversation:', convError)
    return null
  }

  const isParticipant1 = conversation.participant1_id === userId

  // Get total message count
  const { count: totalCount, error: totalError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  if (totalError) {
    console.error('Error getting total count:', totalError)
    return null
  }

  // Get unread count for this user
  const { count: unreadCount, error: unreadError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', userId)

  if (unreadError) {
    console.error('Error getting unread count:', unreadError)
    return null
  }

  // Get last message timestamp
  const { data: lastMessage, error: lastError } = await supabase
    .from('messages')
    .select('created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    conversation_id: conversationId,
    total_messages: totalCount || 0,
    unread_count: unreadCount || 0,
    last_message_at: lastMessage?.created_at || null,
  }
}

/**
 * Update message read status
 */
export async function updateMessageReadStatus(
  messageId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  // Verify user has access to this message
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .select('conversation_id, sender_id')
    .eq('id', messageId)
    .single()

  if (msgError || !message) {
    console.error('Error getting message:', msgError)
    return false
  }

  // Don't mark own messages as read
  if (message.sender_id === userId) {
    return true
  }

  // Verify user is participant in conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('participant1_id, participant2_id')
    .eq('id', message.conversation_id)
    .single()

  if (convError || !conversation) {
    console.error('Error getting conversation:', convError)
    return false
  }

  if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
    console.error('User is not a participant in this conversation')
    return false
  }

  // Update message read status
  const { error: updateError } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .neq('sender_id', userId)

  if (updateError) {
    console.error('Error updating read status:', updateError)
    return false
  }

  // Update conversation unread count
  const isParticipant1 = conversation.participant1_id === userId
  const unreadCountField = isParticipant1 ? 'unread_count_participant1' : 'unread_count_participant2'

  // Recalculate unread count
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', message.conversation_id)
    .eq('is_read', false)
    .neq('sender_id', userId)

  await supabase
    .from('conversations')
    .update({ [unreadCountField]: count || 0 })
    .eq('id', message.conversation_id)

  return true
}

/**
 * Get message thread (replies to a message)
 */
export async function getMessageThread(messageId: string): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(id, full_name, email, phone_number)
    `)
    .eq('reply_to_message_id', messageId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error getting message thread:', error)
    return []
  }

  return data || []
}

