-- ════════════════════════════════════════════════════════════════════
-- 0007_delete_turned_off_keys.sql: owners can tidy up turned-off keys
--
-- Keys used to be turn-off only, to keep their history. Owners may now
-- delete their own keys, but only once turned off: an active key has to be
-- turned off first, so a key still in use somewhere can't vanish by accident.
-- The approval gate (restrictive policy from 0004) still applies.
-- ════════════════════════════════════════════════════════════════════

grant delete on public.api_tokens to authenticated;

create policy "api_tokens: delete own turned-off" on public.api_tokens for delete to authenticated
  using (user_id = (select auth.uid()) and revoked_at is not null);
