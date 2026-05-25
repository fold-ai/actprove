# Supabase setup

Everything you need to provision the ActProve database lives in **`setup.sql`**.

## Steps

1. Create a Supabase project.
2. Open **SQL Editor → New query**, paste the entire contents of `setup.sql`, and **Run**.
   - This creates all tables + enums, enables Row-Level Security with multi-tenant
     policies, adds the `updated_at` triggers, and creates the private
     `evidence-files` storage bucket with per-org access policies.
3. In **Project Settings → API**, copy the URL, `anon` key and `service_role` key
   into `.env.local` (and `.env` for the Prisma CLI).
4. In **Project Settings → Database → Connection string**, copy the pooled and
   direct URLs into `DATABASE_URL` and `DIRECT_URL`.
5. (Optional) Enable **Google OAuth** under Authentication → Providers.
6. Seed reference data (regulation updates + ISO 42001 / NIS2 / DORA frameworks):

   ```bash
   npm run db:seed
   ```

   The seed runs over the live DB using `DATABASE_URL`. Alternatively, you can
   add INSERTs to your own migration — the seed source is `prisma/seed.ts`.

## Keeping it in sync with Prisma

`setup.sql` was generated from `prisma/schema.prisma` via:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

If you change the schema later, prefer `npm run db:migrate` (Prisma migrations)
once a database is connected, or regenerate this file with the command above and
re-append `prisma/rls.sql` + the storage section.

## Notes

- RLS is **defence-in-depth**: server mutations run via Prisma with the
  service-role key (which bypasses RLS); authorization is also enforced in tRPC
  middleware. RLS protects any direct `anon`/realtime access.
- The storage policies scope each file to `"<organizationId>/..."`, matching how
  the app uploads evidence (`lib` → `app/dashboard/vault`).
