import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, profiles: profiles || [] })
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      profile_name,
      job_title,
      job_role,
      industry,
      experience_level,
      years_of_experience,
      skills,
      summary,
      education,
      certifications,
      resume_id,
      is_default,
      is_active,
    } = body

    // Validate required fields
    if (!profile_name || !job_title || !industry || !experience_level || !resume_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        profile_name,
        job_title,
        job_role: job_role || job_title,
        industry,
        experience_level,
        years_of_experience: years_of_experience || null,
        skills: skills || [],
        summary: summary || null,
        education: education || null,
        certifications: certifications || null,
        is_default: is_default ?? false,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // Link resume to profile
    if (resume_id) {
      const { error: linkError } = await supabase
        .from('profile_resumes')
        .insert({
          profile_id: profile.id,
          resume_id,
          is_primary: true,
        })

      if (linkError) {
        console.error('Error linking resume:', linkError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}

