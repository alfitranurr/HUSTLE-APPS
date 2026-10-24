-- ════════════════════════════════════════════════════════════════════
-- 0005_admin_privacy.sql: data minimisation for the admin panel
--
-- Admins manage accounts; they don't need to know how anyone uses Hustle.
-- (Owner's decision, 24 Oct 2026, in line with UU PDP No. 27/2022 and
-- GDPR art. 5(1)(c).) So the admin RPCs no longer return:
-- - per-account application counts (admin_list_users.jobs_count);
-- - content totals across accounts (applications, interview questions,
--   recommendations, proof files): with few accounts a total still reveals
--   one person's numbers.
-- What stays is what running the service needs: account status, sign-in
-- times, capacity (database and storage size) and active token count.
-- ════════════════════════════════════════════════════════════════════

-- The return type changes, so the function is replaced, not altered.
drop function public.admin_list_users();

create function public.admin_list_users()
returns table (
  id                 uuid,
  email              text,
  display_name       text,
  status             text,
  is_admin           boolean,
  created_at         timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at    timestamptz,
  reviewed_at        timestamptz
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
         u.email_confirmed_at, u.last_sign_in_at, p.reviewed_at
  from auth.users u
  join public.profiles p on p.id = u.id
  order by (p.status = 'pending') desc, u.created_at desc;
end;
$$;

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
    'users_total',     (select count(*) from public.profiles),
    'users_pending',   (select count(*) from public.profiles where status = 'pending'),
    'users_approved',  (select count(*) from public.profiles where status = 'approved'),
    'users_suspended', (select count(*) from public.profiles where status = 'suspended'),
    'active_tokens',   (select count(*) from public.api_tokens where revoked_at is null),
    'storage_bytes',   (select coalesce(sum(size_bytes), 0) from public.job_attachments),
    'database_bytes',  pg_database_size(current_database())
  );
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
