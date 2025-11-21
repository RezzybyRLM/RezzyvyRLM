import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecentJobs } from '@/lib/employer/stats'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    const jobs = await getRecentJobs(user.id, companyId, limit)

    return NextResponse.json({ success: true, jobs })
  } catch (error) {
    console.error('Error fetching recent jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent jobs' },
      { status: 500 }
    )
  }
}

