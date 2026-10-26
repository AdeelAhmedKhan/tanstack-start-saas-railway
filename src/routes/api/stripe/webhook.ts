import { createFileRoute } from '@tanstack/react-router'
import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { db } from '../../../server/db'
import { user } from '../../../server/db/schema'

/**
 * Stripe webhook — POST /api/stripe/webhook.
 * Set STRIPE_WEBHOOK_SECRET (Stripe dashboard > Developers > Webhooks,
 * endpoint: https://<your-domain>/api/stripe/webhook) to verify the
 * signature. Without it, the payload is accepted unverified — only
 * for local testing, never in production.
 *
 * Handled events:
 *  - checkout.session.completed  -> plan = 'pro'
 *  - customer.subscription.deleted -> plan = 'free'
 * Add more (invoice.payment_failed, …) in the switch below.
 */
export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
        if (!secret) {
          return Response.json({ error: 'Stripe is not configured.' }, { status: 503 })
        }
        const stripe = new Stripe(secret)
        const rawBody = await request.text()

        let event: Stripe.Event
        try {
          if (webhookSecret) {
            const signature = request.headers.get('stripe-signature')
            if (!signature) throw new Error('Missing stripe-signature header.')
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
          } else {
            console.warn(
              'STRIPE_WEBHOOK_SECRET is not set — accepting webhook unverified. Local testing only.',
            )
            event = JSON.parse(rawBody) as Stripe.Event
          }
        } catch (err) {
          console.error('Webhook signature verification failed:', err)
          return Response.json({ error: 'Invalid signature.' }, { status: 400 })
        }

        try {
          if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            if (typeof session.customer === 'string') {
              await db
                .update(user)
                .set({ plan: 'pro' })
                .where(eq(user.stripeCustomerId, session.customer))
            }
          } else if (event.type === 'customer.subscription.deleted') {
            const sub = event.data.object as Stripe.Subscription
            if (typeof sub.customer === 'string') {
              await db
                .update(user)
                .set({ plan: 'free' })
                .where(eq(user.stripeCustomerId, sub.customer))
            }
          }
        } catch (err) {
          console.error('Webhook handler failed:', err)
          return Response.json({ error: 'Handler failed.' }, { status: 500 })
        }
        return Response.json({ received: true }, { status: 200 })
      },
    },
  },
})
