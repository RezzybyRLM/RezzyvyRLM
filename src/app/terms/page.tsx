import type { Metadata } from 'next'
import { LegalPage } from '@/components/layout/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Service | Rezzy',
  description: 'The terms and conditions for using Rezzy.',
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="June 2026"
      intro="Welcome to Rezzy. These terms govern your use of our website, job search tools, and career services. By creating an account or using Rezzy, you agree to these terms."
      sections={[
        {
          heading: 'Using Rezzy',
          body: [
            'You must be at least 16 years old to use Rezzy. You are responsible for keeping your account credentials secure and for all activity under your account.',
            'You agree to use Rezzy lawfully and not to misuse the platform, scrape data without permission, or interfere with its operation.',
          ],
        },
        {
          heading: 'Job Listings',
          body: [
            'Job listings may be provided by employers or aggregated from third-party sources. While we strive for accuracy, Rezzy does not guarantee the availability, accuracy, or legitimacy of any listing.',
            'Rezzy is not a party to any employment relationship and does not guarantee employment outcomes.',
          ],
        },
        {
          heading: 'Paid Services',
          body: [
            'Resume packages, subscriptions, and other paid services are billed as described at checkout. Refunds are handled according to the policy presented at purchase.',
          ],
        },
        {
          heading: 'Intellectual Property',
          body: [
            'The Rezzy name, logo, and platform content are owned by Rezzy by RLM, LLC. You retain ownership of content you upload, and grant us a license to use it solely to provide our services to you.',
          ],
        },
        {
          heading: 'Limitation of Liability',
          body: [
            'Rezzy is provided “as is.” To the maximum extent permitted by law, Rezzy is not liable for indirect or consequential damages arising from your use of the platform.',
          ],
        },
      ]}
    />
  )
}
