import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './db/schema'

/**
 * Better Auth 1.7 — server-only. Email + password only, on purpose:
 * OAuth providers are a one-block addition (see README).
 *
 * Required env: BETTER_AUTH_SECRET (32+ chars), BETTER_AUTH_URL.
 *
 * The secret is validated at boot on purpose. Better Auth's own
 * failure mode for a missing secret is an unhandled rejection on the
 * first auth request, which kills the process — a fresh deploy with
 * the variable missing would crash-loop with no clear message. Failing
 * here gives one loud, exact error in the startup logs instead.
 * On Railway the template generates this value automatically
 * (secret() in the Template Composer), so a template deploy always
 * has it. Locally: openssl rand -base64 32.
 */
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    'BETTER_AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and set it in .env (locally) or as a service variable (Railway — the template generates it for you). The app cannot start without it.',
  )
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // Email verification is OFF so a fresh deploy works end-to-end
    // without an email provider. Turn it on before inviting real
    // users: requireEmailVerification: true + an email plugin.
    // See README "Hardening before real users".
    requireEmailVerification: false,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
})
