import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reaction } = await request.json() // '👍', '❤️', '😄', '😮', '😢', '😡'
    const { id: messageId } = await params

    // Get the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('reactions')
      .eq('id', messageId)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Update reactions
    const currentReactions = message.reactions || {}
    const userReactions = currentReactions[user.id] || []
    
    let updatedReactions
    if (userReactions.includes(reaction)) {
      // Remove reaction if already exists
      const filtered = userReactions.filter((r: string) => r !== reaction)
      if (filtered.length === 0) {
        // Remove user key if no reactions left
        const { [user.id]: _, ...rest } = currentReactions
        updatedReactions = rest
      } else {
        updatedReactions = {
          ...currentReactions,
          [user.id]: filtered
        }
      }
    } else {
      // Add reaction
      updatedReactions = {
        ...currentReactions,
        [user.id]: [...userReactions, reaction]
      }
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({ reactions: updatedReactions })
      .eq('id', messageId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 })
    }

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    console.error('Error updating reaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

