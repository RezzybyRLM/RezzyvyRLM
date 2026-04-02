import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
    const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || '21m00Tcm4TlvDq8ikWAM'
    if (!apiKey) {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }

    const body = await request.json()
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    if (!text || text.length > 5000) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 })
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('ElevenLabs error', res.status, errText)
      return NextResponse.json({ error: 'tts_failed' }, { status: 502 })
    }

    const buf = Buffer.from(await res.arrayBuffer())
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('elevenlabs route', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
