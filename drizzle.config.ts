import { defineConfig } from 'drizzle-kit'

// The fallback URL exists only so `drizzle-kit generate` works before a
// real DATABASE_URL is set. Generation never touches a database.
// `drizzle-kit migrate` always uses the real DATABASE_URL.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://user:password@localhost:5432/tanstack_saas',
  },
})
