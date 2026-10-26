import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * Server-only database client. Imported ONLY from server functions and
 * server routes (src/server/*) — never from a client component.
 *
 * The Pool constructor does NOT connect — the first query does. So a
 * missing DATABASE_URL is harmless at import time and fails loudly on
 * first query, with the message below. (Do not "fix" this by throwing
 * at import: the app must still build and boot far enough to render
 * an error page when the DB is not wired up yet.)
 */
const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://localhost:5432/not-configured'

const pool = new Pool({ connectionString, max: 10 })

pool.on('error', (err) => {
  console.error(
    'Postgres pool error. Check DATABASE_URL (on Railway: ${{Postgres.DATABASE_URL}}).',
    err,
  )
})

export const db = drizzle(pool, { schema })
