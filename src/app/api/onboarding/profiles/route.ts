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
      .order('created_at', { ascending: true })

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
      created_during_onboarding
    } = body

    // Validate required fields
    if (!profile_name || !job_title || !industry || !experience_level || !resume_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create profile
    const { data: profile, error: profileError } = await (supabase as any)
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
        created_during_onboarding: created_during_onboarding ?? true,
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
      const { error: linkError } = await (supabase as any)
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

export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Verify profile belongs to user
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const profileData = existingProfile as { user_id: string }

    if (profileData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const { data: profile, error } = await (supabase as any)
      .from('user_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Verify profile belongs to user and is not default
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, is_default')
      .eq('id', id)
      .single()

    if (fetchError || !existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const profileData = existingProfile as { user_id: string; is_default: boolean | null }

    if (profileData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profileData.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default profile' },
        { status: 400 }
      )
    }

    // Delete profile (cascade will handle related records)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    )
  }
}

