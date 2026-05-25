-- ActProve — Row-Level Security policies & helpers
-- Run this in the Supabase SQL editor AFTER `prisma migrate deploy`.
-- It enforces multi-tenant isolation at the database level (spec §19.2.4).

-- ── Helper: the org of the currently authenticated user ──────────────
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.users where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.users where id = auth.uid();
$$;

-- ── updated_at auto-touch trigger ────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'organizations','users','ai_systems','compliance_documents'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.touch_updated_at();', t, t);
  end loop;
end $$;

-- ── Enable RLS on every table ────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','users','ai_systems','compliance_documents',
    'regulation_updates','org_regulation_updates','evidence_files',
    'questionnaire_responses','audit_log','notifications',
    'literacy_records','team_invites'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ── Tenant-scoped tables: members only see their own org's rows ──────
do $$
declare t text;
begin
  foreach t in array array[
    'ai_systems','compliance_documents','org_regulation_updates',
    'evidence_files','questionnaire_responses','audit_log',
    'notifications','literacy_records','team_invites'
  ] loop
    execute format('drop policy if exists tenant_isolation on public.%I;', t);
    execute format(
      'create policy tenant_isolation on public.%I
       for all to authenticated
       using (organization_id = public.current_org_id())
       with check (organization_id = public.current_org_id());', t);
  end loop;
end $$;

-- organizations: a user can read/update only their own org
drop policy if exists org_self on public.organizations;
create policy org_self on public.organizations
  for all to authenticated
  using (id = public.current_org_id())
  with check (id = public.current_org_id());

-- users: see colleagues in the same org; update only your own row
drop policy if exists users_same_org on public.users;
create policy users_same_org on public.users
  for select to authenticated
  using (organization_id = public.current_org_id());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update to authenticated
  using (id = auth.uid());

-- regulation_updates: global catalogue, readable by all authenticated users
drop policy if exists regs_readable on public.regulation_updates;
create policy regs_readable on public.regulation_updates
  for select to authenticated using (true);

-- NOTE: server-side mutations use the Supabase service-role key (via Prisma),
-- which bypasses RLS. Authorization for those paths is enforced in tRPC
-- middleware (server/trpc.ts). RLS is the defence-in-depth backstop for any
-- direct client (`anon`) access, e.g. realtime subscriptions.
