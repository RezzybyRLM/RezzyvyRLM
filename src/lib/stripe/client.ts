import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-02-24.acacia',
})

export interface DonationAmount {
  amount: number
  label: string
  description: string
}

export const DONATION_AMOUNTS: DonationAmount[] = [
  {
    amount: 500, // $5.00 in cents
    label: '$5',
    description: 'Buy us a coffee',
  },
  {
    amount: 1000, // $10.00 in cents
    label: '$10',
    description: 'Help us maintain servers',
  },
  {
    amount: 2500, // $25.00 in cents
    label: '$25',
    description: 'Support AI development',
  },
  {
    amount: 5000, // $50.00 in cents
    label: '$50',
    description: 'Keep tools free for job seekers',
  },
]

export async function createDonationCheckoutSession(
  amount: number,
  donorEmail?: string,
  donorName?: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Rezzy Donation',
              description: 'Support AI-powered job search tools',
              images: ['https://rezzybyrlm.com/logo.png'],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/donate`,
      metadata: {
        type: 'donation',
        amount: amount.toString(),
        donorEmail: donorEmail || '',
        donorName: donorName || '',
      },
      customer_email: donorEmail,
    })

    return session
  } catch (error) {
    console.error('Error creating donation checkout session:', error)
    throw new Error('Failed to create checkout session')
  }
}

export async function createJobPostingCheckoutSession(
  jobId: string,
  amount: number,
  companyEmail: string,
  companyName: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium Job Posting',
              description: `Featured job posting for ${companyName}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/employer/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/employer/post-job`,
      metadata: {
        type: 'job_posting',
        jobId,
        companyEmail,
        companyName,
      },
      customer_email: companyEmail,
    })

    return session
  } catch (error) {
    console.error('Error creating job posting checkout session:', error)
    throw new Error('Failed to create checkout session')
  }
}
