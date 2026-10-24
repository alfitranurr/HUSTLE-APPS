@AGENTS.md

# Project notes

Hustle is a multi-user app on Supabase, live at https://hustle-career.vercel.app (the old `hustle-apps-six.vercel.app` redirects there). The migration from the single-owner Google Sheet app finished on 24 October 2026; its plan and history are in `docs/MULTI_USER_PLAN.md`, and the remaining clean-up items are in the table at the top of `docs/PROGRESS.md` (Indonesian). Update that table when an item is done. Reply to the user in Bahasa Indonesia.

## Supabase safety rules (single project = production)

- The only Supabase project is `rzzzqmvafauvdpbzupdv`, and it is **production**. The `supabase` MCP server is connected to it (local scope). When its tools aren't loaded, use `psql` (`C:\Program Files\PostgreSQL\18\bin\psql.exe`, not on PATH) with `SUPABASE_DB_URL` from `.env.local`.
- Read-only queries (SELECT, advisors, logs, docs) are fine.
- Every write (migrations, schema or data changes, storage changes) needs the user's explicit approval for that specific change. Never add write tools to an allowlist.
- Before every migration, back up the database with `pg_dump` (schemas `public`, `auth`, `storage`, `private`) to `D:\AL FITRA\backups\hustle-supabase\`, outside git.
- Schema and RLS changes must pass the local PGlite RLS tests (`npm run test:db`) before they are applied to Supabase.
- Test accounts and test data must be deleted after testing.
- No push, deploy or merge to `master` without the user's approval. The GitHub repo is public: never commit secrets, and keep personal details (emails, account ids, real application data) out of committed files.
