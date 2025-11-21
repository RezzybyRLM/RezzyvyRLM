import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Verify profile belongs to user
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!existingProfile || existingProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Set all profiles to not default
    await supabase
      .from('user_profiles')
      .update({ is_default: false })
      .eq('user_id', user.id)

    // Set selected profile as default
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_default: true })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to set active profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting active profile:', error)
    return NextResponse.json(
      { error: 'Failed to set active profile' },
      { status: 500 }
    )
  }
}

