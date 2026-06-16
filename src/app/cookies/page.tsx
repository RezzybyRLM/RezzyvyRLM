import type { Metadata } from 'next'
import { LegalPage } from '@/components/layout/legal-page'

export const metadata: Metadata = {
  title: 'Cookie Policy | Rezzy',
  description: 'How Rezzy uses cookies and similar technologies.',
}

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="June 2026"
      intro="This policy explains how Rezzy uses cookies and similar technologies to recognize you when you visit, and the choices you have."
      sections={[
        {
          heading: 'What Are Cookies',
          body: [
            'Cookies are small text files stored on your device when you visit a website. They help the site remember your actions and preferences over time.',
          ],
        },
        {
          heading: 'How We Use Cookies',
          body: [
            'We use essential cookies to keep you signed in and to remember your cart and preferences.',
            'We use analytics cookies to understand how people use Rezzy so we can improve it. These help us measure traffic and feature usage.',
          ],
        },
        {
          heading: 'Managing Cookies',
          body: [
            'You can control and delete cookies through your browser settings. Disabling some cookies may affect how Rezzy works, such as staying signed in.',
          ],
        },
      ]}
    />
  )
}
