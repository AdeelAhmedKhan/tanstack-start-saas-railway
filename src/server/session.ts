import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { auth } from './auth'
import { db } from './db'
import { user as userTable } from './db/schema'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  plan: string
}

/**
 * Read the current session from the request cookies, server-side.
 * Returns null (never throws) when there is no session — use
 * `requireAuth` when a route must be protected.
 */
export const getSessionUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    try {
      const session = await auth.api.getSession({
        headers: getRequestHeaders(),
      })
      if (!session?.user) return null
      // Better Auth's session user object only carries its own core
      // fields — the app columns (role, plan, stripeCustomerId) are
      // NOT in it. Read them from the user row instead, or every user
      // looks like role 'user' / plan 'free' forever: the seeded admin
      // would show as a plain user, and a paying Pro user would still
      // be offered "Upgrade to Pro" after checkout.
      const [row] = await db
        .select({ role: userTable.role, plan: userTable.plan })
        .from(userTable)
        .where(eq(userTable.id, session.user.id))
        .limit(1)
      return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: row?.role ?? (session.user as { role?: string }).role ?? 'user',
        plan: row?.plan ?? (session.user as { plan?: string }).plan ?? 'free',
      }
    } catch {
      return null
    }
  },
)

/**
 * Server function for protected routes. Call it in a route's
 * `beforeLoad`; it throws a redirect to /sign-in when not signed in.
 * Server functions that mutate data should call this first too —
 * never trust a client-side session check alone.
 */
export const requireAuth = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser> => {
    const user = await getSessionUser()
    if (!user) {
      throw redirect({ to: '/sign-in' })
    }
    return user
  },
)
