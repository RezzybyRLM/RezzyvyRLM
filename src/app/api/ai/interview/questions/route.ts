import { NextRequest, NextResponse } from 'next/server'
import { geminiAI } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const questionsSchema = z.object({
  jobRole: z.string().min(1, 'Job role is required'),
  experienceLevel: z.string().default('mid'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobRole, experienceLevel } = questionsSchema.parse(body)

    // Get user from session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate interview questions using Gemini AI
    const questions = await geminiAI.generateInterviewQuestions(jobRole, experienceLevel)

    // Track API usage
    // await supabase
    //   .from('api_usage_tracking')
    //   .insert({
    //     user_id: user.id,
    //     service: 'gemini',
    //     endpoint: 'interview-questions',
    //     request_count: 1,
    //     cost_estimate: 0.02,
    //     metadata: {
    //       jobRole,
    //       experienceLevel,
    //       questionsGenerated: questions.length,
    //     },
    //   })

    return NextResponse.json({
      success: true,
      questions,
    })

  } catch (error) {
    console.error('Interview questions API error:', error)

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
        error: 'Failed to generate interview questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
