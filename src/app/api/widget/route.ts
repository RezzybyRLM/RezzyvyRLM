import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const limit = parseInt(searchParams.get('limit') || '5')
    const format = searchParams.get('format') || 'json'

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get company information
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get active jobs for this company
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    const widgetData = {
      company: {
        id: company.id,
        name: company.name,
        logo_url: company.logo_url,
        website: company.website,
      },
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        location: job.location,
        salary_range: job.salary_range,
        job_type: job.job_type,
        is_featured: job.is_featured,
        description: job.description.substring(0, 200) + '...',
        apply_url: `${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${job.id}`,
        created_at: job.created_at,
      })),
      total_jobs: jobs.length,
      widget_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/widget?company_id=${companyId}`,
    }

    if (format === 'html') {
      // Return HTML widget
      const html = generateHTMLWidget(widgetData)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    // Return JSON data
    return NextResponse.json(widgetData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Widget API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateHTMLWidget(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jobs at ${data.company.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .widget-container { max-width: 400px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .widget-header { background: #FF6B6B; color: white; padding: 16px; text-align: center; }
    .widget-header h2 { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
    .widget-header p { font-size: 14px; opacity: 0.9; }
    .job-list { padding: 0; }
    .job-item { padding: 16px; border-bottom: 1px solid #f3f4f6; }
    .job-item:last-child { border-bottom: none; }
    .job-title { font-size: 16px; font-weight: 600; color: #FF6B6B; margin-bottom: 4px; }
    .job-meta { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
    .job-description { font-size: 14px; color: #4b5563; margin-bottom: 12px; }
    .job-apply { display: inline-block; background: #FF6B6B; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; }
    .job-apply:hover { background: #e55a5a; }
    .featured-badge { background: #fbbf24; color: #92400e; padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: 500; margin-left: 8px; }
    .widget-footer { background: #f9fafb; padding: 12px; text-align: center; font-size: 12px; color: #6b7280; }
    .widget-footer a { color: #FF6B6B; text-decoration: none; }
    .no-jobs { padding: 32px; text-align: center; color: #6b7280; }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="widget-header">
      <h2>Jobs at ${data.company.name}</h2>
      <p>${data.total_jobs} open positions</p>
    </div>
    
    ${data.jobs.length > 0 ? `
      <div class="job-list">
        ${data.jobs.map((job: any) => `
          <div class="job-item">
            <div class="job-title">
              ${job.title}
              ${job.is_featured ? '<span class="featured-badge">Featured</span>' : ''}
            </div>
            <div class="job-meta">
              📍 ${job.location} • ${job.job_type}
              ${job.salary_range ? ` • 💰 ${job.salary_range}` : ''}
            </div>
            <div class="job-description">${job.description}</div>
            <a href="${job.apply_url}" class="job-apply" target="_blank" rel="noopener noreferrer">
              Apply Now
            </a>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="no-jobs">
        <p>No open positions at the moment.</p>
        <p>Check back soon for new opportunities!</p>
      </div>
    `}
    
    <div class="widget-footer">
      <p>Powered by <a href="${process.env.NEXT_PUBLIC_SITE_URL}" target="_blank">Rezzy Job Aggregator</a></p>
    </div>
  </div>
</body>
</html>
  `
}
