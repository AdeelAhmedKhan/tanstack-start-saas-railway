import { createAuthClient } from 'better-auth/react'

/**
 * Client-side auth. No baseURL is set on purpose: Better Auth defaults
 * to the current origin, which is exactly right on Railway (the app
 * serves its own /api/auth/* routes) and locally.
 */
export const authClient = createAuthClient()
