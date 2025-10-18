import { NextRequest, NextResponse } from 'next/server'
import { geminiAI } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const analyzeSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  jobRole: z.string().min(1, 'Job role is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, answer, jobRole } = analyzeSchema.parse(body)

    // Get user from session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Analyze the interview response using Gemini AI
    const analysis = await geminiAI.analyzeInterviewResponse(question, answer, jobRole)

    // Save interview session data
    // await supabase
    //   .from('interview_sessions')
    //   .insert({
    //     user_id: user.id,
    //     job_role: jobRole,
    //     questions: [question],
    //     feedback: [analysis.feedback],
    //     session_data: {
    //       question,
    //       answer,
    //       score: analysis.score,
    //       suggestions: analysis.suggestions,
    //     },
    //   })

    // Track API usage
    // await supabase
    //   .from('api_usage_tracking')
    //   .insert({
    //     user_id: user.id,
    //     service: 'gemini',
    //     endpoint: 'interview-analysis',
    //     request_count: 1,
    //     cost_estimate: 0.03,
    //     metadata: {
    //       jobRole,
    //       questionLength: question.length,
    //       answerLength: answer.length,
    //       score: analysis.score,
    //     },
    //   })

    return NextResponse.json({
      success: true,
      feedback: analysis.feedback,
      score: analysis.score,
      suggestions: analysis.suggestions,
    })

  } catch (error) {
    console.error('Interview analysis API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze interview response',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
