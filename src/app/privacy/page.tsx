import type { Metadata } from 'next'
import { LegalPage } from '@/components/layout/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | Rezzy',
  description: 'How Rezzy collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="June 2026"
      intro="Your privacy matters to us. This policy explains what information Rezzy collects, how we use it, and the choices you have. By using Rezzy you agree to the practices described here."
      sections={[
        {
          heading: 'Information We Collect',
          body: [
            'We collect information you provide directly, such as your name, email address, resume content, job preferences, and any messages you send through the platform.',
            'We also collect usage data automatically, including pages viewed, jobs saved, searches performed, and device and browser information, to improve our service.',
          ],
        },
        {
          heading: 'How We Use Your Information',
          body: [
            'We use your information to deliver job matches, power resume and interview tools, process payments, send job alerts you have requested, and provide customer support.',
            'We never sell your personal data. We may share limited information with service providers (such as payment and email providers) strictly to operate Rezzy.',
          ],
        },
        {
          heading: 'Job Applications & Third Parties',
          body: [
            'Some jobs are sourced from third-party providers. When you choose to apply externally, you may be redirected to a partner site governed by its own privacy policy.',
          ],
        },
        {
          heading: 'Data Security',
          body: [
            'We use industry-standard safeguards to protect your data. No method of transmission over the internet is fully secure, but we work hard to protect your information.',
          ],
        },
        {
          heading: 'Your Rights',
          body: [
            'You can access, update, or delete your account information at any time from your dashboard, or by contacting us. You may also unsubscribe from job alerts and marketing emails.',
          ],
        },
      ]}
    />
  )
}
