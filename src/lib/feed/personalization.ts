import { createClient } from '@/lib/supabase/server'

export interface UserInterest {
  interest_type: 'job_category' | 'skill' | 'industry' | 'hashtag' | 'company'
  interest_value: string
  weight: number
}

/**
 * Track user interest when they interact with content
 */
export async function trackUserInterest(
  userId: string,
  interestType: UserInterest['interest_type'],
  interestValue: string,
  source: 'like' | 'view' | 'search' | 'apply' | 'bookmark',
  weight: number = 1.0
): Promise<void> {
  const supabase = await createClient()

  // Upsert interest with increased weight
  const { data: existing } = await supabase
    .from('user_interests')
    .select('weight')
    .eq('user_id', userId)
    .eq('interest_type', interestType)
    .eq('interest_value', interestValue)
    .single()

  if (existing) {
    // Increase weight based on source
    const weightMultiplier = {
      'like': 2.0,
      'apply': 3.0,
      'bookmark': 2.5,
      'view': 1.2,
      'search': 1.5
    }[source] || 1.0

    const newWeight = Math.min((existing.weight || 1.0) * weightMultiplier, 10.0) // Cap at 10

    await supabase
      .from('user_interests')
      .update({
        weight: newWeight,
        source: source,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('interest_type', interestType)
      .eq('interest_value', interestValue)
  } else {
    await supabase
      .from('user_interests')
      .insert({
        user_id: userId,
        interest_type: interestType,
        interest_value: interestValue,
        weight: weight,
        source: source
      })
  }
}

/**
 * Extract interests from post content (hashtags, mentions, etc.)
 */
export function extractInterestsFromPost(content: string): Array<{ type: UserInterest['interest_type'], value: string }> {
  const interests: Array<{ type: UserInterest['interest_type'], value: string }> = []

  // Extract hashtags
  const hashtags = content.match(/#(\w+)/g) || []
  hashtags.forEach(tag => {
    interests.push({
      type: 'hashtag',
      value: tag.replace('#', '').toLowerCase()
    })
  })

  return interests
}

/**
 * Get user's top interests
 */
export async function getUserTopInterests(
  userId: string,
  limit: number = 10
): Promise<UserInterest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_interests')
    .select('interest_type, interest_value, weight')
    .eq('user_id', userId)
    .order('weight', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching user interests:', error)
    return []
  }

  return (data || []).map(item => ({
    interest_type: item.interest_type as UserInterest['interest_type'],
    interest_value: item.interest_value,
    weight: item.weight || 1.0
  }))
}

/**
 * Score a post based on user interests
 */
export async function scorePostForUser(
  userId: string,
  postContent: string,
  postHashtags?: string[],
  isSystemPost?: boolean
): Promise<number> {
  // System posts get a base score to ensure they show
  if (isSystemPost) {
    const interests = await getUserTopInterests(userId)
    if (interests.length === 0) {
      return 0.7 // Higher base score for new users with no interests
    }
    // System posts get boosted score based on interests
    return 0.6
  }

  const interests = await getUserTopInterests(userId)
  
  if (interests.length === 0) {
    return 0.5 // Neutral score if no interests
  }

  let score = 0
  let totalWeight = 0

  // Check hashtags in post
  const postHashtagValues = postHashtags || (postContent.match(/#(\w+)/g) || []).map(t => t.replace('#', '').toLowerCase())
  
  interests.forEach(interest => {
    if (interest.interest_type === 'hashtag') {
      if (postHashtagValues.includes(interest.interest_value.toLowerCase())) {
        score += interest.weight
        totalWeight += interest.weight
      }
    }
    
    // Also check if post content mentions the interest
    if (postContent.toLowerCase().includes(interest.interest_value.toLowerCase())) {
      score += interest.weight * 0.5 // Lower weight for content mentions
      totalWeight += interest.weight * 0.5
    }
  })

  // Normalize score (0 to 1)
  if (totalWeight === 0) return 0.5
  return Math.min(score / totalWeight, 1.0)
}

