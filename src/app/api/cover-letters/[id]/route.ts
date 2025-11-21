import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { id: coverLetterId } = await params

    // Verify ownership
    const { data: coverLetter, error: fetchError } = await supabase
      .from('cover_letters')
      .select('user_id, file_url')
      .eq('id', coverLetterId)
      .single()

    if (fetchError || !coverLetter) {
      return NextResponse.json(
        { error: 'Cover letter not found or access denied' },
        { status: 404 }
      )
    }

    // Type assertion for TypeScript inference
    const coverLetterData = coverLetter as { user_id: string; file_url: string }

    if (coverLetterData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Cover letter not found or access denied' },
        { status: 404 }
      )
    }

    // Delete from storage (extract path from URL)
    const urlParts = coverLetterData.file_url.split('/cover-letters/')
    if (urlParts.length > 1) {
      const filePath = urlParts[1]
      await supabase.storage
        .from('cover-letters')
        .remove([filePath])
    }

    // Delete from database
    const { error } = await supabase
      .from('cover_letters')
      .delete()
      .eq('id', coverLetterId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete cover letter' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cover letter:', error)
    return NextResponse.json(
      { error: 'Failed to delete cover letter' },
      { status: 500 }
    )
  }
}

