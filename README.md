# Hustle — job search tracker

A private, single-user web app to track job applications, upcoming tests and
interviews, weekly goals and STAR interview answers. Data lives in a Google
Sheet; proof-of-application files are stored in a Google Drive folder.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, SWR, zod and Recharts.

## Features

- **Dashboard**: key numbers, upcoming tests/interviews, weekly targets with streak, follow-up queue, recent applications and a 12-month activity heatmap.
- **Applications**: search, filters, sortable table, cards, and a drag-and-drop **board** by pipeline stage; CSV export of the current view.
- **Follow-up reminders**: in-progress applications with no update for 14+ days are flagged; "Followed up" resets the clock.
- **Insights**: interview and offer rates, status/stage/level/location/platform breakdowns, top positions and a 12-month timeline, filterable by timeframe.
- **Interview prep**: question bank with STAR drafts and study notes, a starter pack, practice mode with a timer, mastery tracking and a rule-based answer check.
- **Job match**: the jobs LinkedIn recommends to you (from LinkedIn's recommendation emails in Gmail, or the pasted "Top job picks for you" page), scored 0-100 against your profile from LinkedIn's "Save to PDF". Rule-based, no AI and no scraping; one click adds a job to Applications.

The Google Sheet uses three tabs, created automatically when missing:
`DataLowongan` (applications, columns A–U), `Interviews`, `Settings`, `Profile` and `Recommendations` (Job match).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in every value
npm run dev                  # http://localhost:3000
```

The app validates its configuration at startup and refuses to run if a
required variable is missing or too weak (see `.env.example`).

### Job match: Gmail access (one time)

1. LinkedIn → Settings → Notifications → Searching for a job → **Job recommendations**: turn Email on.
2. Google Cloud Console: enable the **Gmail API**, add the `gmail.readonly` scope to the OAuth consent screen and set the app to **In production** (in Testing, tokens for this scope expire after 7 days).
3. `node scripts/google-oauth-token.mjs` signs you in and writes a new `GOOGLE_REFRESH_TOKEN` to `.env.local` (never printed). If Google reports `redirect_uri_mismatch`, add `http://localhost:53682/oauth2callback` to the OAuth client's redirect URIs.
4. Put the new token in Vercel (Production + Preview) and redeploy.

Without Gmail access, paste the "Top job picks for you" page instead.

| Script              | What it does                 |
| ------------------- | ---------------------------- |
| `npm run dev`       | Development server           |
| `npm run build`     | Production build             |
| `npm run lint`      | ESLint                       |
| `npm run typecheck` | TypeScript, no emit          |

## Project structure

```
src/
  app/                    Routes only (thin pages + API route handlers)
    (app)/                Authenticated pages, wrapped in the app shell
    api/                  JSON API: auth, jobs, interviews
    login/                Sign-in page
  components/
    ui/                   Design-system primitives (Button, Card, Modal, ...)
    layout/               App shell, sidebar, page header
  features/               Feature modules: dashboard, jobs, summary, interviews, auth
  hooks/                  Shared client hooks
  lib/                    Framework-agnostic logic: constants, types, formatting, stats
    server/               Server-only code (never imported by client components)
      google/             Sheets + Drive clients and helpers
      repositories/       Sheet rows <-> domain objects
  proxy.ts                Auth gate for pages and API (Next.js 16 "middleware")
```

Conventions:

- **One source of truth** for statuses, stages, platforms and colours: `src/lib/constants.ts` and `src/lib/tones.ts`.
- **Domain types** in `src/lib/types.ts`; sheet column names never leak past `lib/server/repositories`.
- **Validation** with zod in `src/lib/validation.ts`, shared by API routes and mirrored in forms.
- API responses are always `{ success: true, data }` or `{ success: false, error }`; use `apiFetch` on the client.

## Design

White base with coloured accent lines: every card carries a solid coloured top
line and list rows a coloured left edge that follows the application status.
The brand colour is indigo; no gradients. Colours come from named tones
(`TONES` in `src/lib/tones.ts`) so they stay consistent.

## Security

- Every page and API route requires a valid session (checked in `proxy.ts` and again in each handler).
- Session: HMAC-signed, httpOnly, SameSite=Lax cookie (Secure outside development), 7-day expiry.
- Login is rate-limited and compares credentials in constant time.
- Cross-origin writes to the API are rejected.
- Sheet writes use `RAW` input so values are never evaluated as formulas.
- Uploads: max 5 files, 4 MB each, PDF/PNG/JPG/WebP verified by file signature; files stay private in Drive.
- Only files inside the configured Drive folder can be deleted.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) are set in `next.config.ts`.
- Secrets are only read server-side via `src/lib/env.ts`; nothing is exposed with `NEXT_PUBLIC_`.
