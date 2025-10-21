import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface ResumeMatchResult {
  resumeId: string
  fileName: string
  matchScore: number
  reasoning: string
  strengths: string[]
  improvements: string[]
}

export interface JobAnalysis {
  skills: string[]
  requirements: string[]
  experience: string
  education: string
  keywords: string[]
}

export class GeminiAI {
  private _model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  
  get model() {
    return this._model
  }

  async analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
    const prompt = `
    Analyze this job description and extract key information:
    
    Job Description: ${jobDescription}
    
    Please provide a JSON response with the following structure:
    {
      "skills": ["skill1", "skill2", "skill3"],
      "requirements": ["requirement1", "requirement2"],
      "experience": "experience level required",
      "education": "education requirements",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
    
    Focus on technical skills, soft skills, experience levels, and important keywords.
    `

    try {
      const result = await this._model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback parsing if JSON is not found
      return this.parseJobAnalysisFallback(text)
    } catch (error) {
      console.error('Error analyzing job description:', error)
      throw new Error('Failed to analyze job description')
    }
  }

  async matchResumeToJob(
    resumeContent: string,
    jobDescription: string,
    resumeId: string,
    fileName: string
  ): Promise<ResumeMatchResult> {
    const prompt = `
    Analyze how well this resume matches the job description and provide a detailed assessment.
    
    Resume Content: ${resumeContent}
    
    Job Description: ${jobDescription}
    
    Please provide a JSON response with the following structure:
    {
      "matchScore": 85,
      "reasoning": "Detailed explanation of the match",
      "strengths": ["strength1", "strength2", "strength3"],
      "improvements": ["improvement1", "improvement2"]
    }
    
    Match Score should be 0-100.
    Reasoning should explain why this resume is a good/bad match.
    Strengths should highlight what makes this resume strong for this role.
    Improvements should suggest how to make the resume better for this specific job.
    `

    try {
      const result = await this._model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          resumeId,
          fileName,
          matchScore: parsed.matchScore || 0,
          reasoning: parsed.reasoning || 'No reasoning provided',
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
        }
      }
      
      // Fallback if JSON parsing fails
      return {
        resumeId,
        fileName,
        matchScore: 50,
        reasoning: text,
        strengths: [],
        improvements: [],
      }
    } catch (error) {
      console.error('Error matching resume to job:', error)
      throw new Error('Failed to match resume to job')
    }
  }

  async generateInterviewQuestions(jobRole: string, experienceLevel: string = 'mid'): Promise<string[]> {
    const prompt = `
    Generate 10 relevant interview questions for a ${jobRole} position at ${experienceLevel} level.
    
    Include a mix of:
    - Technical questions specific to the role
    - Behavioral questions
    - Problem-solving scenarios
    - Industry-specific questions
    
    Return as a JSON array of strings.
    `

    try {
      const result = await this._model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Try to parse JSON array
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback: split by lines and clean up
      return text
        .split('\n')
        .filter(line => line.trim() && !line.match(/^\d+\./))
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 10)
    } catch (error) {
      console.error('Error generating interview questions:', error)
      return [
        'Tell me about yourself and your experience.',
        'Why are you interested in this position?',
        'What are your greatest strengths?',
        'Describe a challenging project you worked on.',
        'How do you handle tight deadlines?',
      ]
    }
  }

  async analyzeInterviewResponse(
    question: string,
    response: string,
    jobRole: string
  ): Promise<{
    score: number
    feedback: string
    suggestions: string[]
  }> {
    const prompt = `
    Analyze this interview response and provide feedback.
    
    Question: ${question}
    Response: ${response}
    Job Role: ${jobRole}
    
    Please provide a JSON response:
    {
      "score": 75,
      "feedback": "Detailed feedback on the response",
      "suggestions": ["suggestion1", "suggestion2"]
    }
    
    Score should be 0-100.
    Feedback should be constructive and specific.
    Suggestions should help improve future responses.
    `

    try {
      const result = await this._model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          score: parsed.score || 50,
          feedback: parsed.feedback || 'No feedback provided',
          suggestions: parsed.suggestions || [],
        }
      }
      
      return {
        score: 50,
        feedback: text,
        suggestions: [],
      }
    } catch (error) {
      console.error('Error analyzing interview response:', error)
      return {
        score: 50,
        feedback: 'Unable to analyze response at this time.',
        suggestions: ['Try to be more specific in your answers'],
      }
    }
  }

  private parseJobAnalysisFallback(text: string): JobAnalysis {
    // Simple fallback parsing
    const skills: string[] = []
    const requirements: string[] = []
    const keywords: string[] = []
    
    // Extract common technical skills
    const skillKeywords = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Git']
    skillKeywords.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill)
      }
    })
    
    return {
      skills,
      requirements,
      experience: 'Not specified',
      education: 'Not specified',
      keywords,
    }
  }
}

export const geminiAI = new GeminiAI()
