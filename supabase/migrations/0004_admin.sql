-- ════════════════════════════════════════════════════════════════════
-- 0004_admin.sql: account approval + admin panel
--
-- New accounts start as 'pending'. Until an admin approves them they can
-- read their own profile (to see their status) and nothing else: every data
-- table and the proofs bucket get a RESTRICTIVE policy that ANDs with the
-- existing "own rows" policies. API tokens of unapproved accounts resolve
-- to nothing.
--
-- Admins are marked by profiles.is_admin, which no client can write. There is
-- deliberately no "claim first admin" RPC: the owner is promoted once by hand
-- (SQL, by user id, after the email is confirmed). Admins see account
-- metadata and counts only, never another user's data.
-- ════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column status      text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  add column is_admin    boolean not null default false,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references auth.users (id) on delete set null,
  -- An admin is always approved, so suspending can't lock the panel's owner out by accident.
  add constraint profiles_admin_is_approved check (not is_admin or status = 'approved');

create index profiles_status_idx on public.profiles (status, created_at desc);

-- ────────────────────────────────────────────────────────────────────
-- Helpers for policies. Security definer so they read the caller's row
-- without going through profiles' RLS; they only ever look at auth.uid().
-- The private schema isn't exposed by the Data API, so these can't be
-- called as RPCs; authenticated only gets what policy evaluation needs.
-- ────────────────────────────────────────────────────────────────────
create or replace function private.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'approved'
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin and status = 'approved'
  );
$$;

grant usage on schema private to authenticated;
revoke execute on function private.is_approved() from public, anon;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_approved() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- Approval gate (restrictive: combined with AND, so "own rows" still applies)
-- ────────────────────────────────────────────────────────────────────
create policy "user_settings: approved accounts only" on public.user_settings
  as restrictive for all to authenticated
  using ((select private.is_approved())) with check ((select private.is_approved()));
create policy "jobs: approved accounts only" on public.jobs
  as restrictive for all to authenticated
  using ((select private.is_approved())) with check ((select private.is_approved()));
create policy "job_attachments: approved accounts only" on public.job_attachments
  as restrictive for all to authenticated
  using ((select private.is_approved())) with check ((select private.is_approved()));
create policy "interview_questions: approved accounts only" on public.interview_questions
  as restrictive for all to authenticated
  using ((select private.is_approved())) with check ((select private.is_approved()));
create policy "candidate_profiles: approved accounts only" on public.candidate_profiles
  as restrictive for all to authenticated
  using ((select private.is_approved())) with check ((select private.is_approved()));
create policy "recommendations: approved accounts only" on public.recommendations
  as restrictive for all to authenticated
  using ((select private.is_approved())) with check ((select private.is_approved()));
create policy "api_tokens: approved accounts only" on public.api_tokens
  as restrictive for all to authenticated
  using ((select private.is_approved())) with check ((select private.is_approved()));

-- Scoped to the proofs bucket so other buckets keep their own rules.
create policy "proofs: approved accounts only"
  on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'proofs' or (select private.is_approved()))
  with check (bucket_id <> 'proofs' or (select private.is_approved()));

-- record_practice is security definer (bypasses RLS), so it checks too.
create or replace function public.record_practice(question_id uuid)
returns public.interview_questions
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  updated public.interview_questions;
begin
  if uid is null or not private.is_approved() then
    raise exception 'Not signed in or not approved' using errcode = '42501';
  end if;

  update public.interview_questions
  set practice_count = practice_count + 1,
      last_practiced_at = now()
  where id = question_id
    and user_id = uid
  returning * into updated;

  return updated; -- null when the question isn't the caller's
end;
$$;

-- Tokens of pending or suspended accounts stop working immediately.
create or replace function public.verify_api_token(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  update public.api_tokens t
  set last_used_at = now()
  from public.profiles p
  where t.token_hash = p_token_hash
    and t.revoked_at is null
    and p.id = t.user_id
    and p.status = 'approved'
  returning t.user_id into owner;
  return owner; -- null for unknown, revoked or unapproved
end;
$$;

-- ────────────────────────────────────────────────────────────────────
-- Admin RPCs. Each one checks private.is_admin() first; non-admins get
-- 42501. Admins can't change themselves or other admins.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.admin_list_users()
returns table (
  id                 uuid,
  email              text,
  display_name       text,
  status             text,
  is_admin           boolean,
  created_at         timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at    timestamptz,
  reviewed_at        timestamptz,
  jobs_count         integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  return query
  select u.id, u.email::text, p.display_name, p.status, p.is_admin, u.created_at,
         u.email_confirmed_at, u.last_sign_in_at, p.reviewed_at,
         (select count(*)::integer from public.jobs j where j.user_id = u.id)
  from auth.users u
  join public.profiles p on p.id = u.id
  order by (p.status = 'pending') desc, u.created_at desc;
end;
$$;

create or replace function public.admin_set_status(target uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  if new_status not in ('approved', 'suspended') then
    raise exception 'Status must be approved or suspended' using errcode = '22023';
  end if;
  if target = (select auth.uid()) then
    raise exception 'You cannot change your own status' using errcode = '42501';
  end if;

  update public.profiles
  set status = new_status, reviewed_at = now(), reviewed_by = (select auth.uid())
  where id = target and not is_admin;

  if not found then
    raise exception 'User not found or is an admin' using errcode = 'P0002';
  end if;
end;
$$;

-- Approves every pending account in one statement; returns how many.
create or replace function public.admin_approve_all_pending()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  update public.profiles
  set status = 'approved', reviewed_at = now(), reviewed_by = (select auth.uid())
  where status = 'pending';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Aggregates for the System tab: counts only, no user data.
create or replace function public.admin_system_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'users_total',         (select count(*) from public.profiles),
    'users_pending',       (select count(*) from public.profiles where status = 'pending'),
    'users_approved',      (select count(*) from public.profiles where status = 'approved'),
    'users_suspended',     (select count(*) from public.profiles where status = 'suspended'),
    'jobs',                (select count(*) from public.jobs),
    'interview_questions', (select count(*) from public.interview_questions),
    'recommendations',     (select count(*) from public.recommendations),
    'attachments',         (select count(*) from public.job_attachments),
    'attachments_bytes',   (select coalesce(sum(size_bytes), 0) from public.job_attachments),
    'active_tokens',       (select count(*) from public.api_tokens where revoked_at is null),
    'database_bytes',      pg_database_size(current_database())
  );
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.admin_set_status(uuid, text) from public, anon;
revoke execute on function public.admin_approve_all_pending() from public, anon;
revoke execute on function public.admin_system_stats() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_status(uuid, text) to authenticated;
grant execute on function public.admin_approve_all_pending() to authenticated;
grant execute on function public.admin_system_stats() to authenticated;
