import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, maxTokens = 500 } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Get user from session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use Gemini to generate response
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      text: text.trim(),
    })

  } catch (error) {
    console.error('Gemini chat API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate response' 
      },
      { status: 500 }
    )
  }
}

