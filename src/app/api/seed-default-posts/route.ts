import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the first user to use for system posts
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .maybeSingle()

    // If no users exist, we can't create posts
    if (userError || !users) {
      return NextResponse.json(
        { error: 'No users found. Please create an account first.' },
        { status: 400 }
      )
    }

    // Check if default posts already exist (by checking is_system_post)
    const { data: existingPosts } = await supabase
      .from('social_posts')
      .select('id')
      .eq('is_system_post', true)
      .limit(1)

    if (existingPosts && existingPosts.length > 0) {
      return NextResponse.json(
        { message: 'Default posts already exist' },
        { status: 200 }
      )
    }

    // Get logo URL - using the public logo path
    const logoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/logo.png`

    // Create default posts marked as system posts
    const defaultPosts = [
      {
        user_id: users.id,
        content: 'Welcome to Rezzy! 🎉 We\'re excited to help you find your next career opportunity. Start by creating your profile and exploring job opportunities. #CareerGrowth #JobSearch',
        post_type: 'text',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_system_post: true,
      },
      {
        user_id: users.id,
        content: '💼 Looking for your dream job? Our AI-powered job search helps you find opportunities that match your skills and experience. Try our advanced filters and get personalized recommendations! #JobSearch #AI',
        post_type: 'text',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_system_post: true,
      },
      {
        user_id: users.id,
        content: '📝 Pro Tip: Keep your resume updated and tailored for each application. Use our Resume Optimizer to make sure your resume stands out to recruiters! #ResumeTips #CareerAdvice',
        post_type: 'text',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_system_post: true,
      },
      {
        user_id: users.id,
        content: '🤝 Connect with professionals in your industry! Use our messaging feature to reach out to employers and build your professional network. #Networking #Career',
        post_type: 'text',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_system_post: true,
      },
    ]

    const { error } = await supabase
      .from('social_posts')
      .insert(defaultPosts)

    if (error) {
      console.error('Error creating default posts:', error)
      return NextResponse.json(
        { error: 'Failed to create default posts' },
        { status: 500 }
      )
    }

    // Update the user's avatar_url to logo for system posts display
    // We'll handle this in the UI to show logo for these specific posts

    return NextResponse.json({
      success: true,
      message: 'Default posts created successfully',
      count: defaultPosts.length
    })
  } catch (error) {
    console.error('Error in seed-default-posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

