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
    const certificateName = formData.get('certificateName') as string
    const issuer = formData.get('issuer') as string
    const dateEarned = formData.get('dateEarned') as string
    const expiryDate = formData.get('expiryDate') as string | null
    const certificateNumber = formData.get('certificateNumber') as string | null
    const profileId = formData.get('profileId') as string | null

    if (!file || !certificateName || !issuer || !dateEarned) {
      return NextResponse.json(
        { error: 'Missing required fields: certificate name, issuer, date earned, and file are required' },
        { status: 400 }
      )
    }

    // Validate file type - support more document types including images
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-word',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.jpg', '.jpeg', '.png', '.gif', '.webp']
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    
    // Check both MIME type and file extension for better compatibility
    if (!allowedTypes.includes(file.type) && (!fileExt || !allowedExtensions.includes(`.${fileExt}`))) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF, Word document, text file, RTF, OpenDocument, or image file (JPEG, PNG, GIF, WebP).' },
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
      .from('certificates')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // Provide helpful error messages
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not configured. The "certificates" bucket should be created automatically. Please try again or contact support if the issue persists.' },
          { status: 500 }
        )
      }
      if (uploadError.message.includes('File size')) {
        return NextResponse.json(
          { error: 'File size exceeds the 5MB limit. Please upload a smaller file.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload certificate. Please try again.' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(uploadData.path)

    // Save certificate record to database
    const { data: certificate, error: dbError } = await (supabase as any)
      .from('certificates')
      .insert({
        user_id: user.id,
        profile_id: profileId || null,
        certificate_name: certificateName,
        issuer: issuer,
        date_earned: dateEarned,
        expiry_date: expiryDate || null,
        certificate_number: certificateNumber || null,
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
        .from('certificates')
        .remove([uploadData.path])
      
      return NextResponse.json(
        { error: 'Failed to save certificate record' },
        { status: 500 }
      )
    }

    // If profile_id is provided, link certificate to profile
    if (profileId) {
      await (supabase as any)
        .from('profile_certificates')
        .insert({
          profile_id: profileId,
          certificate_id: certificate.id,
          is_primary: false,
        })
        .catch((err: any) => {
          console.error('Error linking certificate to profile:', err)
          // Don't fail the upload if linking fails
        })
    }

    return NextResponse.json({
      success: true,
      certificate
    })
  } catch (error) {
    console.error('Error uploading certificate:', error)
    return NextResponse.json(
      { error: 'Failed to upload certificate' },
      { status: 500 }
    )
  }
}

