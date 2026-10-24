-- ════════════════════════════════════════════════════════════════════
-- 0002_api_tokens.sql: per-account API tokens for the MCP server
--
-- The token itself (hst_…) is shown once and never stored: only its
-- SHA-256 hash, which clients can't even read (column-level select).
-- At most 5 active tokens per user; a revoked token stays revoked.
-- ════════════════════════════════════════════════════════════════════

create table public.api_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  token_prefix text not null check (token_prefix ~ '^hst_[A-Za-z0-9]{4}$'),
  token_hash   text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

create index api_tokens_user_idx on public.api_tokens (user_id, created_at desc);

-- At most 5 active tokens per user. Security definer so the count sees all of
-- the user's tokens whoever inserts; it only reads the new row's owner.
create or replace function private.enforce_api_token_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.api_tokens
        where user_id = new.user_id and revoked_at is null) >= 5 then
      raise exception 'You can have at most 5 active tokens. Revoke one first.' using errcode = '23514';
    end if;
  elsif tg_op = 'UPDATE' then
    if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
      raise exception 'A revoked token cannot be restored.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger api_tokens_rules
  before insert or update on public.api_tokens
  for each row execute function private.enforce_api_token_rules();

-- Resolves a token hash to its owner and stamps last_used_at. Lives in public
-- so the server can call it through the Data API, but only service_role may
-- execute it: anon/authenticated can't probe hashes.
create or replace function public.verify_api_token(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  update public.api_tokens
  set last_used_at = now()
  where token_hash = p_token_hash
    and revoked_at is null
  returning user_id into owner;
  return owner; -- null for unknown or revoked tokens
end;
$$;

-- Privileges
revoke all on public.api_tokens from anon, authenticated;
-- Every column except token_hash (RETURNING needs these too).
grant select (id, user_id, name, token_prefix, created_at, last_used_at, revoked_at) on public.api_tokens to authenticated;
grant insert (name, token_prefix, token_hash) on public.api_tokens to authenticated;
grant update (revoked_at) on public.api_tokens to authenticated;

revoke execute on function public.verify_api_token(text) from public, anon, authenticated;
grant execute on function public.verify_api_token(text) to service_role;
revoke execute on function private.enforce_api_token_rules() from public, anon, authenticated;

-- RLS: own tokens only (no delete: revoke instead, so last_used_at history stays)
alter table public.api_tokens enable row level security;

create policy "api_tokens: read own" on public.api_tokens for select to authenticated
  using (user_id = (select auth.uid()));
create policy "api_tokens: insert own" on public.api_tokens for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "api_tokens: revoke own" on public.api_tokens for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
