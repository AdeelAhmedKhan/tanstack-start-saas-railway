import { createServerFn } from '@tanstack/react-start'
import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { user } from './db/schema'
import { requireAuth, getSessionUser } from './session'

/**
 * Stripe billing — env-gated. With no STRIPE_SECRET_KEY / STRIPE_PRICE_ID
 * set, `getBillingStatus` reports configured: false and checkout throws
 * a plain-English error. No real keys are ever in this repo.
 */

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

export const isBillingConfigured = () =>
  Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID)

export const getBillingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const me = await requireAuth()
    return { configured: isBillingConfigured(), plan: me.plan, email: me.email }
  },
)

/**
 * Public variant for the pricing page: never throws, never redirects.
 * Signed-out visitors see configured + plan 'free' + signedIn false.
 */
export const getPublicBillingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const me = await getSessionUser()
    return {
      configured: isBillingConfigured(),
      plan: me?.plan ?? 'free',
      signedIn: Boolean(me),
    }
  },
)

export const createCheckoutSession = createServerFn({
  method: 'POST',
}).handler(async () => {
  const me = await requireAuth()
  const stripe = getStripe()
  const priceId = process.env.STRIPE_PRICE_ID
  const appUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL
  if (!stripe || !priceId || !appUrl) {
    throw new Error(
      'Billing is not configured. Set STRIPE_SECRET_KEY, STRIPE_PRICE_ID and APP_URL, then try again.',
    )
  }

  const [row] = await db
    .select({ stripeCustomerId: user.stripeCustomerId })
    .from(user)
    .where(eq(user.id, me.id))
    .limit(1)

  let customerId = row?.stripeCustomerId ?? undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: me.email,
      name: me.name,
      metadata: { userId: me.id },
    })
    customerId = customer.id
    await db
      .update(user)
      .set({ stripeCustomerId: customerId })
      .where(eq(user.id, me.id))
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?billing=success`,
    cancel_url: `${appUrl}/pricing?billing=cancelled`,
  })
  if (!session.url) throw new Error('Stripe did not return a checkout URL.')
  return { url: session.url }
})
