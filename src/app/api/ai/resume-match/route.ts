import { NextRequest, NextResponse } from 'next/server'
import { geminiAI } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const resumeMatchSchema = z.object({
  jobDescription: z.string().min(1, 'Job description is required'),
  jobId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobDescription, jobId } = resumeMatchSchema.parse(body)

    // Get user from session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's resumes
    const { data: resumes, error: resumesError } = await supabase
      .from('resumes')
      .select('id, file_name, content_text')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (resumesError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch resumes' },
        { status: 500 }
      )
    }

    if (!resumes || resumes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No resumes found. Please upload a resume first.',
        matches: [],
      })
    }

    // Analyze job description
    const jobAnalysis = await geminiAI.analyzeJobDescription(jobDescription)

    // Match each resume to the job
    const matches = await Promise.all(
      resumes.map(async (resume: any) => {
        if (!resume.content_text) {
          return {
            resumeId: resume.id,
            fileName: resume.file_name,
            matchScore: 0,
            reasoning: 'Resume content not available for analysis',
            strengths: [],
            improvements: ['Upload a resume with extractable text content'],
          }
        }

        return await geminiAI.matchResumeToJob(
          resume.content_text,
          jobDescription,
          resume.id,
          resume.file_name
        )
      })
    )

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore)

    // Track API usage
    // await supabase
    //   .from('api_usage_tracking')
    //   .insert({
    //     user_id: user.id,
    //     service: 'gemini',
    //     endpoint: 'resume-match',
    //     request_count: 1,
    //     cost_estimate: 0.05, // Estimated cost per analysis
    //     metadata: {
    //       jobId,
    //       resumesAnalyzed: resumes.length,
    //       topMatchScore: matches[0]?.matchScore || 0,
    //     },
    //   })

    return NextResponse.json({
      success: true,
      jobAnalysis,
      matches,
      bestMatch: matches[0] || null,
    })

  } catch (error) {
    console.error('Resume match API error:', error)

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
        error: 'Failed to analyze resume match',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
