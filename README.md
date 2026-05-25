# ActProve

**EU AI Act Compliance Operations Platform for SMBs.**

From AI inventory to audit-ready compliance documentation, living registers, and
client-facing Trust Pages — in under 2 hours. Phase 1 MVP.

## Tech stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Framework | Next.js 14 (App Router) + TypeScript (strict)     |
| Styling   | Tailwind CSS + shadcn/ui (Radix)                  |
| API       | tRPC (internal) + Next.js Route Handlers (public) |
| Database  | Supabase (PostgreSQL) + Prisma ORM                |
| Auth      | Supabase Auth (password, magic link, Google)      |
| Payments  | Stripe (subscriptions + webhooks)                 |
| Email     | Resend + React Email                              |
| PDF       | Puppeteer (headless Chrome)                       |
| AI        | Anthropic Claude (`claude-sonnet-4-5`)            |

## What's implemented

- **Auth & onboarding** — sign-up/login/reset, 5-step onboarding wizard, org provisioning.
- **AI System Inventory** — catalog quick-add (30+ tools), 4-step manual wizard, card/table views, detail page.
- **Risk Classification Engine** — rule-based decision tree + Claude escalation for borderline cases, obligations checklists.
- **Living Register** — audit-ready table with EU AI Act article references + Puppeteer PDF export.
- **Document Generator** — Claude-backed transparency notices, AI usage policies, etc. (template fallback when no API key), inline editor, PDF.
- **Trust Page & Badge** — public ISR page + dynamic SVG badge endpoint + settings.
- **Stripe billing** — checkout, customer portal, webhooks, trial → read-only enforcement.
- **Regulation Monitor** — seeded feed, deadline timeline, personalized impact, monthly digest cron.
- **Questionnaire auto-fill, AI Literacy tracker (+ public acknowledgment), Evidence Vault, Team management.**

## Phase 2 additions

- **Multi-regulation frameworks** — activate ISO 42001 / NIS2 / DORA with a gap-analysis wizard that reuses your EU AI Act data; obligations Kanban (drag-and-drop) and a unified compliance score.
- **Sector modules & custom risk rules** — healthcare/finance/HR risk overrides plus an internal custom-rules engine layered on the classifier.
- **AI Compliance Advisor** — chat grounded in a retrieval KB of EU AI Act articles + your own systems, with citations and history (Claude, offline fallback).
- **Public REST API + webhooks** — hashed API keys, `/api/v1/*` endpoints with per-key rate limiting and usage logging, HMAC-signed webhooks, `/developers` docs.
- **Integration marketplace** — connector catalog + shadow-IT discovery (functional CSV/expense import; cloud OAuth scaffolded) with a candidate-review flow.
- **Command palette (⌘K), compliance calendar (+ iCal export), gamified onboarding journey.**
- **Enterprise** — audit mode (read-only auditor portal `/audit/[token]` + evidence package), white-label branding, group/subsidiary overview.
- **Partner program** — public apply, referral attribution on signup, code-based partner dashboard.
- **Free tools** (`/tools/*`), localized document generation, preferences, and Business/Enterprise pricing tiers.

Phase 2 infrastructure has graceful fallbacks: `lib/cache.ts` / `lib/ratelimit.ts` use **Upstash Redis** when configured (else in-process); `lib/crypto.ts` (AES-256-GCM) encrypts integration credentials and hashes API keys; `lib/logger.ts` emits structured JSON. Set `ENCRYPTION_KEY` and optional `UPSTASH_REDIS_REST_URL/TOKEN`. Run `npm run db:seed` to load the ISO 42001 / NIS2 / DORA frameworks.

## Hardening / completeness (post-Phase-2)

- **Tests** — Vitest suite (`npm test`, 31 tests): risk classifier, sector & custom rules, crypto, KB retrieval, questionnaire parsing.
- **Full REST API** — `GET/POST /v1/inventory`, `GET/PUT /v1/inventory/:id`, `/v1/register(.pdf)`, `/v1/compliance/*`, `/v1/trust-page`, `GET/POST/DELETE /v1/webhooks`, `/v1/openapi.json`; read-only vs read_write enforced.
- **Catalog** — expanded to ~115 pre-configured tools across 11 groups.
- **Advanced AI** — smart document-improvement suggestions (AI review) and anonymised industry benchmark intelligence.
- **Tiptap** rich-text document editor; added FRIA and Incident Log document types.
- **Real GitHub OAuth** — `/api/integrations/github/authorize|callback`, encrypted token storage (`GITHUB_CLIENT_ID/SECRET`).
- **Inngest** jobs (`/api/inngest`, `npx inngest-cli dev`), **SCIM 2.0** `/api/scim/v2/Users` (`SCIM_TOKEN`), DB-backed **global search** in ⌘K.
- **i18n** — next-intl in the dashboard with EN/DE/PL/NL/FR catalogues (ES/IT fall back to EN); document generation localises output.

## SEO content surface

- **27 country pages** — `/eu-ai-act/[country]` (DE/FR/NL/PL/ES/IT/SE/IE/BE/AT richly localised; all EU/EEA generated) with enforcement authority, market stats, local nuances, native-language FAQ + CTA.
- **8 sector pages** — `/eu-ai-act/sector/[sector]` (healthcare, fintech, HR, e-commerce, legal, education, manufacturing, public sector) with high-risk examples, obligations, and crosswalks.
- **3 comparison pages** — `/eu-ai-act/compare/[slug]` (vs GDPR, vs ISO 42001, vs NIS2).
- **Glossary** (`/eu-ai-act/glossary`, ~40 terms) and a **Vendor AI Compliance Checker** (`/tools/vendor-check`).
- All are statically generated, linked from the guide hub + footer, and listed in `sitemap.xml` (58 URLs).

## Completeness pass (full phase 1 + 2)

- **Database SQL** — `supabase/setup.sql` (run in the Supabase SQL editor) creates all tables/enums, RLS + triggers, and the `evidence-files` storage bucket with per-org policies. See `supabase/SUPABASE_SETUP.md`.
- **In-app notifications** — bell with unread badge + dropdown, created on document/framework events.
- **CSV inventory import** (template + preview), **document version history** (snapshot + restore), **set-new-password** flow.
- **Marketing**: `/about`, `/changelog`, file-based `/blog` + posts, competitor comparison pages (`/compare/[slug]`), dynamic **OG image** (`next/og`), vendor logos in the inventory.
- **Evidence vault**: folder grouping + per-plan storage limits and per-file size caps.
- **Analytics & lifecycle**: env-gated PostHog loader and Loops.so events (no-ops without keys).
- `sitemap.xml` now lists 67 URLs (countries, sectors, comparisons, blog, tools, marketing).

### Still requires external accounts to exercise end-to-end
Sentry, Typesense, full next-intl route localisation (27 country pages), Stripe Connect payouts, and a React Native app are **not** included. SCIM / Inngest / GitHub OAuth are real code but need their platforms (IdP, Inngest, a GitHub OAuth app) to run live. The advisor uses keyword retrieval, not pgvector embeddings.

## Deploying

It's Vercel-ready: serverless Chromium for PDFs (`@sparticuz/chromium` +
`puppeteer-core`, externalised in `next.config.mjs`), `prisma generate` in the
build, and function limits in `vercel.json`. Full steps in **`DEPLOY.md`**;
database SQL in **`supabase/setup.sql`**.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values (also copy to .env for Prisma CLI)
npm run db:generate          # generate Prisma client
npm run db:migrate           # create tables (needs a database)
# then in the Supabase SQL editor, run prisma/rls.sql for row-level security
npm run db:seed              # seed regulation updates
npm run dev
```

Open http://localhost:3000.

### Required services (provision then fill `.env.local`)

1. **Supabase** — project URL, anon key, service-role key, `DATABASE_URL`/`DIRECT_URL`. Enable Google OAuth if desired. Create a Storage bucket named `evidence-files` for the vault.
2. **Stripe** — secret/publishable keys, a webhook signing secret, and three monthly Price IDs (starter/growth/team). Point a webhook at `/api/stripe/webhook`.
3. **Anthropic** — API key (optional; features fall back to templates/rule-based output without it).
4. **Resend** — API key + verified sender domain (optional; emails are logged and skipped without it).

See `.env.example` for the full list.

## Project structure

```
app/            App Router routes (auth, marketing, dashboard, public, api)
components/     Shared UI (shadcn/ui in components/ui)
lib/            Utilities, Supabase clients, tRPC wiring, constants
server/         tRPC routers + services (classifier, pdf, documents, stripe, email…)
prisma/         schema.prisma, rls.sql, seed.ts
emails/         React Email templates
```

## Scripts

- `npm run dev` / `build` / `start`
- `npm run typecheck` — `tsc --noEmit`
- `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio`

## Notes

- **Puppeteer on Vercel:** swap the launch in `server/services/pdf-generator.ts` to `@sparticuz/chromium` for serverless.
- **Authorization:** server mutations run via Prisma (service role) with auth enforced in `server/trpc.ts`. `prisma/rls.sql` is the defence-in-depth backstop for any direct client access.
- Compliance outputs are **not legal advice**.
