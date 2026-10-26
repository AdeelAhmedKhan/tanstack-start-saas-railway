import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

function HealthBadge() {
  const [health, setHealth] = useState<string>('checking…')
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((j: { status?: string; db?: string }) =>
        setHealth(`${j.status ?? 'unknown'} · db: ${j.db ?? 'unknown'}`),
      )
      .catch(() => setHealth('unreachable'))
  }, [])
  return <p className="muted">Server status: {health}</p>
}

function Home() {
  return (
    <>
      <section className="hero">
        <h1>Ship your SaaS, not your boilerplate.</h1>
        <p>
          TanStack Start 1.0, Postgres + Drizzle, Better Auth, Stripe
          billing, and Railway Bucket uploads — wired up, one-click
          deployable on Railway.
        </p>
        <Link to="/sign-up" className="btn">
          Create an account
        </Link>{' '}
        <Link to="/pricing" className="btn secondary">
          See pricing
        </Link>
        <HealthBadge />
      </section>

      <section className="grid">
        <div className="card">
          <h3>Type-safe, end to end</h3>
          <p className="muted">
            File-based routes, typed search params, and{' '}
            <code>createServerFn</code> — the compiler catches a broken
            route before your users do.
          </p>
        </div>
        <div className="card">
          <h3>Auth that just works</h3>
          <p className="muted">
            Email + password with Better Auth, sessions in Postgres,
            protected routes enforced on the server.
          </p>
        </div>
        <div className="card">
          <h3>Billing, env-gated</h3>
          <p className="muted">
            Stripe Checkout + webhook. No keys configured? Pricing tells
            you so instead of crashing.
          </p>
        </div>
        <div className="card">
          <h3>Uploads to a Bucket</h3>
          <p className="muted">
            Presigned S3-compatible uploads straight to a Railway Bucket —
            files never pass through your server.
          </p>
        </div>
      </section>

      <section className="card">
        <h3>What this starter proves</h3>
        <ul>
          <li>
            <code>GET /api/health</code> — 200 with DB status, used as the
            Railway deploy healthcheck.
          </li>
          <li>
            <code>/dashboard</code> — protected server-side; create a
            project, upload a file.
          </li>
          <li>
            Migrations run as a Railway pre-deploy command, so a bad
            migration stops the deploy before the app starts.
          </li>
        </ul>
      </section>
    </>
  )
}

export const Route = createFileRoute('/')({ component: Home })
