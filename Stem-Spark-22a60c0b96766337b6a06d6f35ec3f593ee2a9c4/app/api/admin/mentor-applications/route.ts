import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMentorApprovalEmail, sendMentorRejectionEmail } from '@/lib/resend-service'
import crypto from 'crypto'

// Initialize Supabase client with service role key (bypasses RLS)
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    const errorMsg = `Missing Supabase configuration. URL: ${!!supabaseUrl}, Service Key: ${!!serviceRoleKey}. Please check your .env.local file.`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// GET all mentor applications
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('mentor_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching mentor applications:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: 'Failed to fetch applications',
          details: error.message || 'Unknown error',
          code: error.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ applications: data || [] })
  } catch (error: any) {
    console.error('Error in GET mentor applications:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// UPDATE mentor application status (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, rejectionReason, userId } = body

    const supabase = getSupabaseClient()

    // Validate admin access using service role
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_super_admin')
        .eq('id', userId)
        .single()

      if (!profile || (profile.role !== 'admin' && !profile.is_super_admin)) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    // Get the application first
    const { data: application, error: fetchError } = await supabase
      .from('mentor_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status,
      reviewed_by: userId || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    // If approved, generate signup token
    if (status === 'approved') {
      const signupToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

      updateData.signup_token = signupToken
      updateData.signup_token_expires_at = expiresAt.toISOString()
    }

    // Update the application
    const { data: updatedApplication, error: updateError } = await supabase
      .from('mentor_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating mentor application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    // Send email notification
    try {
      if (status === 'approved') {
        await sendMentorApprovalEmail(
          application.email,
          application.full_name,
          updateData.signup_token
        )
      } else if (status === 'rejected') {
        await sendMentorRejectionEmail(
          application.email,
          application.full_name,
          rejectionReason
        )
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: `Application ${status} successfully`
    })
  } catch (error) {
    console.error('Error in PUT mentor application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

