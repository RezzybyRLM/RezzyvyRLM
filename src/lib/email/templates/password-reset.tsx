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

interface PasswordResetEmailProps {
  resetUrl: string
}

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => {
  const previewText = 'Reset Your Password - Rezzy Job Aggregator'

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>🔐 Password Reset Request</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>
              We received a request to reset your password for your Rezzy Job Aggregator account.
            </Text>
            <Text style={text}>
              Click the button below to reset your password:
            </Text>
            
            <Section style={centerSection}>
              <Button style={resetButton} href={resetUrl}>
                Reset Password
              </Button>
            </Section>
            
            <Text style={text}>
              If you didn't request this password reset, you can safely ignore this email.
            </Text>
            <Text style={text}>
              This link will expire in 1 hour for security reasons.
            </Text>
          </Section>

          <Section style={footer}>
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
  margin: '0',
}

const content = {
  background: '#f9f9f9',
  padding: '20px',
  borderRadius: '0 0 8px 8px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  margin: '10px 0',
}

const centerSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const resetButton = {
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

export default PasswordResetEmail
