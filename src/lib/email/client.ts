import { Resend } from 'resend'
import { render } from '@react-email/render'
import JobAlertEmail from './templates/job-alert'
import InterviewSessionEmail from './templates/interview-session'
import JobPostingConfirmationEmail from './templates/job-posting-confirmation'
import PasswordResetEmail from './templates/password-reset'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

export interface JobAlertEmailData {
  userEmail: string
  userName: string
  searchQuery: string
  location: string
  jobs: Array<{
    title: string
    company: string
    location: string
    description: string
    applyUrl: string
    salary?: string
    source: 'indeed' | 'premium'
  }>
  unsubscribeUrl: string
}

export interface InterviewSessionEmailData {
  userEmail: string
  userName: string
  jobRole: string
  sessionDate: string
  duration: number
  score: number
  feedback: string
  suggestions: string[]
}

export interface JobPostingConfirmationEmailData {
  employerEmail: string
  employerName: string
  jobTitle: string
  companyName: string
  jobUrl: string
  totalCost: number
  isFeatured: boolean
}

export class EmailService {
  private readonly fromEmail = 'noreply@rezzybyrlm.com'
  private readonly fromName = 'Rezzy Job Aggregator'

  async sendJobAlert(data: JobAlertEmailData): Promise<boolean> {
    try {
      const { userEmail, userName, searchQuery, location, jobs, unsubscribeUrl } = data

      const subject = `New jobs matching "${searchQuery}" in ${location}`
      
      const html = await render(JobAlertEmail({
        userName,
        searchQuery,
        location,
        jobs,
        unsubscribeUrl,
      }))

      const result = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: userEmail,
        subject,
        html,
      })

      console.log('Job alert email sent:', result)
      return true
    } catch (error) {
      console.error('Error sending job alert email:', error)
      return false
    }
  }

  async sendInterviewSessionSummary(data: InterviewSessionEmailData): Promise<boolean> {
    try {
      const { userEmail, userName, jobRole, sessionDate, duration, score, feedback, suggestions } = data

      const subject = `Interview Pro Session Summary - ${jobRole}`
      
      const html = await render(InterviewSessionEmail({
        userName,
        jobRole,
        sessionDate,
        duration,
        score,
        feedback,
        suggestions,
      }))

      const result = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: userEmail,
        subject,
        html,
      })

      console.log('Interview session email sent:', result)
      return true
    } catch (error) {
      console.error('Error sending interview session email:', error)
      return false
    }
  }

  async sendJobPostingConfirmation(data: JobPostingConfirmationEmailData): Promise<boolean> {
    try {
      const { employerEmail, employerName, jobTitle, companyName, jobUrl, totalCost, isFeatured } = data

      const subject = `Job Posting Confirmed - ${jobTitle}`
      
      const html = await render(JobPostingConfirmationEmail({
        employerName,
        jobTitle,
        companyName,
        jobUrl,
        totalCost,
        isFeatured,
      }))

      const result = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: employerEmail,
        subject,
        html,
      })

      console.log('Job posting confirmation email sent:', result)
      return true
    } catch (error) {
      console.error('Error sending job posting confirmation email:', error)
      return false
    }
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<boolean> {
    try {
      const subject = 'Reset Your Password - Rezzy Job Aggregator'
      
      const html = await render(PasswordResetEmail({ resetUrl }))

      const result = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject,
        html,
      })

      console.log('Password reset email sent:', result)
      return true
    } catch (error) {
      console.error('Error sending password reset email:', error)
      return false
    }
  }
}

export const emailService = new EmailService()
