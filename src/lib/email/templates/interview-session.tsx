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

interface InterviewSessionEmailProps {
  userName: string
  jobRole: string
  sessionDate: string
  duration: number
  score: number
  feedback: string
  suggestions: string[]
}

export const InterviewSessionEmail = ({
  userName,
  jobRole,
  sessionDate,
  duration,
  score,
  feedback,
  suggestions,
}: InterviewSessionEmailProps) => {
  const previewText = `Interview Pro Session Complete - ${jobRole} (Score: ${score}/10)`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>🎤 Interview Pro Session Complete!</Heading>
            <Text style={headerText}>
              Hi {userName}, here's your interview practice summary.
            </Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Session Details</Heading>
            <Text style={detailText}><strong>Role:</strong> {jobRole}</Text>
            <Text style={detailText}><strong>Date:</strong> {new Date(sessionDate).toLocaleDateString()}</Text>
            <Text style={detailText}><strong>Duration:</strong> {Math.floor(duration / 60)} minutes</Text>
            
            <Section style={scoreSection}>
              <Section style={scoreCircle}>
                <Text style={scoreText}>{score}/10</Text>
              </Section>
              <Text style={scoreLabel}>Overall Score</Text>
            </Section>
            
            <Section style={feedbackSection}>
              <Heading style={h3}>AI Feedback</Heading>
              <Text style={feedbackText}>{feedback}</Text>
            </Section>
            
            <Section style={feedbackSection}>
              <Heading style={h3}>Improvement Suggestions</Heading>
              {suggestions.map((suggestion, index) => (
                <Text key={index} style={suggestionItem}>• {suggestion}</Text>
              ))}
            </Section>
            
            <Section style={centerSection}>
              <Button style={practiceButton} href="/interview-pro">
                Practice Again
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Keep practicing to improve your interview skills!
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

const scoreSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const scoreCircle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: '#FF6B6B',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
}

const scoreText = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const scoreLabel = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0',
}

const feedbackSection = {
  background: 'white',
  padding: '15px',
  borderRadius: '8px',
  margin: '15px 0',
}

const feedbackText = {
  color: '#555',
  fontSize: '16px',
  margin: '0',
}

const suggestionItem = {
  background: '#f0f8ff',
  padding: '10px',
  margin: '5px 0',
  borderRadius: '5px',
  borderLeft: '3px solid #007bff',
  color: '#333',
  fontSize: '14px',
}

const centerSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const practiceButton = {
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

export default InterviewSessionEmail
