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

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type - support more document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-word',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ]
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt']
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    
    // Check both MIME type and file extension for better compatibility
    if (!allowedTypes.includes(file.type) && (!fileExt || !allowedExtensions.includes(`.${fileExt}`))) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF, Word document (.doc, .docx), text file (.txt), RTF (.rtf), or OpenDocument (.odt).' },
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
    const fileName = `${user.id}/${Date.now()}.${fileExt || 'pdf'}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // If bucket doesn't exist, provide helpful error message
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not configured. Please contact support or create the "resumes" bucket in Supabase Storage.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload resume' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(uploadData.path)

    // Save resume record to database
    const { data: resume, error: dbError } = await (supabase as any)
      .from('resumes')
      .insert({
        user_id: user.id,
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
      // Try to clean up uploaded file if database insert fails
      await supabase.storage
        .from('resumes')
        .remove([uploadData.path])
      
      return NextResponse.json(
        { error: 'Failed to save resume record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resume
    })
  } catch (error) {
    console.error('Error uploading resume:', error)
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    )
  }
}

