# Hustle — job search tracker

A web app to track job applications, upcoming tests and interviews, weekly
goals and STAR interview answers. Anyone can sign up; every account's data is
isolated by row-level security, and new accounts wait for admin approval.
AI assistants (Claude, Cursor, VS Code…) can manage your applications through
a built-in MCP server.

Live at **https://hustle-career.vercel.app**.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, SWR, zod and
Recharts, on Supabase (Postgres, Auth, Storage) and Vercel.

## Features

- **Accounts**: email + password sign-up with email verification, password reset, self-service account deletion. New accounts are *pending* until an admin approves them.
- **Dashboard**: key numbers, upcoming tests/interviews, weekly targets with streak, follow-up queue, recent applications and a 12-month activity heatmap.
- **Applications**: search, filters, sortable table, cards, and a drag-and-drop **board** by pipeline stage; CSV export; proof files (PDF/PNG/JPG/WebP) in private storage.
- **Follow-up reminders**: in-progress applications with no update for 14+ days are flagged; "Followed up" resets the clock.
- **Insights**: interview and offer rates, pipeline by stage (a stage counts only when it really happened), where you get rejected, breakdowns and a 12-month timeline; every number opens the list behind it, with each application's journey.
- **Interview prep**: question bank with STAR drafts and study notes, a starter pack, practice mode with a timer, mastery tracking and a rule-based answer check.
- **Job match** *(beta)*: paste LinkedIn's "Top job picks for you" page; jobs are scored 0-100 against your profile from LinkedIn's "Save to PDF". Rule-based, no AI and no scraping.
- **Connect AI**: per-account access keys (shown once, regenerate, turn off, delete) and an MCP server at `/api/mcp` with full create / read / update / delete of applications.
- **Admin Panel** (admins only): approve, suspend or delete accounts, review and turn off access keys, system health and capacity. Admins never see anyone's applications or usage figures.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the Supabase values
npm run dev                  # http://localhost:3000
```

The app validates its configuration at startup and refuses to run if a
required variable is missing (see `.env.example`):

| Variable | Where it is used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server (public; RLS protects the data) |
| `SUPABASE_SECRET_KEY` | Server only: deleting accounts and the access-key path |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`) | Optional: shared rate limit for access keys (Upstash Redis) |
| `SUPABASE_DB_URL` | Local only: migrations, backups, psql checks |

### Database

Migrations live in `supabase/migrations/` (`0001`–`0007`) and are applied in
order. Every schema or policy change must pass the RLS suite first:

```bash
npm run test:db    # Postgres in WASM (PGlite) with Supabase-like roles: RLS, grants, RPCs
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests (vitest) |
| `npm run test:db` | Database / RLS tests |

### Connecting an AI assistant

In the app, open **Connect AI**, create an access key and copy the setup for
your app. For Claude Code:

```bash
claude mcp add --scope user --transport http hustle https://hustle-career.vercel.app/api/mcp \
  --header "Authorization: Bearer hst_your_key"
```

Tools: `hustle_list_applications`, `hustle_get_application`,
`hustle_add_application`, `hustle_update_application`,
`hustle_delete_application` (needs `confirm`), `hustle_proof_link`. Adding and
deleting are previews until confirmed. A remote server can't read files on your
computer, so new proof files are added through a link to the form.

## Project structure

```
src/
  app/                    Routes only (thin pages + API route handlers)
    (app)/                Signed-in, approved pages wrapped in the app shell (incl. admin, integrations)
    api/                  JSON API: jobs, interviews, profile, recommendations, tokens, admin, mcp
    auth/                 Email link callback, sign out
    login/ signup/ …      Auth pages, /pending for accounts awaiting approval
  components/             Design-system primitives and layout
  features/               Feature modules: dashboard, jobs, summary, interviews, matches, integrations, admin, auth
  lib/                    Framework-agnostic logic: constants, types, formatting, stats, notes, validation
    supabase/             Supabase clients (browser, server, proxy, secret-key)
    server/               Server-only code: auth context, repositories, proof files, access keys, MCP server
  proxy.ts                Session refresh, CSRF check and page/API gate (Next.js 16 "middleware")
supabase/
  migrations/             Schema, RLS, storage, admin and access-key migrations
  tests/rls.test.mjs      RLS suite
scripts/
  migrate-from-sheets.mts One-time import from the old Google Sheet (dry run by default)
docs/                     Multi-user plan and progress
```

Conventions:

- **One source of truth** for statuses, stages, platforms and colours: `src/lib/constants.ts` and `src/lib/tones.ts`.
- **Domain types** in `src/lib/types.ts`; database columns never leak past `lib/server/repositories`.
- **Validation** with zod in `src/lib/validation.ts`, shared by API routes, the MCP tools and mirrored in forms.
- API responses are always `{ success: true, data }` or `{ success: false, error }`; use `apiFetch` on the client.

## Design

White base with coloured accent lines: every card carries a solid coloured top
line and list rows a coloured left edge that follows the application status.
The brand colour is indigo; no gradients. Colours come from named tones
(`TONES` in `src/lib/tones.ts`) so they stay consistent.

## Security

Four layers check every request, so a bug in one is caught by the next:

1. `proxy.ts` refreshes the Supabase session and sends signed-out visitors to `/login`; cross-origin writes are rejected.
2. The `(app)` layout re-checks the session and sends pending or suspended accounts to `/pending`.
3. Every API route (`withAuth` / `withAdmin`) checks the session, approval and, for admin routes, the admin flag.
4. **Row-level security** in Postgres: every table and the proof bucket only ever return the caller's own rows, and a restrictive policy blocks accounts that aren't approved. Per-column grants stop clients writing `user_id`, counters, hashes or admin flags.

More:

- **Access keys** (`hst_…`) are stored as SHA-256 hashes, shown once, limited to five per account, and only reach applications (list, read, add, edit, delete through MCP). The access-key path is the only one using the secret key; every query on it is scoped to the key's owner (covered by tests). 60 requests per minute per key via Upstash.
- **Admin RPCs** check the admin flag inside the database and return account management data only (no application counts or content).
- **Proof files** live in a private bucket at `{user}/{application}/…`, are verified by file signature, and open through 60-second signed URLs.
- Database errors are logged, never returned to the client.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) are set in `next.config.ts`.
- Supabase Security Advisor: 0 errors; the warnings left are intentional and documented in `docs/MULTI_USER_PLAN.md`.
