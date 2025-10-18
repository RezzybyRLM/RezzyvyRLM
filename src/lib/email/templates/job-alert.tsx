import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface JobAlertEmailProps {
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

export const JobAlertEmail = ({
  userName,
  searchQuery,
  location,
  jobs,
  unsubscribeUrl,
}: JobAlertEmailProps) => {
  const previewText = `Hi ${userName}, we found ${jobs.length} new jobs matching "${searchQuery}" in ${location}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>🎯 New Jobs Found!</Heading>
            <Text style={headerText}>
              Hi {userName}, we found {jobs.length} new jobs matching your search.
            </Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Search: "{searchQuery}" in {location}</Heading>
            
            {jobs.map((job, index) => (
              <Section key={index} style={jobCard}>
                <Heading style={jobTitle}>{job.title}</Heading>
                <Text style={jobCompany}>{job.company}</Text>
                <Text style={jobLocation}>📍 {job.location}</Text>
                {job.salary && <Text style={jobSalary}>💰 {job.salary}</Text>}
                <Text style={jobDescription}>
                  {job.description.substring(0, 200)}...
                </Text>
                <Button style={applyButton} href={job.applyUrl}>
                  {job.source === 'indeed' ? 'Apply on Indeed' : 'Apply Now'}
                </Button>
              </Section>
            ))}

            <Section style={centerSection}>
              <Button
                style={viewAllButton}
                href={`/jobs?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`}
              >
                View All Jobs
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you subscribed to job alerts for "{searchQuery}" in {location}.
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={link}>
                Unsubscribe
              </Link>{' '}
              |{' '}
              <Link href="/dashboard/job-alerts" style={link}>
                Manage Alerts
              </Link>
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

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px',
}

const jobCard = {
  background: 'white',
  margin: '15px 0',
  padding: '15px',
  borderRadius: '8px',
  borderLeft: '4px solid #FF6B6B',
}

const jobTitle = {
  color: '#FF6B6B',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 5px',
}

const jobCompany = {
  color: '#666',
  fontSize: '16px',
  margin: '0 0 10px',
}

const jobLocation = {
  color: '#888',
  fontSize: '14px',
  margin: '0 0 10px',
}

const jobSalary = {
  color: '#888',
  fontSize: '14px',
  margin: '0 0 10px',
}

const jobDescription = {
  color: '#555',
  fontSize: '14px',
  margin: '0 0 15px',
}

const applyButton = {
  backgroundColor: '#FF6B6B',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
}

const centerSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const viewAllButton = {
  backgroundColor: '#5D4037',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '15px 30px',
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
  color: '#888',
  textDecoration: 'none',
}

export default JobAlertEmail
