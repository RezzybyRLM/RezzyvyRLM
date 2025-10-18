import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface JobPostingConfirmationEmailProps {
  employerName: string
  jobTitle: string
  companyName: string
  jobUrl: string
  totalCost: number
  isFeatured: boolean
}

export const JobPostingConfirmationEmail = ({
  employerName,
  jobTitle,
  companyName,
  jobUrl,
  totalCost,
  isFeatured,
}: JobPostingConfirmationEmailProps) => {
  const previewText = `Job Posting Confirmed - ${jobTitle} at ${companyName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>✅ Job Posting Confirmed!</Heading>
            <Text style={headerText}>
              Hi {employerName}, your job posting is now live.
            </Text>
          </Section>

          <Section style={content}>
            <Section style={jobDetails}>
              <Heading style={h2}>{jobTitle}</Heading>
              <Text style={detailText}><strong>Company:</strong> {companyName}</Text>
              {isFeatured && (
                <Text style={featuredBadge}>⭐ FEATURED</Text>
              )}
              <Text style={detailText}><strong>Total Cost:</strong> ${totalCost}</Text>
              <Text style={detailText}><strong>Status:</strong> Active and visible to job seekers</Text>
            </Section>
            
            <Section style={centerSection}>
              <Button style={viewButton} href={jobUrl}>
                View Job Posting
              </Button>
            </Section>
            
            <Section style={nextStepsSection}>
              <Heading style={h3}>What's Next?</Heading>
              <Text style={listItem}>• Your job will appear in search results</Text>
              {isFeatured && (
                <Text style={listItem}>• Featured jobs appear at the top of search results</Text>
              )}
              <Text style={listItem}>• You'll receive email notifications for new applications</Text>
              <Text style={listItem}>• Track performance in your employer dashboard</Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Need help? Contact us at{' '}
              <Text style={link}>support@rezzybyrlm.com</Text>
            </Text>
            <Text style={footerText}>
              © 2024 Rezzy Job Aggregator. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  background: '#FF6B6B',
  color: 'white',
  padding: '20px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
}

const h1 = {
  color: 'white',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 10px',
}

const headerText = {
  color: 'white',
  fontSize: '16px',
  margin: '0',
}

const content = {
  background: '#f9f9f9',
  padding: '20px',
  borderRadius: '0 0 8px 8px',
}

const jobDetails = {
  background: 'white',
  padding: '15px',
  borderRadius: '8px',
  margin: '15px 0',
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 15px',
}

const h3 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 10px',
}

const detailText = {
  color: '#333',
  fontSize: '16px',
  margin: '5px 0',
}

const featuredBadge = {
  background: '#FF6B6B',
  color: 'white',
  padding: '5px 10px',
  borderRadius: '15px',
  fontSize: '12px',
  fontWeight: 'bold',
  display: 'inline-block',
  margin: '5px 0',
}

const centerSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const viewButton = {
  backgroundColor: '#FF6B6B',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '15px 30px',
}

const nextStepsSection = {
  background: '#e8f5e8',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
}

const listItem = {
  color: '#333',
  fontSize: '16px',
  margin: '5px 0',
}

const footer = {
  textAlign: 'center' as const,
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid #ddd',
}

const footerText = {
  color: '#888',
  fontSize: '12px',
  margin: '5px 0',
}

const link = {
  color: '#FF6B6B',
  textDecoration: 'none',
}

export default JobPostingConfirmationEmail
