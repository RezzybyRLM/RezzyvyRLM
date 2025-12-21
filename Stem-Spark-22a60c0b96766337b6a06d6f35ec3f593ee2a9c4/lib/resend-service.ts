import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY || '')

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, email not sent')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || 'STEM Spark Academy <noreply@stemspark.com>',
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export async function sendMentorApprovalEmail(
  email: string,
  fullName: string,
  signupToken: string
) {
  const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?token=${signupToken}&role=mentor`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mentor Application Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Congratulations!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Dear ${fullName},</p>
          <p>We are thrilled to inform you that your mentor application has been <strong>approved</strong>!</p>
          <p>We were impressed by your qualifications and passion for teaching. We believe you will be a valuable addition to our mentor team.</p>
          <p style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0;">
            <strong>Next Steps:</strong><br>
            Click the button below to complete your mentor account setup. This link is unique to you and will expire in 7 days.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signupUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Complete Mentor Signup
            </a>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${signupUrl}" style="color: #667eea; word-break: break-all;">${signupUrl}</a>
          </p>
          <p style="margin-top: 30px;">
            We look forward to working with you!<br>
            <strong>The STEM Spark Academy Team</strong>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Your Mentor Application Has Been Approved - STEM Spark Academy',
    html,
  })
}

export async function sendMentorRejectionEmail(
  email: string,
  fullName: string,
  rejectionReason?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mentor Application Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <p>Dear ${fullName},</p>
          <p>Thank you for your interest in becoming a mentor at STEM Spark Academy.</p>
          <p>After careful review of your application, we regret to inform you that we are unable to proceed with your application at this time.</p>
          ${rejectionReason ? `
            <p style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #e74c3c; margin: 20px 0;">
              <strong>Feedback:</strong><br>
              ${rejectionReason}
            </p>
          ` : ''}
          <p>We encourage you to continue developing your skills and consider reapplying in the future. We appreciate your interest in supporting our students' learning journey.</p>
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>The STEM Spark Academy Team</strong>
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Update on Your Mentor Application - STEM Spark Academy',
    html,
  })
}

