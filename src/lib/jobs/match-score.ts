interface UserProfile {
  id: string
  profile_name: string
  job_title: string | null
  job_role: string | null
  industry: string | null
  experience_level: string | null
  years_of_experience: number | null
  skills: string[] | null
  summary: string | null
  is_default: boolean | null
  is_active: boolean | null
}

interface Job {
  title: string
  description: string
  requirements: string[] | null
  tags: string[] | null
  experience_required: string | null
  education_required: string | null
}

/**
 * Calculate match score between a job and a user profile
 * Returns a score from 0-100
 */
export function calculateMatchScore(profile: UserProfile, job: Job): number {
  let score = 0
  let maxScore = 0

  // Normalize strings for comparison
  const normalize = (str: string) => str.toLowerCase().trim()

  // 1. Job Title Match (30 points max)
  maxScore += 30
  if (profile.job_title && job.title) {
    const profileTitle = normalize(profile.job_title)
    const jobTitle = normalize(job.title)
    
    // Exact match
    if (profileTitle === jobTitle) {
      score += 30
    } 
    // Partial match (contains)
    else if (jobTitle.includes(profileTitle) || profileTitle.includes(jobTitle)) {
      score += 20
    }
    // Word overlap
    else {
      const profileWords = profileTitle.split(/\s+/)
      const jobWords = jobTitle.split(/\s+/)
      const commonWords = profileWords.filter(w => jobWords.includes(w))
      if (commonWords.length > 0) {
        score += 10 + (commonWords.length * 2)
      }
    }
  }

  // 2. Skills Match (35 points max)
  maxScore += 35
  if (profile.skills && profile.skills.length > 0) {
    const profileSkills = profile.skills.map(s => normalize(s))
    const jobText = `${job.title} ${job.description} ${(job.requirements || []).join(' ')} ${(job.tags || []).join(' ')}`.toLowerCase()
    
    let matchedSkills = 0
    profileSkills.forEach(skill => {
      if (jobText.includes(normalize(skill))) {
        matchedSkills++
      }
    })
    
    if (matchedSkills > 0) {
      const skillMatchRatio = matchedSkills / profile.skills.length
      score += Math.min(35, skillMatchRatio * 35)
    }
  }

  // 3. Industry Match (15 points max)
  maxScore += 15
  if (profile.industry && job.description) {
    const profileIndustry = normalize(profile.industry)
    const jobText = normalize(job.description)
    
    if (jobText.includes(profileIndustry)) {
      score += 15
    } else {
      // Check for related industry keywords
      const industryKeywords: { [key: string]: string[] } = {
        'technology': ['tech', 'software', 'it', 'developer', 'engineering'],
        'healthcare': ['health', 'medical', 'hospital', 'clinic', 'nurse'],
        'finance': ['financial', 'banking', 'accounting', 'investment'],
        'education': ['school', 'university', 'teaching', 'academic'],
        'retail': ['retail', 'sales', 'store', 'merchandise'],
      }
      
      const relatedKeywords = industryKeywords[profileIndustry] || []
      if (relatedKeywords.some(keyword => jobText.includes(keyword))) {
        score += 8
      }
    }
  }

  // 4. Experience Level Match (10 points max)
  maxScore += 10
  if (profile.experience_level && job.experience_required) {
    const profileExp = normalize(profile.experience_level)
    const jobExp = normalize(job.experience_required)
    
    if (profileExp === jobExp) {
      score += 10
    } else {
      // Partial match for similar levels
      const expLevels: { [key: string]: string[] } = {
        'entry': ['junior', 'associate', 'intern'],
        'mid': ['intermediate', 'experienced'],
        'senior': ['lead', 'principal', 'expert'],
      }
      
      const relatedLevels = expLevels[profileExp] || []
      if (relatedLevels.some(level => jobExp.includes(level) || level.includes(jobExp))) {
        score += 5
      }
    }
  }

  // 5. Years of Experience Match (10 points max)
  maxScore += 10
  if (profile.years_of_experience !== null && job.experience_required) {
    const jobExp = normalize(job.experience_required)
    
    // Extract years from job requirements (e.g., "3+ years", "5 years experience")
    const yearsMatch = jobExp.match(/(\d+)\+?\s*(?:years?|yrs?)/i)
    if (yearsMatch) {
      const requiredYears = parseInt(yearsMatch[1])
      const userYears = profile.years_of_experience
      
      if (userYears >= requiredYears) {
        score += 10
      } else if (userYears >= requiredYears * 0.7) {
        score += 7
      } else if (userYears >= requiredYears * 0.5) {
        score += 4
      }
    }
  }

  // Normalize to 0-100 scale
  if (maxScore === 0) return 0
  return Math.round((score / maxScore) * 100)
}

/**
 * Find the best matching profile for a job from available profiles
 * Returns the profile with the highest match score
 */
export function findBestMatchingProfile(
  profiles: UserProfile[],
  job: Job
): { profile: UserProfile; score: number } | null {
  if (!profiles || profiles.length === 0) {
    return null
  }

  // Filter to active profiles only
  const activeProfiles = profiles.filter(p => p.is_active !== false)
  
  if (activeProfiles.length === 0) {
    return null
  }

  // Calculate scores for all profiles
  const profileScores = activeProfiles.map(profile => ({
    profile,
    score: calculateMatchScore(profile, job),
  }))

  // Sort by score (highest first)
  profileScores.sort((a, b) => b.score - a.score)

  // Return the best match
  return profileScores[0]
}

