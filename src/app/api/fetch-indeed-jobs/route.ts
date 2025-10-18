import { NextRequest, NextResponse } from 'next/server'
import { apifyIndeedClient } from '@/lib/apify/client'
import { transformIndeedJobs, validateIndeedJob, sanitizeJobData } from '@/lib/apify/transform'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const searchSchema = z.object({
  position: z.string().min(1, 'Position is required'),
  location: z.string().optional(),
  country: z.string().default('us'),
  maxItems: z.number().min(1).max(10).default(10),
  date: z.string().default('7'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { position, location, country, maxItems, date } = searchSchema.parse(body)

    // Create search query for caching
    const searchQuery = `${position}${location ? ` in ${location}` : ''}`

    // Check cache first
    const supabase = await createClient()
    const { data: cachedJobs } = await supabase
      .from('cached_indeed_jobs')
      .select('*')
      .eq('search_query', searchQuery)
      .gte('expires_at', new Date().toISOString())
      .limit(maxItems)

    if (cachedJobs && cachedJobs.length > 0) {
      return NextResponse.json({
        success: true,
        jobs: cachedJobs,
        source: 'cache',
        count: cachedJobs.length,
      })
    }

    // If no cache, scrape from Indeed
    const indeedJobs = await apifyIndeedClient.scrapeJobs({
      position,
      location: location || '',
      country,
      maxItems,
      date,
    })

    // Validate and sanitize jobs
    const validJobs = indeedJobs
      .filter(validateIndeedJob)
      .map(sanitizeJobData)

    if (validJobs.length === 0) {
      return NextResponse.json({
        success: true,
        jobs: [],
        source: 'scrape',
        count: 0,
        message: 'No jobs found for the given criteria',
      })
    }

    // Transform jobs to our format
    const transformedJobs = transformIndeedJobs(validJobs, searchQuery)

    // Cache the results
    // const { error: insertError } = await supabase
    //   .from('cached_indeed_jobs')
    //   .insert(transformedJobs)

    // if (insertError) {
    //   console.error('Failed to cache jobs:', insertError)
    //   // Still return the jobs even if caching fails
    // }

    // Track API usage
    // await supabase
    //   .from('api_usage_tracking')
    //   .insert({
    //     service: 'apify',
    //     endpoint: 'indeed-scraper',
    //     request_count: 1,
    //     cost_estimate: 0.1, // Estimated cost per request
    //     metadata: {
    //       position,
    //       location,
    //       country,
    //       maxItems,
    //       jobsFound: validJobs.length,
    //     },
    //   })

    return NextResponse.json({
      success: true,
      jobs: transformedJobs,
      source: 'scrape',
      count: transformedJobs.length,
    })

  } catch (error) {
    console.error('Indeed jobs API error:', error)

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
        error: 'Failed to fetch jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const position = searchParams.get('position')
  const location = searchParams.get('location')
  const country = searchParams.get('country') || 'us'
  const maxItems = parseInt(searchParams.get('maxItems') || '10')
  const date = searchParams.get('date') || '7'

  if (!position) {
    return NextResponse.json(
      {
        success: false,
        error: 'Position parameter is required',
      },
      { status: 400 }
    )
  }

  // Convert GET to POST format and call POST handler
  const mockRequest = {
    json: async () => ({
      position,
      location,
      country,
      maxItems,
      date,
    }),
  } as NextRequest

  return POST(mockRequest)
}
