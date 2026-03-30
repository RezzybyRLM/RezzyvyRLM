import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canManageRoles } from '@/lib/auth/permissions'
import { getGeminiTextModelId } from '@/lib/ai/gemini-model'

/**
 * Super-admin only: Gemini summary of recent contact form messages.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!canManageRoles(me?.role ?? null)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 503 }
      )
    }

    const admin = createServiceRoleClient()
    const { data: rows, error } = await admin
      .from('contact_messages')
      .select('id, name, email, subject, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('contact_messages summary fetch:', error)
      return NextResponse.json(
        { success: false, error: 'Could not load contact messages' },
        { status: 500 }
      )
    }

    const list = rows ?? []
    if (list.length === 0) {
      return NextResponse.json({
        success: true,
        summary: 'No contact submissions yet — nothing to summarize.',
      })
    }

    const lines = list
      .map((m, i) => {
        const body = (m.message || '').slice(0, 1200)
        return `${i + 1}. [${m.status}] ${m.name} <${m.email}> — ${m.subject || '(no subject)'}\n   ${body}`
      })
      .join('\n\n')

    const prompt = `You are assisting a super admin for a job-board product (Rezzy). Below are recent contact form submissions (user messages).

Write a concise executive summary (max 200 words) in Markdown:
- Common themes or questions
- Anything urgent or sensitive
- Suggested follow-up priorities (short numbered list)

Submissions:
${lines}`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: getGeminiTextModelId() })
    const result = await model.generateContent(prompt)
    const summary = (await result.response).text().trim()

    return NextResponse.json({
      success: true,
      summary: summary || 'No summary text returned.',
    })
  } catch (e) {
    console.error('contact-messages summary:', e)
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Gemini error',
      },
      { status: 500 }
    )
  }
}
