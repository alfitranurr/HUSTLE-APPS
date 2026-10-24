-- ════════════════════════════════════════════════════════════════════
-- 0006_admin_tokens.sql: admins can review and turn off access keys
--
-- Access keys (api_tokens) are credentials, so managing them is part of
-- running the service: an admin can list every account's keys (name, the
-- 8-character prefix, created, last used, status) and turn one or all of an
-- account's keys off. Key values are never stored, so they can't be shown;
-- admins can't create keys for others. revoked_by records who turned a key
-- off, so its owner can see "turned off by admin".
-- ════════════════════════════════════════════════════════════════════

alter table public.api_tokens
  add column revoked_by uuid references auth.users (id) on delete set null;

-- Owners may read it (transparency), never write it: their own revoke goes
-- through the existing update (revoked_at) grant only.
grant select (revoked_by) on public.api_tokens to authenticated;

create or replace function public.admin_list_tokens()
returns table (
  id           uuid,
  user_id      uuid,
  email        text,
  name         text,
  token_prefix text,
  created_at   timestamptz,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  revoked_by_admin boolean
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
  select t.id, t.user_id, u.email::text, t.name, t.token_prefix, t.created_at, t.last_used_at, t.revoked_at,
         (t.revoked_by is not null and t.revoked_by <> t.user_id)
  from public.api_tokens t
  join auth.users u on u.id = t.user_id
  order by (t.revoked_at is null) desc, t.created_at desc;
end;
$$;

-- Turns off one key. Returns false when it was already off.
create or replace function public.admin_revoke_token(token_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  update public.api_tokens
  set revoked_at = now(), revoked_by = (select auth.uid())
  where id = token_id and revoked_at is null;
  if found then return true; end if;

  if not exists (select 1 from public.api_tokens where id = token_id) then
    raise exception 'Key not found' using errcode = 'P0002';
  end if;
  return false;
end;
$$;

-- Turns off every key of one account; returns how many.
create or replace function public.admin_revoke_user_tokens(target uuid)
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

  update public.api_tokens
  set revoked_at = now(), revoked_by = (select auth.uid())
  where user_id = target and revoked_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.admin_list_tokens() from public, anon;
revoke execute on function public.admin_revoke_token(uuid) from public, anon;
revoke execute on function public.admin_revoke_user_tokens(uuid) from public, anon;
grant execute on function public.admin_list_tokens() to authenticated;
grant execute on function public.admin_revoke_token(uuid) to authenticated;
grant execute on function public.admin_revoke_user_tokens(uuid) to authenticated;
