export function isStripeConfigured(): boolean {
  const k = process.env.STRIPE_SECRET_KEY?.trim() || ''
  return k.length > 0 && !k.includes('dummy')
}

export function getStripeMode(): 'live' | 'test' | 'unset' {
  if (!isStripeConfigured()) return 'unset'
  const k = process.env.STRIPE_SECRET_KEY || ''
  return k.startsWith('sk_live') ? 'live' : 'test'
}

export function stripeWebhookSecretConfigured(): boolean {
  const s = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  return !!s && s.length > 0
}

/** Client-safe: publishable key only */
export function stripePublishableConfigured(): boolean {
  const k = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  return !!k && k.length > 0
}

export function stripePublishableIsLive(): boolean {
  const k = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  return k.startsWith('pk_live')
}
