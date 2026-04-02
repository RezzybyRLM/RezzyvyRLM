import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEmployerAnalytics } from '@/lib/employer/stats'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const range = searchParams.get('range') || '30d'
    const jobId = searchParams.get('jobId')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const analytics = await getEmployerAnalytics(user.id, companyId, range, jobId || undefined)

    return NextResponse.json({ success: true, analytics })
  } catch (error) {
    console.error('Error fetching employer analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
