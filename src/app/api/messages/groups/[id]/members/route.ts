import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userId } = body

    if (!action || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if conversation is a group (exists in group_conversations table)
    const { data: conversation, error: convError } = await supabase
      .from('group_conversations')
      .select('created_by')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Not a group chat' }, { status: 400 })
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    const isAdmin = membership?.role === 'admin' || conversation.created_by === user.id

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can manage members' }, { status: 403 })
    }

    if (action === 'add') {
      // Check if user is already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
      }

      const { error } = await supabase
        .from('group_members')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: 'member'
        })

      if (error) throw error

      // Send system message
      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single()

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `${userData?.full_name || 'User'} has been added to the group.`,
          message_type: 'system'
        })

      return NextResponse.json({ success: true })
    }

    if (action === 'remove') {
      // Don't allow removing yourself
      if (userId === user.id) {
        return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)

      if (error) throw error

      // Send system message
      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single()

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `${userData?.full_name || 'User'} has been removed from the group.`,
          message_type: 'system'
        })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing group members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

