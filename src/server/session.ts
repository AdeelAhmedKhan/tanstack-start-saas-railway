import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth'

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
      return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as { role?: string }).role ?? 'user',
        plan: (session.user as { plan?: string }).plan ?? 'free',
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
