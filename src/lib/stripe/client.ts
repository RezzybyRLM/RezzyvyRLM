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

export async function createSubscriptionCheckoutSession(
  planType: 'basic' | 'pro' | 'enterprise',
  userId: string,
  userEmail: string
) {
  // Plan pricing (monthly)
  const planPrices: Record<string, number> = {
    basic: 999, // $9.99 in cents
    pro: 1999, // $19.99 in cents
    enterprise: 4999, // $49.99 in cents (custom pricing)
  }

  const planNames: Record<string, string> = {
    basic: 'Basic Plan',
    pro: 'Pro Plan',
    enterprise: 'Enterprise Plan',
  }

  const planDescriptions: Record<string, string> = {
    basic: '50 Job Searches, 20 Applications, 100 Bookmarks, 10 AI Resume Matches, 5 AI Interview Sessions, 3 Job Alerts',
    pro: '200 Job Searches, 100 Applications, 500 Bookmarks, 50 AI Resume Matches, 25 AI Interview Sessions, 10 Job Alerts',
    enterprise: 'Unlimited everything with dedicated support',
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planNames[planType],
              description: planDescriptions[planType],
              images: ['https://rezzybyrlm.com/logo.png'],
            },
            unit_amount: planPrices[planType],
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/plans`,
      metadata: {
        type: 'subscription',
        plan_type: planType,
        user_id: userId,
      },
      customer_email: userEmail,
      subscription_data: {
        metadata: {
          plan_type: planType,
          user_id: userId,
        },
      },
    })

    return session
  } catch (error) {
    console.error('Error creating subscription checkout session:', error)
    throw new Error('Failed to create checkout session')
  }
}

const SAMPLE_PACKAGE_PRODUCTS: Record<
  string,
  { amountCents: number; name: string; description: string }
> = {
  essential: {
    amountCents: 20_000,
    name: 'Essential Resume Package',
    description: 'Consultation, one-page resume & bio, cover letter, revisions, vCard + QR',
  },
  definitive: {
    amountCents: 50_000,
    name: 'Definitive Resume Package',
    description: 'Full consultation, resume suite, LinkedIn, coaching, and extras',
  },
  accelerated: {
    amountCents: 30_000,
    name: 'Accelerated Resume Package',
    description: 'Extended consultation, resume & bio, cover letter, references, thank-you letters',
  },
}

export function getSamplePackageProduct(packageKey: string) {
  return SAMPLE_PACKAGE_PRODUCTS[packageKey] ?? null
}

export async function createOneTimePackageCheckoutSession(
  packageKey: string,
  userId: string,
  userEmail: string
) {
  const product = getSamplePackageProduct(packageKey)
  if (!product) {
    throw new Error('Unknown package')
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
              images: ['https://rezzybyrlm.com/logo.png'],
            },
            unit_amount: product.amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${site}/dashboard?checkout_success=package&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/plans`,
      metadata: {
        type: 'resume_package',
        package_key: packageKey,
        user_id: userId,
      },
      customer_email: userEmail || undefined,
    })

    return session
  } catch (error) {
    console.error('Error creating package checkout session:', error)
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
