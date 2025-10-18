import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/client'
import { Database } from '@/lib/types/database'

type JobAlert = Database['public']['Tables']['job_alerts']['Row']
type JobAlertUpdate = Database['public']['Tables']['job_alerts']['Update']

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (Vercel cron jobs)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get all active job alerts
    const { data: jobAlerts, error: alertsError } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('is_active', true)

    if (alertsError) {
      console.error('Error fetching job alerts:', alertsError)
      return NextResponse.json({ error: 'Failed to fetch job alerts' }, { status: 500 })
    }

    if (!jobAlerts || jobAlerts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active job alerts found',
        processed: 0 
      })
    }

    let processedCount = 0
    let errorCount = 0

    // Process each job alert
    for (const alert of (jobAlerts as JobAlert[])) {
      try {
        // Check if it's time to send this alert based on frequency
        const now = new Date()
        const lastSent = alert.last_sent_at ? new Date(alert.last_sent_at) : null
        
        let shouldSend = false
        
        if (alert.frequency === 'daily') {
          shouldSend = !lastSent || (now.getTime() - lastSent.getTime()) >= 24 * 60 * 60 * 1000
        } else if (alert.frequency === 'weekly') {
          shouldSend = !lastSent || (now.getTime() - lastSent.getTime()) >= 7 * 24 * 60 * 60 * 1000
        }

        if (!shouldSend) {
          continue
        }

        // Get user information
        const { data: user, error: userError } = await (supabase as any)
          .from('profiles')
          .select('email, full_name')
          .eq('id', alert.user_id)
          .single()

        if (userError || !user) {
          console.error('Error fetching user for alert:', alert.id, userError)
          errorCount++
          continue
        }

        // Search for new jobs matching the alert criteria
        const searchParams = new URLSearchParams({
          position: alert.search_query,
          country: 'us',
          maxItems: '10',
          date: '7', // Last 7 days
        })
        
        if (alert.location) {
          searchParams.set('location', alert.location)
        }

        // Call the Indeed jobs API
        const jobsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/fetch-indeed-jobs?${searchParams.toString()}`)
        const jobsData = await jobsResponse.json()

        if (!jobsData.success || !jobsData.jobs || jobsData.jobs.length === 0) {
          // No new jobs found, update last_sent_at to avoid checking again today
          const { error: updateError } = await (supabase as any)
            .from('job_alerts')
            .update({ last_sent_at: now.toISOString() })
            .eq('id', alert.id)
          
          if (updateError) {
            console.error('Error updating job alert:', updateError)
          }
          
          continue
        }

        // Check if we've already sent these jobs to this user
        // For simplicity, we'll send all jobs and let the user decide
        // In production, you might want to track which jobs were already sent

        // Prepare email data
        const emailData = {
          userEmail: user.email,
          userName: user.full_name || 'Job Seeker',
          searchQuery: alert.search_query,
          location: alert.location || 'Anywhere',
          jobs: jobsData.jobs.map((job: any) => ({
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: job.description,
            applyUrl: job.apply_url,
            salary: job.salary_range,
            source: 'indeed' as const,
          })),
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/unsubscribe?alert_id=${alert.id}&token=${alert.id}`, // Simplified for demo
        }

        // Send the email
        const emailSent = await emailService.sendJobAlert(emailData)

        if (emailSent) {
          // Update last_sent_at
          const { error: updateError } = await (supabase as any)
            .from('job_alerts')
            .update({ last_sent_at: now.toISOString() })
            .eq('id', alert.id)
          
          if (updateError) {
            console.error('Error updating job alert:', updateError)
          }
          
          processedCount++
          console.log(`Job alert sent to ${user.email} for "${alert.search_query}"`)
        } else {
          errorCount++
          console.error(`Failed to send job alert to ${user.email}`)
        }

        // Add a small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error('Error processing job alert:', alert.id, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Job alerts processed',
      processed: processedCount,
      errors: errorCount,
      total: jobAlerts.length,
    })

  } catch (error) {
    console.error('Job alerts cron error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process job alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
