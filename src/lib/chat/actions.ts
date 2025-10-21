'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ChatMessage {
  id: string
  user_id: string
  session_id: string
  role: 'user' | 'ai'
  content: string
  metadata: any
  created_at: string
  updated_at: string
}

export async function saveChatMessage(
  sessionId: string,
  role: 'user' | 'ai',
  content: string,
  metadata?: any
): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await (supabase as any)
    .from('chat_history')
    .insert({
      user_id: user.id,
      session_id: sessionId,
      role,
      content,
      metadata: metadata || {}
    })

  if (error) {
    throw new Error(`Failed to save chat message: ${error.message}`)
  }

  revalidatePath('/interview-pro')
}

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await (supabase as any)
    .from('chat_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch chat history: ${error.message}`)
  }

  return data || []
}

export async function deleteChatHistory(sessionId: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await (supabase as any)
    .from('chat_history')
    .delete()
    .eq('user_id', user.id)
    .eq('session_id', sessionId)

  if (error) {
    throw new Error(`Failed to delete chat history: ${error.message}`)
  }

  revalidatePath('/interview-pro')
}

