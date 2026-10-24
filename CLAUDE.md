@AGENTS.md

# Current work: multi-user migration

The approved plan and its status table are in `docs/MULTI_USER_PLAN.md` (Indonesian). Read it before working on the migration, continue from the status table, and update that table after every stage. Reply to the user in Bahasa Indonesia.

## Supabase safety rules (single project = production)

- The only Supabase project is `rzzzqmvafauvdpbzupdv`, and it is **production**. The `supabase` MCP server is connected to it (local scope, features docs/database/debugging/development).
- Read-only calls (list tables, `execute_sql` with SELECT only, advisors, logs, docs) are fine.
- Every write (`apply_migration`, `execute_sql` that changes schema or data, storage changes) needs the user's explicit approval for that specific change. Never add these tools to an allowlist.
- Before every migration, back up the database (`supabase db dump`) to a local folder outside git.
- Schema and RLS changes must pass the local PGlite RLS tests (`npm run test:db`) before they are applied to Supabase.
- Test accounts (for example test-a / test-b) must be deleted after testing. The owner's 203 applications are migrated last, after the schema is stable and the user approves.
- No push, deploy or merge to `master` without the user's approval.
