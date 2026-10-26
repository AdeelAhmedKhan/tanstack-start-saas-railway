import { createFileRoute } from '@tanstack/react-router'
import { auth } from '../../../server/auth'

/**
 * Better Auth handler — all /api/auth/* requests (sign-in, sign-up,
 * sign-out, session, …) go through here. The `$` splat catches every
 * sub-path under /api/auth/.
 */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
})
