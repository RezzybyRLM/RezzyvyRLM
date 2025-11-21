import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
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
    } = body

    // Verify profile belongs to user
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingProfile || existingProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Update profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
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

    // Update resume link if provided
    if (resume_id) {
      // Delete existing primary link
      await supabase
        .from('profile_resumes')
        .delete()
        .eq('profile_id', id)
        .eq('is_primary', true)

      // Create new link
      await supabase
        .from('profile_resumes')
        .insert({
          profile_id: id,
          resume_id,
          is_primary: true,
        })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    // Verify profile belongs to user and is not default
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id, is_default')
      .eq('id', id)
      .single()

    if (!existingProfile || existingProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (existingProfile.is_default) {
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
      .eq('user_id', user.id)

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

