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

interface InviteEmailProps {
  heading: string
  intro: string
  ctaLabel: string
  url: string
  note?: string
}

export const InviteEmail = ({ heading, intro, ctaLabel, url, note }: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>{heading}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>{heading}</Heading>
        </Section>
        <Section style={content}>
          <Text style={text}>{intro}</Text>
          <Section style={centerSection}>
            <Button style={ctaButton} href={url}>
              {ctaLabel}
            </Button>
          </Section>
          <Text style={muted}>Or paste this link into your browser:</Text>
          <Text style={link}>{url}</Text>
          {note ? <Text style={muted}>{note}</Text> : null}
          <Text style={muted}>This is a single-use link and will expire. If you weren&apos;t expecting it, you can ignore this email.</Text>
        </Section>
        <Section style={footer}>
          <Text style={footerText}>© {new Date().getFullYear()} Rezzy by RLM, LLC. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#F3F2EF',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '0 0 32px', marginBottom: '40px', borderRadius: '12px', overflow: 'hidden' as const, maxWidth: '560px' }
const header = { background: '#FF6B6B', color: 'white', padding: '28px 24px', textAlign: 'center' as const }
const h1 = { color: 'white', fontSize: '22px', fontWeight: 'bold', margin: '0' }
const content = { padding: '24px' }
const text = { color: '#1F2328', fontSize: '16px', lineHeight: '1.6', margin: '8px 0' }
const muted = { color: '#6B7280', fontSize: '13px', margin: '8px 0' }
const link = { color: '#D32F2A', fontSize: '13px', wordBreak: 'break-all' as const, margin: '4px 0 16px' }
const centerSection = { textAlign: 'center' as const, margin: '24px 0' }
const ctaButton = {
  backgroundColor: '#FF6B6B',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '14px 28px',
}
const footer = { textAlign: 'center' as const, padding: '0 24px' }
const footerText = { color: '#9CA3AF', fontSize: '12px', margin: '4px 0' }

export default InviteEmail
