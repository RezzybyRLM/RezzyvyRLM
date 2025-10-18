import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('alert_id')
    const token = searchParams.get('token')

    if (!alertId || !token) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // For simplicity, we're using the alert ID as the token
    // In production, you'd want to generate proper secure tokens
    if (alertId !== token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const supabase = await createClient()

    // Deactivate the job alert
    const { error } = await (supabase as any)
      .from('job_alerts')
      .update({ is_active: false })
      .eq('id', alertId)

    if (error) {
      console.error('Error unsubscribing from job alert:', error)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    // Return a simple HTML page confirming unsubscription
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Rezzy Job Aggregator</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: #FF6B6B; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
            margin: -20px -20px 20px -20px;
          }
          .content { 
            text-align: center;
            padding: 20px 0;
          }
          .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          .button {
            background: #FF6B6B;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Unsubscribed Successfully</h1>
          </div>
          <div class="content">
            <div class="success-icon">📧</div>
            <h2>You've been unsubscribed</h2>
            <p>You will no longer receive job alert emails for this search.</p>
            <p>If you change your mind, you can always create new job alerts in your dashboard.</p>
            <a href="/dashboard/job-alerts" class="button">Manage Job Alerts</a>
            <br>
            <a href="/" class="button" style="background: #5D4037; margin-top: 10px;">Back to Home</a>
          </div>
        </div>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
