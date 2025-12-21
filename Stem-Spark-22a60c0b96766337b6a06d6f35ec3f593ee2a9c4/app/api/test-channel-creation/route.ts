import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Test 1: Check if tables exist
    const { data: channels, error: channelsError } = await supabase
      .from('chat_channels')
      .select('count', { count: 'exact', head: true })

    const { data: members, error: membersError } = await supabase
      .from('chat_channel_members')
      .select('count', { count: 'exact', head: true })

    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('count', { count: 'exact', head: true })

    // Test 2: Check if we can create a test channel
    const testChannelName = `test-channel-${Date.now()}`
    const { data: testChannel, error: createError } = await supabase
      .from('chat_channels')
      .insert({
        name: testChannelName,
        description: 'Test channel for debugging',
        channel_type: 'public',
        created_by: '00000000-0000-0000-0000-000000000000' // Dummy UUID
      })
      .select()
      .single()

    // Clean up test channel
    if (testChannel) {
      await supabase
        .from('chat_channels')
        .delete()
        .eq('id', testChannel.id)
    }

    return NextResponse.json({
      success: true,
      tests: {
        tables_exist: {
          chat_channels: !channelsError,
          chat_channel_members: !membersError,
          chat_messages: !messagesError
        },
        channel_creation: !createError,
        test_channel_created: !!testChannel
      },
      errors: {
        channels: channelsError?.message,
        members: membersError?.message,
        messages: messagesError?.message,
        create: createError?.message
      }
    })
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 