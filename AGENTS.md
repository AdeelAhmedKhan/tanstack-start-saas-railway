# AGENTS.md — working in this repo

Read this before changing anything. The user of this repo is a developer
deploying a SaaS starter on Railway; keep it runnable, minimal, and honest.

## Stack (pinned — do not bump majors casually)

TanStack Start 1.0.169.4 + Vite 8.3.5 + React 19.3.1 + TypeScript 5.9.3
(deliberately 5.9, not 7) + Drizzle ORM 0.45.4 + Better Auth 1.7.13 +
Stripe 23.0.1 + srvx 1.0.7 as the production server. Nitro is NOT used
(it is a 3.0 beta); the default srvx layout is what Railway's builder
expects. See README "Why no Nitro?".

## The one rule that matters

**`src/server/*` is server-only.** It imports `pg`, `stripe`, and the
AWS SDK. Never import it from a client component. Client code talks to
the server only through `createServerFn` exports and `/api/*` routes.
If you add a feature that needs the DB, Stripe, or a Bucket, put the
logic in `src/server/` and expose a server function.

## Layout

- `src/routes/` — file-based routes. A route file may define
  `beforeLoad` / `loader` / `component`, and `server.handlers` for
  API-only routes (`/api/health`, `/api/auth/$`, `/api/stripe/webhook`).
- `src/server/db/schema.ts` — the only place tables are defined.
- `src/server/session.ts` — `requireAuth()` is how routes are
  protected. Call it in `beforeLoad` AND in every mutating server fn.
- `src/server/billing.ts`, `src/server/storage.ts` — env-gated: no keys
  means a clear "not configured" state, never a crash, never a fake.
- `scripts/seed.ts` — admin + demo project. Safe to re-run.

## Commands

```bash
npm run dev          # vite dev on :3000
npm run build        # vite build (also generates src/routeTree.gen.ts)
npm run typecheck    # tsc --noEmit — run after every change
npm run db:generate  # after editing src/server/db/schema.ts
npm run db:migrate   # needs a reachable DATABASE_URL
npm run db:seed      # needs ADMIN_EMAIL + ADMIN_PASSWORD
npm run start        # srvx production server (dist/ must exist)
```

## Do / Don't

- DO run `npm run build` + `npm run typecheck` after changes and fix
  real errors. Do not claim a build passes if it did not.
- DO keep `drizzle-kit` in `dependencies` (Railway's pre-deploy
  migration step needs it in the deployed image).
- DO keep secrets out of the repo. `.env.example` holds placeholders
  only. `VITE_*` variables reach the browser — never put a secret in
  one.
- DON'T hand-edit `src/routeTree.gen.ts` (generated) or anything in
  `drizzle/` (regenerate with `npm run db:generate`).
- DON'T add a feature that needs a new env var without documenting it
  in `.env.example` and README.
- DON'T add Tailwind, a component library, or another framework
  without being asked — the starter is dependency-light on purpose.
- DON'T invent versions. Check `npm view <pkg> version` before pinning.
- DON'T push, deploy, or publish from here. This repo is prepared
  locally; pushing and Railway template creation are separate,
  human-approved steps.
