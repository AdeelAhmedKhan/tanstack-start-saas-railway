import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from './db'
import { projects } from './db/schema'
import { requireAuth } from './session'

/** Example app data: one project per row, owned by the signed-in user. */

export const listProjects = createServerFn({ method: 'GET' }).handler(
  async () => {
    const me = await requireAuth()
    const rows = await db
      .select({ id: projects.id, name: projects.name, createdAt: projects.createdAt })
      .from(projects)
      .where(eq(projects.ownerId, me.id))
      .orderBy(desc(projects.createdAt))
      .limit(50)
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt.toISOString(),
    }))
  },
)

export const createProject = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string().trim().min(1).max(100) }))
  .handler(async ({ data }) => {
    const me = await requireAuth()
    const [row] = await db
      .insert(projects)
      .values({ id: randomUUID(), name: data.name, ownerId: me.id })
      .returning({ id: projects.id, name: projects.name })
    return row
  })
