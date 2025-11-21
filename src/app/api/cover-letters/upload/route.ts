import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const profileId = formData.get('profileId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF or Word document.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cover-letters')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cover-letters')
      .getPublicUrl(fileName)

    // Save cover letter record to database
    const { data: coverLetter, error: dbError } = await (supabase as any)
      .from('cover_letters')
      .insert({
        user_id: user.id,
        profile_id: profileId || null,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        is_active: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save cover letter' },
        { status: 500 }
      )
    }

    // If profile_id is provided, link cover letter to profile
    if (profileId) {
      await (supabase as any)
        .from('profile_cover_letters')
        .insert({
          profile_id: profileId,
          cover_letter_id: coverLetter.id,
          is_primary: true,
        })
    }

    return NextResponse.json({
      success: true,
      coverLetter
    })
  } catch (error) {
    console.error('Error uploading cover letter:', error)
    return NextResponse.json(
      { error: 'Failed to upload cover letter' },
      { status: 500 }
    )
  }
}

