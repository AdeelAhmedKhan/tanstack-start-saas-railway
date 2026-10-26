/**
 * Seed script — creates the admin user and one demo project.
 *
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='...' npm run db:seed
 *
 * Safe to re-run: if the admin already exists, sign-up returns the
 * existing user and the script just makes sure role = 'admin' and the
 * demo project exists. Requires a reachable DATABASE_URL and
 * BETTER_AUTH_SECRET (same env the app uses).
 */
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { auth } from '../src/server/auth'
import { db } from '../src/server/db'
import { user, projects } from '../src/server/db/schema'

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding.')
  }
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET is not set.')
  }

  let adminId: string
  try {
    const res = await auth.api.signUpEmail({
      body: { name: 'Admin', email, password },
      headers: new Headers(),
    })
    adminId = res.user.id
    console.log(`Created admin user: ${email}`)
  } catch (err) {
    // Most likely the user already exists — look them up instead.
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1)
    if (!existing) throw err
    adminId = existing.id
    console.log(`Admin user already exists: ${email}`)
  }

  await db.update(user).set({ role: 'admin' }).where(eq(user.id, adminId))

  const [demo] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.ownerId, adminId))
    .limit(1)
  if (!demo) {
    await db.insert(projects).values({
      id: randomUUID(),
      name: 'Demo project',
      ownerId: adminId,
    })
    console.log('Created demo project.')
  } else {
    console.log('Demo project already exists.')
  }

  console.log('Seed complete.')
}

main().catch((err) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
