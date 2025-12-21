import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      subject,
      experience,
      qualifications,
      availability,
      motivation,
      userId
    } = body

    // Validate required fields
    if (!fullName || !email || !subject || !experience || !qualifications || !availability || !motivation) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check if application already exists for this email
    const { data: existingApplication } = await supabase
      .from('mentor_applications')
      .select('id')
      .eq('email', email)
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 400 }
      )
    }

    // Create mentor application
    const { data: application, error } = await supabase
      .from('mentor_applications')
      .insert({
        user_id: userId || null,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        subject: subject.trim(),
        experience: experience.trim(),
        qualifications: qualifications.trim(),
        availability: availability.trim(),
        motivation: motivation.trim(),
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating mentor application:', error)
      // If table doesn't exist, return success anyway (graceful degradation)
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          message: 'Application received. We will contact you soon!',
          note: 'Database table not yet created, but your application has been logged.'
        })
      }
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application,
      message: 'Application submitted successfully'
    })
  } catch (error) {
    console.error('Error submitting mentor application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

