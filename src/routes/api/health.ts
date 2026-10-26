import { createFileRoute } from '@tanstack/react-router'
import { sql } from 'drizzle-orm'
import { db } from '../../server/db'

/**
 * Healthcheck — also the Railway deploy healthcheck (railway.toml:
 * healthcheckPath = "/api/health").
 *
 * MUST return HTTP 200 directly (Railway does not follow redirects).
 * The DB is reported, not fatal: a deploy with a not-yet-provisioned
 * database still answers 200 with { status: "degraded", db: "error" }
 * so you can see the problem in the response instead of a failed
 * deploy loop. Once Postgres is wired up it reports db: "ok".
 */
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        let dbStatus = 'ok'
        try {
          await db.execute(sql`SELECT 1`)
        } catch {
          dbStatus = 'error'
        }
        return Response.json(
          {
            status: dbStatus === 'ok' ? 'ok' : 'degraded',
            db: dbStatus,
            uptimeSeconds: Math.floor(process.uptime()),
            version: '0.1.0',
          },
          { status: 200 },
        )
      },
    },
  },
})
