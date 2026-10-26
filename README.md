# TanStack Start 1.0 SaaS Starter — Deploy on Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/tanstack-start-saas-railway)
<!-- TODO: replace the link above with this template's real Railway
     marketplace URL after publishing. The button image stays the same. -->

A production-wired SaaS starter: **TanStack Start 1.0** (type-safe routing,
`createServerFn`, per-route rendering) + **Postgres + Drizzle ORM** +
**Better Auth** (email) + **Stripe** billing + **Railway Bucket** uploads.
One-click deploy on Railway; nothing in here is a demo stub — auth, DB,
billing, storage, healthcheck, and seed admin all work, and anything not
configured tells you so instead of crashing.

## Stack & versions (pinned, verified 2026-10-26)

| Piece | Version | Notes |
| --- | --- | --- |
| TanStack Start (`@tanstack/react-start`) | 1.169.4 | Stable 13 Oct 2026 |
| TanStack Router (`@tanstack/react-router`) | 1.170.46 | File-based, type-safe routes |
| TanStack Query (`@tanstack/react-query`) | 5.104.5 | |
| Vite | 8.3.5 | Start 1.0 requires Vite 8 |
| React | 19.3.1 | |
| TypeScript | 5.9.3 | Deliberately 5.9, not 7 — see below |
| Drizzle ORM / Drizzle Kit | 0.45.4 / 0.31.11 | Postgres |
| Better Auth | 1.7.13 | Email + password, Drizzle adapter |
| Stripe (`stripe` npm) | 23.0.1 | Checkout + webhook |
| `pg` | 8.23.1 | Postgres driver |
| srvx | 1.0.7 | Production server runtime |
| Node | ≥ 22.18 (24 recommended) | |

**Why no Nitro?** Start 1.0's Railway option uses Nitro, but Nitro's only
published dist-tag is currently a 3.0 beta. This starter uses Start's
default srvx server runtime instead — Railway's own guide confirms its
builder picks srvx for a plain Vite build, and `npm run start` makes the
choice explicit. If you prefer Nitro later, add the `nitro()` Vite plugin
and change `start` to `node .output/server/index.mjs`.

**Why TypeScript 5.9, not 7?** TypeScript 7.0.2 exists, but it is a new
native rewrite and tooling support is still catching up. A starter should
build everywhere on day one; 5.9.3 does.

## What you get

- **Routes** — `/` landing (with live `/api/health` status), `/sign-in`,
  `/sign-up`, `/dashboard` (protected server-side), `/pricing`.
- **Auth** — email + password via Better Auth, sessions in Postgres.
  `/dashboard` redirects to `/sign-in` when signed out, enforced by a
  server function, not just client-side.
- **Database** — Drizzle schema (`user`, `session`, `account`,
  `verification`, `projects`), generated migrations in `drizzle/`,
  `npm run db:seed` creates an admin + demo project.
- **Billing** — Stripe Checkout + webhook (`checkout.session.completed`
  → plan `pro`, `customer.subscription.deleted` → plan `free`). Env-gated:
  without keys, `/pricing` says billing is not configured.
- **Uploads** — presigned S3-compatible uploads straight to a Railway
  Bucket; files never pass through the server. Env-gated the same way.
- **Healthcheck** — `GET /api/health` returns HTTP 200 with DB status;
  Railway uses it as the deploy healthcheck (`railway.toml`).

## Run it locally

```bash
cp .env.example .env   # then fill in DATABASE_URL + BETTER_AUTH_SECRET
npm install
npm run db:generate    # already-generated migrations live in drizzle/
npm run db:migrate     # needs a reachable Postgres
npm run db:seed        # needs ADMIN_EMAIL + ADMIN_PASSWORD in .env
npm run dev            # http://localhost:3000
```

You need a Postgres for anything past the landing page. The landing page
and `/api/health` work without one (health reports `db: "error"`).

## Deploy on Railway (exact steps)

1. Click **Deploy on Railway** above (or deploy this repo from GitHub).
2. In the new Railway project, add a **Postgres** service.
3. On the app service, add a reference variable:
   `DATABASE_URL = ${{Postgres.DATABASE_URL}}`
4. Set the app service variables (see `.env.example` for the full list):
   - `BETTER_AUTH_SECRET` — the Railway template generates this
     automatically (`secret()` in the Template Composer); locally,
     generate with `openssl rand -base64 32`. The app refuses to boot
     without it, by design (see `src/server/auth.ts`).
   - `BETTER_AUTH_URL` and `APP_URL` — your Railway public domain
     (e.g. `https://your-app.up.railway.app`)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — only needed once, for the seed
5. Set the **pre-deploy command** on the app service to
   `npm run db:migrate` (also in `railway.toml`). Migrations run before
   each deploy; a failed migration stops the deploy before the app starts.
6. Generate a public domain (Networking → Generate Domain).
7. Deploy. Railway healthchecks `GET /api/health` — it must answer 200.
8. Optional, once: run the seed against the Railway database
   (`DATABASE_URL` from Railway, then `npm run db:seed`), or run it as a
   one-off in the Railway dashboard with the same env vars.
9. Optional billing: create a Price in Stripe (test mode first), set
   `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, and
   add a webhook endpoint
   `https://<your-domain>/api/stripe/webhook` with its
   `STRIPE_WEBHOOK_SECRET`. Stripe CLI (`stripe listen`) works for local
   testing.
10. Optional uploads: add a **Bucket** service and set `S3_ENDPOINT`,
    `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` (and
    `S3_PUBLIC_URL` if the bucket is public).

## What it costs to run

Railway charges for what the services actually use — there is no fixed
price for this template. A realistic small deployment:

| Service | Typical usage | Notes |
| --- | --- | --- |
| App (1 vCPU, ~512 MB) | ~$5–10/mo | The app idles low; SSR spikes with traffic |
| Postgres | ~$5/mo | Small volume; grows with data |
| Bucket | ~$0–1/mo | Pay for stored GB + egress |

Roughly **~$10–15/mo** for a small production app, plus Stripe fees
only when you actually take payments (Stripe takes its cut per
transaction; there is no monthly Stripe fee for this setup). The app
itself needs about 512 MB RAM — set at least that on the service, or
the Node process may get OOM-killed under load. Verify against
[Railway's pricing page](https://railway.com/pricing) before promising
a number to anyone; Railway's prices change.

## How to add API keys

- **Stripe** — Stripe dashboard → Developers → API keys (test mode
  first). `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_PRICE_ID` (Products → your Pro price), `STRIPE_WEBHOOK_SECRET`
  (Developers → Webhooks → your endpoint). Rotate in the dashboard;
  update the Railway variable; redeploy.
- **Any other provider** — add the key as a Railway service variable
  (never in the repo, never in a `VITE_` variable — `VITE_*` values are
  baked into the client bundle and anyone can read them). Read it with
  `process.env` in a server function only.
- **Rotating a leaked secret** — change it at the provider, update the
  Railway variable, redeploy. Rotating `BETTER_AUTH_SECRET` logs out
  every session; rotating `STRIPE_WEBHOOK_SECRET` needs the webhook
  endpoint updated in Stripe too.

## How to back up

- **Postgres** — Railway's Postgres has backups/PITR as an opt-in
  feature; enable it in the database service settings. Additionally,
  take a logical dump on a schedule you control:
  `pg_dump "$DATABASE_URL" > backup-$(date +%F).sql` and store it
  somewhere other than Railway. Test a restore at least once — an
  untested backup is not a backup.
- **Bucket files** — objects in a Bucket are not in the database dump.
  Copy them out on the same schedule (`aws s3 sync` against the
  S3-compatible endpoint works).
- **Code + config** — the repo is the backup for code. Service variables
  are not in the repo by design; keep a copy of the variable *names*
  (not values) in `.env.example` and the values in Railway.

## How to update

- **Dependencies** — `npm outdated`, bump one major at a time, then
  `npm install && npm run build && npm run typecheck`. Pay attention to
  TanStack Start / Router (they move together) and Better Auth
  (read its changelog — auth table changes need a migration).
- **Schema** — edit `src/server/db/schema.ts`, run
  `npm run db:generate`, review the SQL in `drizzle/`, commit it, deploy
  (the pre-deploy command applies it).
- **TanStack Start** — follow the migration notes in the TanStack docs
  for the version you are moving to; 1.x is stable-API, so minor bumps
  should be dependency bumps only.
- **This template** — if you deployed from the marketplace, you get a
  notification when the template updates; pull the changes into your
  repo yourself — Railway does not auto-update your copy.

## Hardening before real users

- Turn on email verification in `src/server/auth.ts`
  (`requireEmailVerification: true`) and add an email plugin, so
  nobody can register with someone else's address.
- Set `STRIPE_WEBHOOK_SECRET` — without it the webhook accepts
  unverified payloads (local testing only).
- Add rate limiting on `/api/auth/*` (Better Auth has a rate-limit
  option) and a CAPTCHA on sign-up if you get abuse. Behind Railway's
  proxy, also configure Better Auth's `advanced.ipAddress` trusted
  proxies/headers so rate limiting sees real client IPs instead of
  one shared bucket (it warns about this in the logs otherwise).
- Review the `plan` gating: this starter records the plan but does not
  gate features on it — add your own checks in server functions.

## Project layout

```
src/
  router.tsx            route tree + router creation
  styles.css            dependency-free styles
  routes/               file-based routes (/, /dashboard, /pricing, …)
    api/health.ts       GET /api/health (Railway healthcheck)
    api/auth/$.ts       Better Auth handler (/api/auth/*)
    api/stripe/webhook.ts
  lib/auth-client.ts    Better Auth React client
  server/               SERVER-ONLY code — never import from components
    db/                 Drizzle schema + client
    auth.ts             Better Auth config
    session.ts          getSessionUser / requireAuth server fns
    billing.ts          Stripe checkout + billing status
    storage.ts          Bucket presigned uploads
    projects.ts         example app data (server fns)
scripts/seed.ts         admin + demo project seed
drizzle/                generated migrations (commit these)
railway.toml            build/start/healthcheck/pre-deploy config
```

See `AGENTS.md` for the rules AI agents should follow in this repo.

## License

MIT — see `LICENSE`.
