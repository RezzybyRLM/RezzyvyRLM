import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, image_caption, file_caption } = await request.json()
    const { id: messageId } = await params

    // Get the message to check ownership
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('sender_id, conversation_id')
      .eq('id', messageId)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if user can edit this message (owner only)
    if (message.sender_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 })
    }

    // Update the message
    const updateData: any = {
      is_edited: true,
      edited_at: new Date().toISOString(),
      edited_by: user.id
    }

    if (content !== undefined) updateData.content = content
    if (image_caption !== undefined) updateData.image_caption = image_caption
    if (file_caption !== undefined) updateData.file_caption = file_caption

    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', messageId)
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, email, phone_number)
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

