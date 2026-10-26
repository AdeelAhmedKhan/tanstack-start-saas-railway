import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import '../styles.css'

function Nav() {
  const { data: session } = authClient.useSession()
  return (
    <nav className="nav">
      <Link to="/" className="brand">
        TanStack SaaS
      </Link>
      <Link to="/pricing">Pricing</Link>
      {session?.user ? (
        <Link to="/dashboard">Dashboard</Link>
      ) : null}
      <span className="spacer" />
      {session?.user ? (
        <>
          <span className="who">{session.user.email}</span>
          <button
            className="btn secondary"
            onClick={async () => {
              await authClient.signOut()
              window.location.href = '/'
            }}
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link to="/sign-in">Sign in</Link>
          <Link to="/sign-up" className="btn">
            Get started
          </Link>
        </>
      )}
    </nav>
  )
}

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Nav />
        <main className="container">
          <Outlet />
        </main>
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start 1.0 SaaS Starter' },
      {
        name: 'description',
        content:
          'TanStack Start 1.0 SaaS starter: type-safe routing, Postgres + Drizzle, Better Auth, Stripe billing, Railway Bucket uploads.',
      },
    ],
  }),
  component: RootComponent,
})
