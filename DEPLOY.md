# Deploying ActProve to Vercel

The app is a standard Next.js 14 project and is Vercel-ready. Follow these
steps in order.

## 1. Provision the database (Supabase)

1. Create a Supabase project.
2. SQL Editor → paste **`supabase/setup.sql`** → Run. (Tables, RLS, triggers,
   and the `evidence-files` storage bucket.)
3. Authentication → Providers: enable **Google** if you want Google login.

## 2. Push to GitHub & import to Vercel

1. Push this repo to GitHub.
2. In Vercel → **Add New Project** → import the repo. Framework is detected as
   **Next.js**; leave Build & Output settings at their defaults.
   - Build command runs `prisma generate && next build` (already configured).

## 3. Set environment variables in Vercel

Add these under **Project → Settings → Environment Variables** (Production +
Preview). Names match `.env.example`.

**Required for the app to run:**
- `NEXT_PUBLIC_APP_URL` — your Vercel URL (e.g. `https://actprove.vercel.app`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (pooled), `DIRECT_URL` (direct) — from Supabase → Database
- `ENCRYPTION_KEY` — any long random string

**Enable features (optional, add when ready):**
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER_MONTHLY`,
  `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_TEAM_MONTHLY`
- AI / email: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Optional: `UPSTASH_REDIS_REST_URL/TOKEN`, `GITHUB_CLIENT_ID/SECRET`,
  `INNGEST_*`, `SCIM_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY`, `LOOPS_API_KEY`,
  `CRON_SECRET`

## 4. Point Supabase Auth at your domain

Supabase → Authentication → URL Configuration:
- **Site URL:** your Vercel URL
- **Redirect URLs:** add `https://<your-domain>/auth/callback`

This makes email verification, magic links, password reset, and Google OAuth
redirect back correctly.

## 5. Stripe webhook (if using billing)

Stripe → Developers → Webhooks → add endpoint:
`https://<your-domain>/api/stripe/webhook` → copy the signing secret into
`STRIPE_WEBHOOK_SECRET`. Create one monthly Price per plan and set the
`STRIPE_PRICE_*` vars.

## 6. Seed reference data

Once `DATABASE_URL` is set, from your machine (or a one-off job):

```bash
npm run db:seed   # regulation updates + ISO 42001 / NIS2 / DORA frameworks
```

## Notes & gotchas

- **PDF generation** uses `@sparticuz/chromium` + `puppeteer-core` on Vercel
  (already wired; the binary is excluded from the webpack bundle via
  `next.config.mjs`). The PDF routes are `nodejs` runtime with `maxDuration: 60`
  (see `vercel.json`). On the **Hobby** plan memory is capped at 1024 MB which
  usually works; **Pro** is recommended for reliable PDF rendering and higher
  function memory.
- **Cron**: the monthly digest (`/api/cron/digest`) is configured in
  `vercel.json` and runs automatically on Vercel. Protect it with `CRON_SECRET`.
- **Inngest**: connect your Vercel deployment in the Inngest dashboard; the sync
  endpoint is `/api/inngest`. Without keys it simply stays idle.
- **Local PDF testing** needs Chrome installed (puppeteer-core uses the `chrome`
  channel) or set `PUPPETEER_EXECUTABLE_PATH`. This does not affect Vercel.
- Marketing pages and the OG image work without any keys; everything DB-backed
  needs steps 1 & 3 complete.
