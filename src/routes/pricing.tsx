import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getPublicBillingStatus, createCheckoutSession } from '../server/billing'

function Pricing() {
  const data = Route.useLoaderData()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function checkout() {
    setError(null)
    setBusy(true)
    try {
      const { url } = await createCheckoutSession()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.')
      setBusy(false)
    }
  }

  return (
    <>
      <h1>Pricing</h1>
      <p className="muted">
        {data.signedIn
          ? `Your plan: ${data.plan}`
          : 'Sign in to upgrade — checkout needs an account.'}
      </p>
      <section className="grid">
        <div className="card">
          <h3>Free</h3>
          <p className="muted">For trying things out.</p>
          <ul>
            <li>Unlimited projects</li>
            <li>Community support</li>
          </ul>
          <p>$0 / forever</p>
        </div>
        <div className="card">
          <h3>Pro</h3>
          <p className="muted">For shipping for real.</p>
          <ul>
            <li>Everything in Free</li>
            <li>File uploads to your Bucket</li>
            <li>Priority support</li>
          </ul>
          {!data.configured ? (
            <p className="muted">
              Billing is not configured on this deploy yet. Set
              STRIPE_SECRET_KEY and STRIPE_PRICE_ID — see README.
            </p>
          ) : !data.signedIn ? (
            <p className="muted">Sign in first, then come back here.</p>
          ) : data.plan === 'pro' ? (
            <p className="ok">You are on Pro. Thank you!</p>
          ) : (
            <button className="btn" onClick={() => void checkout()} disabled={busy}>
              {busy ? 'Redirecting…' : 'Upgrade to Pro'}
            </button>
          )}
          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>
    </>
  )
}

export const Route = createFileRoute('/pricing')({
  loader: async () => {
    return getPublicBillingStatus()
  },
  component: Pricing,
})
