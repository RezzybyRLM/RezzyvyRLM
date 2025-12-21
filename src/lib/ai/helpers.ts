/**
 * AI Helper utilities with fallback support
 */

export interface AIResponse {
  success: boolean
  text: string
  usedFallback: boolean
  error?: string
}

/**
 * Call Gemini API with fallback to simple templates
 */
export async function callAIWithFallback(
  prompt: string,
  fallbackTemplate: () => string
): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai/gemini-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        maxTokens: 1000,
      }),
    })

    const data = await response.json()

    if (data.success && data.text) {
      return {
        success: true,
        text: data.text.trim(),
        usedFallback: false,
      }
    } else if (data.fallback || !response.ok) {
      // Use fallback if API indicates fallback or if request failed
      return {
        success: true,
        text: fallbackTemplate(),
        usedFallback: true,
      }
    } else {
      // Use fallback for any other case
      return {
        success: true,
        text: fallbackTemplate(),
        usedFallback: true,
      }
    }
  } catch (error) {
    console.warn('AI API error, using fallback:', error)
    return {
      success: true,
      text: fallbackTemplate(),
      usedFallback: true,
    }
  }
}

/**
 * Generate cover letter with AI or fallback
 */
export async function generateCoverLetter(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  userProfile?: {
    name?: string
    experience?: string
    skills?: string[]
  }
): Promise<AIResponse> {
  const prompt = `Write a professional cover letter for the position of ${jobTitle} at ${companyName}.

Job Description:
${jobDescription}

${userProfile?.name ? `Applicant Name: ${userProfile.name}` : ''}
${userProfile?.experience ? `Experience: ${userProfile.experience}` : ''}
${userProfile?.skills ? `Key Skills: ${userProfile.skills.join(', ')}` : ''}

Requirements:
- Professional and concise (3-4 paragraphs)
- Highlight relevant experience and skills
- Show enthusiasm for the role
- Include a strong closing statement
- Keep it under 400 words`

  const fallback = () => {
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. After reviewing the job description, I am confident that my background and skills align well with your requirements.

${userProfile?.experience ? `With ${userProfile.experience} of experience, I have developed a strong foundation in ${userProfile.skills?.slice(0, 3).join(', ') || 'relevant skills'}.` : 'I am excited about the opportunity to contribute to your team.'}

I am particularly drawn to this role because ${jobDescription.substring(0, 100)}... I am eager to bring my dedication and expertise to ${companyName} and contribute to your continued success.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience can benefit your team.

Sincerely,
${userProfile?.name || '[Your Name]'}`
  }

  return callAIWithFallback(prompt, fallback)
}

/**
 * Generate resume suggestions with AI or fallback
 */
export async function generateResumeSuggestions(
  jobDescription: string,
  currentResume?: string
): Promise<AIResponse> {
  const prompt = `Analyze this job description and provide specific suggestions to improve a resume for this position.

Job Description:
${jobDescription}

${currentResume ? `Current Resume Summary:\n${currentResume.substring(0, 500)}` : ''}

Provide:
1. Key skills to highlight
2. Experience points to emphasize
3. Keywords to include
4. Formatting suggestions
5. Areas for improvement

Format as a clear, actionable list.`

  const fallback = () => {
    const keywords = jobDescription.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g)?.slice(0, 10) || []
    return `Resume Improvement Suggestions:

1. KEY SKILLS TO HIGHLIGHT:
   - Review the job description and match your skills
   - Emphasize technical and soft skills mentioned
   - Use industry-standard terminology

2. KEYWORDS TO INCLUDE:
   ${keywords.slice(0, 5).map(k => `   - ${k}`).join('\n')}

3. EXPERIENCE POINTS:
   - Quantify achievements with numbers
   - Use action verbs (led, developed, implemented)
   - Focus on results and impact

4. FORMATTING:
   - Keep it clean and easy to scan
   - Use consistent formatting
   - Highlight most relevant experience first

5. AREAS FOR IMPROVEMENT:
   - Tailor each resume to the specific job
   - Remove irrelevant information
   - Ensure no spelling or grammar errors`
  }

  return callAIWithFallback(prompt, fallback)
}

/**
 * Generate application tips with AI or fallback
 */
export async function generateApplicationTips(
  jobTitle: string,
  companyName: string,
  jobDescription: string
): Promise<AIResponse> {
  const prompt = `Provide personalized application tips for the ${jobTitle} position at ${companyName}.

Job Description:
${jobDescription}

Provide:
1. Key points to mention in the cover letter
2. Important skills to highlight
3. Questions to prepare for interviews
4. Company research suggestions
5. Application best practices

Format as actionable advice.`

  const fallback = () => {
    return `Application Tips for ${jobTitle} at ${companyName}:

1. COVER LETTER KEY POINTS:
   - Express genuine interest in the role
   - Highlight 2-3 most relevant experiences
   - Show knowledge of the company
   - Demonstrate cultural fit

2. SKILLS TO HIGHLIGHT:
   - Match skills from job description
   - Provide specific examples
   - Show progression in your career

3. INTERVIEW PREPARATION:
   - Research the company's mission and values
   - Prepare STAR method examples
   - Prepare questions to ask the interviewer
   - Review common interview questions for this role

4. COMPANY RESEARCH:
   - Visit company website and social media
   - Read recent news and press releases
   - Understand their products/services
   - Learn about their company culture

5. BEST PRACTICES:
   - Customize your application for this specific role
   - Proofread everything carefully
   - Follow up appropriately
   - Be authentic and professional`
  }

  return callAIWithFallback(prompt, fallback)
}

