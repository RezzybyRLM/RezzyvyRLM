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

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service not configured',
          fallback: true
        },
        { status: 503 }
      )
    }

    // Use Gemini to generate response
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return NextResponse.json({
        success: true,
        text: text.trim(),
      })
    } catch (geminiError: any) {
      // Handle Gemini-specific errors gracefully
      console.error('Gemini API error:', geminiError)
      
      // Check for common error types
      if (geminiError.message?.includes('API_KEY') || geminiError.message?.includes('quota')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI service temporarily unavailable',
            fallback: true
          },
          { status: 503 }
        )
      }

      // For other errors, return failure but allow fallback
      return NextResponse.json(
        { 
          success: false, 
          error: geminiError.message || 'Failed to generate response',
          fallback: true
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Gemini chat API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate response',
        fallback: true
      },
      { status: 500 }
    )
  }
}

