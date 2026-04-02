import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInterviewReplyText } from '@/lib/ai/interview-llm'
import { assertAiInterviewTurnAllowed, recordInterviewTurn } from '@/lib/plans/usage-tracking-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const userText = typeof body.userText === 'string' ? body.userText.trim() : ''
    const conversationContext =
      typeof body.conversationContext === 'string' ? body.conversationContext.trim() : ''
    const jobRole = typeof body.jobRole === 'string' ? body.jobRole.trim() : ''

    if (!userText || userText.length < 1) {
      return NextResponse.json({ error: 'userText is required' }, { status: 400 })
    }

    const gate = await assertAiInterviewTurnAllowed(user.id)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason, code: 'QUOTA' }, { status: 402 })
    }

    const replyText = await generateInterviewReplyText({
      userText,
      conversationContext: conversationContext || '(no prior context)',
      jobRole: jobRole || undefined,
    })

    await recordInterviewTurn(user.id, {
      jobRole: jobRole || null,
      userChars: userText.length,
    })

    return NextResponse.json({ success: true, replyText })
  } catch (e) {
    console.error('interview-turn', e)
    const message = e instanceof Error ? e.message : 'Interview reply failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
