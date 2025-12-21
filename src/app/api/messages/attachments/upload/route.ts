import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadMessageAttachment } from '@/lib/messages/attachments'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const messageId = formData.get('messageId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!messageId) {
      return NextResponse.json(
        { error: 'No message ID provided' },
        { status: 400 }
      )
    }

    // Verify message exists and user owns it (allow a small delay for message creation)
    let message = null
    let attempts = 0
    while (attempts < 3 && !message) {
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

      if (!msgError && msgData) {
        message = msgData
        break
      }
      
      // Wait 200ms before retrying
      await new Promise(resolve => setTimeout(resolve, 200))
      attempts++
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found. Please try again.' },
        { status: 404 }
      )
    }

    if (message.sender_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { url, error } = await uploadMessageAttachment(file, messageId, user.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      url,
      messageId
    })
  } catch (error) {
    console.error('Error in attachment upload route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

