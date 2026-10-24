# Hustle multi-user: Supabase + RLS kuat + token MCP per akun

> **Rencana disetujui user 24 Okt 2026.** Dikerjakan di branch `feat/multi-user`.

## Status (update setiap tahap)

| Tahap | Status | Catatan |
|---|---|---|
| 0. Project Supabase | ✅ | 1 project saja (keputusan user): ref `rzzzqmvafauvdpbzupdv` = **production**. MCP `supabase` terpasang `--scope local` di folder ini, fitur `docs,database,debugging,development`, sudah login OAuth. Belum diisi: Email confirm, redirect URL, env (URL, publishable key, secret key). Google login dibatalkan (keputusan user 24 Okt) |
| 1. Branch + versi + skema/RLS | 🔄 sudah di-apply, tinggal Security Advisor | Sudah: branch; token env lama di-`git stash`; Next 16.4.3 (tsc + build lulus); `@supabase/ssr` 0.12.7, `supabase-js` 2.118; dev: pglite, vitest, tsx. **Migrasi** `supabase/migrations/0001_core.sql` (7 tabel + RLS + grant per kolom + `record_practice`), `0002_api_tokens.sql`, `0003_storage.sql` (bucket `proofs` private). **`npm run test:db` → 92/92 lulus** (bootstrap meniru default grant Supabase). Belum di-commit. **1b, 24 Okt:**
- Cek read-only lewat `psql` (`SUPABASE_DB_URL` di `.env.local`, session pooler) → PG 17.11, `public` kosong, 0 user, 0 bucket.
- Backup `pg_dump` (`public`, `auth`, `storage`) di `D:\AL FITRA\backups\hustle-supabase\2026-10-24_120000_before-0001\`.
- Project ada di akun Supabase alfitranurrportfolio; `supabase link` CLI gagal karena CLI login dengan akun lain (tidak dibutuhkan, backup memakai `pg_dump`).

**1b apply, 24 Okt (izin user):** tool MCP Supabase tidak termuat di sesi VS Code (dugaan: config lokal tercatat untuk path `D:\`, folder dibuka sebagai `d:\`). Atas pilihan user, 0001 → 0002 → 0003 di-apply lewat `psql` (`C:\Program Files\PostgreSQL\18\bin\psql.exe`, tidak ada di PATH), satu transaksi per file, `ON_ERROR_STOP`. Sebelumnya dicek DB masih kosong, jadi backup tetap berlaku. **Riwayat migrasi tidak tercatat di Supabase** (tidak ada schema `supabase_migrations`). Verifikasi SQL read-only: 8 tabel `public` semuanya RLS aktif dan punya policy; `anon` tidak punya hak tabel; tidak ada view; 5 fungsi semuanya `search_path=''`, fungsi `private` tidak bisa dieksekusi `anon`/`authenticated`, `verify_api_token` hanya `service_role`; `user_id`/`practice_count` tidak bisa ditulis client (`token_hash` hanya insert, sesuai desain); bucket `proofs` private, 4 MB, 4 mime, 3 policy; trigger `on_auth_user_created` ada.

**Berikutnya:** Security Advisor (lewat MCP setelah sesi dibuka dari `D:\`, atau dashboard → Advisors), lalu tahap 0 (sisa) |
| 1c. Migrasi admin `0004_admin.sql` | ✅ di-apply 24 Okt | Tambahan 24 Okt (lihat bagian "7. Admin Panel"). `npm run test:db` → **127/127 lulus**. Backup `D:\AL FITRA\backups\hustle-supabase\2026-10-24_121414_before-0004\` (`public`, `auth`, `storage`, `private`), lalu apply lewat `psql` dengan izin user (1 transaksi). Cek read-only: 8 tabel + `storage.objects` masing-masing punya 1 policy restrictive; `profiles` dapat `status` (default `pending`) dan `is_admin`; client tetap hanya bisa update `display_name`; 4 RPC admin + 2 helper `private` dengan `search_path=''`, tidak bisa dieksekusi `anon` |
| 1d. Privasi admin `0005_admin_privacy.sql` | ✅ di-apply 24 Okt (backup `…/2026-10-24_131815_before-0005`) | Permintaan user 24 Okt: jumlah lamaran per user disembunyikan dari admin, sesuai minimisasi data (UU PDP No. 27/2022, GDPR art. 5(1)(c)). `admin_list_users` tanpa `jobs_count`; `admin_system_stats` tanpa total lamaran/interview/rekomendasi/file (dengan sedikit akun, total pun membocorkan angka satu orang); tersisa status akun, waktu login, kapasitas DB/storage, token aktif. UI Users dan System disesuaikan |
| 1e. Admin kelola access key `0006_admin_tokens.sql` | ✅ di-apply 24 Okt (backup `…/2026-10-24_133855_before-0006`) | Permintaan user: admin bisa mengelola key MCP akun lain. Kolom `api_tokens.revoked_by` (pemilik hanya bisa membaca), RPC `admin_list_tokens` (email, nama, prefix, dibuat, terakhir dipakai, status; tanpa hash), `admin_revoke_token`, `admin_revoke_user_tokens`. Admin tidak bisa melihat isi key atau membuat key untuk orang lain. Pemilik melihat "Turned off by admin". UI: tab **Access keys** di Admin Panel (filter akun, cari, matikan satu / semua). Tes RLS 145/145. "Last used" tetap tampil untuk admin (keperluan keamanan) |
| 2. Auth Supabase | 🔄 kode ✅, belum dites dengan Supabase sungguhan | **24 Okt:** `src/lib/supabase/{config,server,client,proxy,admin}.ts`; `src/proxy.ts` (getClaims, CSRF juga untuk `/auth/signout`, `?next=`); `lib/server/account.ts` (`getCurrentAccount` per request + `deleteAccountCompletely`); `withAuth` → 401 / 403 untuk akun yang belum approved; halaman `/login` (email + password, kirim ulang verifikasi; **login Google dihapus atas permintaan user 24 Okt**), `/signup` (setelah daftar: **"1. verifikasi email, 2. tunggu approval admin"**, permintaan user), `/forgot-password`, `/reset-password`, `/pending` (pending/suspended), `/auth/callback` (code + token_hash), `POST /auth/signout`, `DELETE /api/account` + modal Account di sidebar (ketik email untuk konfirmasi, admin tidak bisa hapus diri). Auth HMAC + env lama dihapus, `.env.example` diperbarui, CSP + origin Supabase. Env baru: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. tsc ✅, eslint 0 peringatan, vitest 10/10 (`safeNextPath`), build ✅ (dengan env contoh). **Smoke test lokal (24 Okt, env asli):** halaman guest 200, halaman app → `/login?next=`, API 401, signout lintas origin 403, callback tanpa kode → `/login?error=link`. User sign up + verifikasi email berhasil, trigger membuat profil + settings, halaman `/pending` tampil. Akun owner (`7601bd7c-d5ca-4fd6-ac63-0d209bcf8998`) dijadikan admin + approved dengan izin user (UPDATE 1 baris). **Berikutnya:** user tes masuk dashboard + reset password, lalu tahap 3 |
| 3b. Admin Panel (UI + API) | ✅ dites user 24 Okt | **24 Okt:** `withAdmin` (withAuth + `is_admin`, selain admin → 404; RPC 42501 → 403, P0002 → 404). API `GET /api/admin/users`, `PATCH`/`DELETE /api/admin/users/[id]` (hapus: bukan diri sendiri/admin, dicek lewat RPC, lalu `deleteAccountCompletely`), `POST /api/admin/users/approve-all`, `GET /api/admin/system` (statistik + latency DB + cek secret key + pending + Upstash). UI `/admin` (`features/admin`): kartu Total/Approved/Pending/Suspended, tab Users (cari, filter, Approve/Restore, Suspend + konfirmasi, Delete dengan ketik email, Approve all, tabel md+ / kartu di HP, waktu WIB) dan System (health + pemakaian DB 500 MB / storage 1 GB). Sidebar: item "Admin Panel" hanya untuk admin + badge pending. Dicek di production (read-only, rollback): RPC sebagai admin → 1 akun, 203 lamaran; sebagai non-admin → "Admin only". tsc/eslint/vitest 40/build ✅ |
| 3. Repository + Storage, hapus Google | 🔄 kode ✅, menunggu tes user di browser | **24 Okt:** `withAuth` memberi argumen ke-3 `DataContext { db, userId, via }` (`lib/server/db.ts`: `must()`, `owned()`, `DbError` → pesan generik, 23505 → 409). 5 repository ditulis ulang di atas Supabase; semua query juga `eq('user_id')` (siap untuk jalur token). Tanggal: `timestamptz`, API tetap mengirim jam dinding Jakarta (`lib/jakartaTime.ts`), jadi UI/stats tidak berubah. Lampiran: `lib/server/proofs.ts` (upload all-or-nothing, hapus file saat lamaran dihapus), `attachments = {id, name, url}` dengan `url = /api/attachments/{id}` → redirect ke signed URL 60 detik (dibuat dengan client user, kena RLS storage). **Beda dari rencana:** bukan signed URL 1 jam di daftar, supaya link tidak kedaluwarsa saat tab lama terbuka dan list tidak membuat ratusan URL. Gmail dihapus (route sync, SourcesCard, tombol), `/api/recommendations` mengembalikan array. `src/lib/server/google/*`, `scripts/google-oauth-token.mjs`, env Google dihapus; `googleapis` pindah ke devDependencies (untuk skrip migrasi tahap 5), `google-auth-library` dihapus. tsc ✅, eslint ✅, vitest 26/26 (jakartaTime + jobMapper + safeNextPath), build ✅. |
| 4. Token per akun + halaman Connect AI + hustle-mcp v2 | ✅ dites end-to-end 24 Okt; Upstash aktif (60 lolos, ke-61 → 429, hitungan di Redis) | **24 Okt:** `lib/server/apiToken.ts` (`hst_` + 40 base62, SHA-256, `bearerToken`, `tokenAllowed`: hanya GET/POST `/api/jobs`, GET/PUT/PATCH `/api/jobs/{id}`; **tanpa DELETE/bulk**, lebih ketat dari rencana). `tokenContext.ts` (rate limit → `verify_api_token` → client secret key, satu-satunya jalur tanpa RLS). `tokenRateLimit.ts`: Upstash REST tanpa SDK (env `UPSTASH_REDIS_REST_*` atau `KV_REST_API_*`), fallback limiter memori, 60/menit/token. `withAuth(handler, { token: true })` hanya di route jobs; route lain menolak Bearer (403). `proxy.ts` meneruskan Bearer ke rute yang diizinkan. API `/api/tokens` (GET/POST) + `/api/tokens/[id]` (DELETE = revoke), hanya session; batas 5 → 409. Halaman **"Connect AI"** (`/integrations`, permintaan user: bahasa awam): "access key" bukan token, "turn off" bukan revoke, kartu 3 langkah, MCP hanya catatan kecil; kunci tampil sekali + config Claude Code / JSON terisi URL. Tes vitest `tokenScope.test.ts`: semua query jalur token difilter `user_id`, insert/upload membawa pemilik. **hustle-mcp 2.0.0** (bukan repo git; backup 1.0.1 di `D:\AL FITRA\backups\hustle-mcp-1.0.1`): `HUSTLE_API_TOKEN` Bearer, mode password dihapus, `attach_proof` pakai id, output nama file; README/CHANGELOG/.env.example; 15/15 tes. **Tes end-to-end 24 Okt (kunci asli "Laptop", localhost, hanya baca/dry-run):** key valid → 203 lamaran; key salah/rusak → 401; DELETE, bulk, settings, interviews, tokens, admin, attachments lewat key → ditolak; MCP stdio: 4 tool, list, add dry-run, guard duplikat, attach dry-run; `last_used_at` tercatat. Key ini sempat ditempel di chat: sarankan diganti setelah tes. **Belum:** `hustle-mcp` belum di npm (config di halaman memakai `npx -y hustle-mcp`) |
| 4b. Endpoint MCP di aplikasi (`/api/mcp`) | ✅ kode + tes e2e 24 Okt | Keputusan user: cara membagikan MCP ke pengguna lain = endpoint di dalam aplikasi (bukan npm). Streamable HTTP stateless (`@modelcontextprotocol/sdk` 1.32.2 dipin, `WebStandardStreamableHTTPServerTransport`, JSON response), auth access key lewat `withAuth({ token: true })` + rate limit yang sama; sesi browser ditolak. Tool: `hustle_list_applications`, `hustle_add_application` (dry run default, guard duplikat, validasi form), `hustle_update_application`, `hustle_proof_link`. **Batasan:** server jarak jauh tidak bisa membaca file di komputer pengguna, jadi bukti lewat link `/tracker?edit=<id>` (deep link baru yang membuka form lamaran). Halaman Connect AI: setup Claude Code (`--transport http` + header), Cursor/VS Code (JSON `url` + `headers`), Claude Desktop (`mcp-remote`, butuh Node.js). `hustle-mcp` lokal tetap ada untuk pemakaian pribadi (bisa melampirkan file langsung). Tes e2e (client MCP resmi via HTTP, hanya baca/dry-run): 4 tool, list 203, dry-run, guard duplikat, link bukti, id salah → error rapi, key salah/tanpa key → 401 |
| 5. Migrasi 203 lamaran | ✅ 24 Okt | Dimajukan sebelum tahap 4 atas permintaan user (skema sudah stabil). `scripts/migrate-from-sheets.mts` (+ `scripts/migrate/legacy.ts`, 14 tes vitest): dry-run default, `--apply`, idempoten. 15 file Drive hanya bisa dibaca service account → skrip mencoba OAuth lalu service account. **Perbaikan teks disetujui user:** find/replace lama "done"→"In Progress" dibalik (7 nama perusahaan + 3 link "Indonesia", 13 catatan "Done … ✅"); 1 link Web tidak valid dipindah ke catatan. Backup `D:\AL FITRA\backups\hustle-supabase\2026-10-24_130206_before-migrate-sheets\`. Hasil: 203/203 lamaran (status + stage identik), 99/99 file (28 MB, 0 baris tanpa file, 0 file di luar folder user), 1 interview, target mingguan; rekomendasi/profil kosong di Sheet. Sheet + Drive tidak diubah |
| 6. Preview → production | ⬜ | Setelah izin user |

### Catatan implementasi tahap 1 (24 Okt 2026)

- **`jobs.updated_at` dikelola aplikasi**, tanpa trigger. Nilai ini adalah "Last updated" (jam follow-up): perbaikan stage massal dan migrasi data lama sengaja mempertahankannya. Tabel lain memakai trigger `private.set_updated_at`.
- **`verify_api_token` ada di schema `public`**, bukan `private`, karena schema `private` tidak terekspos ke Data API. Fungsi ini aman karena execute hanya untuk `service_role` (di-revoke dari `public`/`anon`/`authenticated`, tercakup tes).
- **`record_practice` memakai `security definer`**, bukan invoker, karena `practice_count` sengaja tidak bisa ditulis client (grant per kolom). Fungsi tetap mengecek `auth.uid() is null` dan `user_id = auth.uid()`; panggilan pada pertanyaan milik orang lain mengembalikan null dan tidak mengubah apa pun.
- **Lampiran:** FK komposit `(job_id, user_id) → jobs(id, user_id)` dan check path `{user_id}/{job_id}/…` menjamin file hanya bisa menempel ke lamaran milik sendiri.
- **Untuk tahap 3:** `api_tokens.token_hash` tidak bisa di-select client. Jadi `.insert().select()` / `RETURNING` harus menyebut kolom secara eksplisit.
- **Lint:** 3 peringatan baru `no-location-assign-relative-destination` (eslint-config-next 16.4) di Sidebar, LoginForm, dan `api.ts`. Dua yang pertama ditulis ulang di tahap 2.

## Context

Hustle (`D:\AL FITRA\GITHUB\HUSTLE APPS`, live di https://hustle-apps-six.vercel.app) saat ini aplikasi **1 pemilik**:
- login = email + password dari env, session cookie HMAC dengan `sub === OWNER_EMAIL`;
- semua data ada di **1 Google Sheet** (5 tab: DataLowongan, Interviews, Settings, Profile, Recommendations) + **1 folder Drive** (bukti) + **Gmail pemilik** (Job match);
- tidak ada `user_id` di mana pun.

User ingin aplikasi ini **bisa dipakai semua orang**: setiap akun punya data sendiri yang terisolasi oleh **RLS yang kuat**. User juga ingin **halaman di sidebar untuk generate API token**, supaya tiap orang bisa menyambungkan MCP server (`D:\AL FITRA\GITHUB\hustle-mcp`) ke akunnya.

**Keputusan user (24 Okt 2026):**
- Supabase (Postgres + RLS + Auth + Storage).
- Login email + password (wajib verifikasi email). ~~+ Google~~: dibatalkan user 24 Okt, cukup email.
- 203 lamaran lama **dipindah ke akun user**; Google Sheet tetap disimpan sebagai arsip.
- Job match **mode tempel saja**: Gmail dihapus, karena scope `gmail.readonly` untuk aplikasi publik wajib lolos verifikasi Google.

**Hasil yang dituju:** siapa pun bisa daftar dan memakai Hustle dengan data terpisah. Isolasi data dibuktikan oleh tes RLS. MCP tersambung dengan token per akun yang dibuat dari sidebar. Data lama user utuh dan sudah terverifikasi.

**Catatan:** perubahan API token berbasis env yang belum di-commit (6 file) **disimpan dengan `git stash`**, karena diganti oleh token per akun di database.

---

## Arsitektur

Acuan utama: proyek **Preloved** milik user (`D:\AL FITRA\GITHUB\Preloved`). Semua yang bisa dipakai ulang diambil dari sana:
- `src/lib/supabase/{server,proxy,client}.ts`, `src/lib/safe-redirect.ts`;
- `supabase/migrations/0001_init.sql`, `0002_storage.sql`;
- `supabase/tests/rls.test.mjs`.

Ditambah dua pola dari proyek lain:
- callback `token_hash`/`verifyOtp` milik **Valora** (`valora-web/src/app/auth/callback/route.ts`);
- rate limit Upstash milik **Nunnn** (`src/lib/rate-limit.ts`).

**4 lapis pengecekan** (seperti `Preloved/docs/SECURITY.md` §4.1):
1. `proxy.ts`: refresh session Supabase dan redirect halaman;
2. layout `(app)`;
3. setiap API route (`withAuth` → konteks user);
4. **RLS di database**, yang tetap melindungi walaupun ada bug di lapis 1–3.

### 1. Database (`supabase/migrations/`, baru)

Setiap tabel data punya:
- `user_id uuid not null default auth.uid() references auth.users on delete cascade`;
- RLS aktif, plus 4 policy `to authenticated` dengan `using`/`with check (user_id = (select auth.uid()))`;
- `revoke all` dari `anon`/`authenticated`, lalu **grant per kolom**. `user_id` tidak bisa di-insert atau di-update oleh client; nilainya selalu dari default `auth.uid()`. Ini mencegah *mass assignment* (temuan F3-01 di laporan keamanan Nunnn).

| Tabel | Isi (dari data layer sekarang) |
|---|---|
| `profiles` | `id = auth.uid()`, `display_name`, `created_at`. Dibuat otomatis oleh trigger `private.handle_new_user()` saat sign up |
| `jobs` | `id uuid`, `legacy_id text` (unique per user, contoh `ID-1792739901655`), company, position, `applied_at`/`scheduled_at timestamptz` (wall-clock Asia/Jakarta), `contract_date date`, `stage_dates jsonb`, status/stage (check = `JOB_STATUSES`/`JOB_STAGES`), platform, career_level, province, city, note, 4 link, created_at, updated_at (trigger) |
| `job_attachments` | `job_id` → jobs (cascade), `storage_path` (`{uid}/{job_id}/{file}`), file_name, mime, size |
| `interview_questions` | Kolom STAR + difficulty/status/category (check), `practice_count`, `last_practiced_at`. RPC `record_practice(id)` untuk penambahan yang atomik (*security invoker*, tetap kena RLS) |
| `candidate_profiles` | 1 baris per user: list = `text[]`, `years_experience numeric`, `parsed_at` |
| `recommendations` | `external_id` (id LinkedIn / `h_…`), `dedupe_key`; unique `(user_id, external_id)` dan `(user_id, dedupe_key)` |
| `user_settings` | Target mingguan aplikasi dan interview |
| `api_tokens` | name, `token_prefix` (8 karakter untuk ditampilkan), `token_hash` (SHA-256, unique), created_at, last_used_at, `revoked_at`. **Token asli tidak pernah disimpan.** Maksimal 5 token aktif per user (trigger) |

- **Fungsi private** (schema `private`, `security definer set search_path = ''`, execute di-revoke dari `public, anon`):
  - `set_updated_at`, `handle_new_user`;
  - `verify_api_token(hash) → user_id` yang juga meng-update `last_used_at`.
  - Pelajaran Nunnn ikut diterapkan: `auth.uid() is null` dicek lebih dulu, tidak ada pengecekan berbasis email, dan `search_path = ''`.
- **Storage:** bucket `proofs` **private** (`public = false`), `file_size_limit` 4 MB, mime PDF/PNG/JPG/WebP. Policy per folder: `(storage.foldername(name))[1] = (select auth.uid())::text`. File dibuka lewat **signed URL** (1 jam) yang dibuat dengan client user, jadi tetap kena RLS storage.

### 2. Auth (Supabase SSR)

- Paket: `@supabase/ssr` + `@supabase/supabase-js`. **Next dinaikkan dari 16.2.6** ke versi 16 yang sudah menambal CVE proxy bypass (temuan F1-01 Nunnn).
- File:
  - `src/lib/supabase/{server,client,proxy,admin}.ts` (pola Preloved; `admin.ts` = service role, `server-only`);
  - `src/proxy.ts` ditulis ulang: `updateSession()` + `getClaims()`, redirect `/login?next=`, cek CSRF tetap ada.
- Halaman:
  - `/login` dan `/signup` (email + password saja; tombol Google dibatalkan 24 Okt);
  - `/auth/callback` (PKCE `code` + `token_hash`/`verifyOtp` + `safeNextPath`);
  - `/forgot-password` dan `/reset-password`;
  - `POST /auth/signout`.
- Dihapus: `src/lib/auth.ts` (HMAC), `/api/auth/login|logout`, env `OWNER_EMAIL`/`LOGIN_PASSWORD`/`JWT_SECRET`/`OWNER_NAME`, `src/features/auth/LoginForm.tsx` (diganti form baru).
- Nama di sidebar diambil dari `profiles.display_name` (`src/app/(app)/layout.tsx`, `AppShell`, `Sidebar`). Teks "You will need your password" dan "Private workspace" disesuaikan.
- Tambahan: **hapus akun** (Settings): data ter-cascade dan file storage di folder user ikut dihapus.

### 3. Lapisan data (ganti Google → Supabase)

- `src/lib/server/http.ts`:
  - `withAuth` memberi handler `ctx = { db, userId, via: 'session' | 'token' }`;
  - session → `db` = client user (RLS);
  - error Postgres tidak pernah dikirim mentah ke client (temuan F4-01 Nunnn).
- `src/lib/server/repositories/{jobs,interviews,settings,profile,recommendations}.ts` ditulis ulang di atas Supabase:
  - **tanda tangan fungsi tetap sama**, ditambah `ctx`, supaya API route dan UI hampir tidak berubah;
  - `toJob`/mapping tetap menghasilkan tipe `Job` yang sama (`src/lib/types.ts`), jadi `stats.ts`, `followUp.ts`, `stageDates.ts` (logika hari ini Asia/Jakarta) dan semua komponen tetap jalan.
- Lampiran:
  - `src/lib/server/jobForm.ts` + `uploads.ts` (validasi magic bytes tetap dipakai) → upload ke Storage;
  - `attachments` di API = daftar `{ id, name, url }` dengan signed URL;
  - `keepAttachments` memakai **id lampiran**, bukan URL;
  - upload gagal → file yang sudah terunggah dihapus (sekarang file Drive tertinggal).
- Dihapus: `src/lib/server/google/*`, `scripts/google-oauth-token.mjs`, `/api/recommendations/sync`, `GmailNotConfiguredError`, dependensi `googleapis`/`google-auth-library`. `src/instrumentation.ts` dan `env.ts` hanya memvalidasi env Supabase.
- `next.config.ts` CSP: tambah `https://<ref>.supabase.co` di `connect-src`/`img-src`.

### 4. API token per akun + halaman sidebar

- Sidebar `NAV` (`src/components/layout/Sidebar.tsx`): item baru **"Connect AI (MCP)"** → `/integrations` (ikon `Plug`).
- `src/features/integrations/` (pola `features/matches`: View + `integrationsApi.ts` + modal):
  - daftar token (nama, prefix `hst_ab12…`, dibuat, terakhir dipakai);
  - **Generate token**: ditampilkan **sekali** dengan tombol salin, plus contoh config MCP (perintah `claude mcp add …` dan JSON untuk Claude Desktop/Cursor) yang sudah terisi URL aplikasi;
  - **Revoke** (`ConfirmDialog`).
- API `src/app/api/tokens/route.ts` (GET, POST) dan `[id]/route.ts` (DELETE): **hanya session**, token tidak bisa membuat token baru.
- Jalur token: `Authorization: Bearer hst_…`
  1. di-hash, lalu `private.verify_api_token` → `user_id`;
  2. hanya berlaku di `/api/jobs*` (scope);
  3. query memakai client service-role yang **dibatasi di satu modul** (`src/lib/server/tokenContext.ts`): semua query wajib `eq('user_id', userId)`, dan ini dicakup tes;
  4. rate limit Upstash 60 request/menit per token (pola Nunnn; nonaktif kalau env tidak di-set).
  - Inilah **satu-satunya jalur yang melewati RLS**. Tercatat di README bagian Security.
- **`hustle-mcp` v2.0.0:**
  - auth `HUSTLE_API_TOKEN` (Bearer); mode password dihapus karena login Supabase tidak lewat API;
  - `attach_proof` memakai id lampiran;
  - update README, CHANGELOG, dan tes;
  - config `hustle` milik user diganti ke token.

### 5. Migrasi data lama (sekali jalan)

`scripts/migrate-from-sheets.ts` (dijalankan lokal dengan `tsx`; dependensi Google hanya di devDependencies untuk script ini):
- Baca 5 tab (logika baca header dan alias `linkother` dari repository lama). Normalisasi memakai `normalizeStatus`/`normalizeStage`, `appliedAt` fallback ke Timestamp, `'No File'` = tanpa lampiran, dan tanggal campuran via `parseDate` (`src/lib/format.ts`).
- Unduh file Drive → unggah ke `proofs/{uid}/{job_id}/…` → isi `job_attachments`.
- Insert dengan service role ke akun user (berdasarkan email). **Idempoten**: unique `(user_id, legacy_id)`, sehingga aman dijalankan ulang.
- Mode `--dry-run` (default) menampilkan jumlah dan contoh mapping. Verifikasi setelah migrasi:
  - jumlah per tabel sama (203 lamaran, interview, rekomendasi, profil, settings);
  - jumlah per status/stage sama;
  - jumlah file lampiran sama.
- Google Sheet dan Drive **tidak diubah** (arsip). Setelah stabil, secret Google lama di-rotate atau dicabut (catatan lama di `PROGRESS.md`).

### 7. Admin Panel (tambahan, disetujui user 24 Okt 2026)

Meniru Admin Panel Nunnn Stock (tab Users + System), tanpa celah yang ada di sana (cek admin berbasis email, `claim_first_admin`).

**Keputusan user:** pendaftar baru **wajib di-approve**; admin **hanya melihat metadata** (bukan isi data user lain); tab System berisi **statistik + kesehatan**. **Diperketat 24 Okt (0005):** admin juga tidak melihat jumlah lamaran per user maupun total konten semua akun; System hanya berisi kesehatan + kapasitas. Admin: `alfitranurr@gmail.com`.

- **Database (`0004_admin.sql`):**
  - `profiles` + `status` (`pending` default / `approved` / `suspended`), `is_admin`, `reviewed_at`, `reviewed_by`. Client tidak bisa menulis kolom ini (grant per kolom tetap hanya `display_name`). Check: admin selalu `approved`.
  - Gerbang approval = policy **restrictive** `private.is_approved()` di semua tabel data dan bucket `proofs`. Akun pending/suspended hanya bisa membaca profilnya sendiri. Data akun suspended tetap tersimpan.
  - `record_practice` dan `verify_api_token` ikut mengecek status, jadi token MCP akun pending/suspended langsung mati.
  - RPC admin (cek `private.is_admin()` di dalam, selain admin → 42501): `admin_list_users()` (email, nama, status, tanggal daftar, verifikasi email, login terakhir, jumlah lamaran), `admin_set_status(target, 'approved'|'suspended')` (tidak bisa ke diri sendiri atau admin lain), `admin_approve_all_pending()`, `admin_system_stats()` (angka agregat saja).
  - **Tidak ada `claim_first_admin`.** Akun owner dijadikan admin dengan satu SQL setelah sign up dan email terverifikasi: `update public.profiles set is_admin = true, status = 'approved' where id = (select id from auth.users where email = 'alfitranurr@gmail.com' and email_confirmed_at is not null)` (tulis ke production, perlu izin).
- **Auth (tahap 2):** layout `(app)` membaca `profiles.status`; selain `approved` → `/pending` (status + tombol keluar). `withAuth` → 403 untuk akun yang belum approved.
- **UI + API (tahap 3b):**
  - Sidebar: item **"Admin Panel"** (ikon `ShieldCheck`) hanya untuk admin, dengan badge jumlah pending.
  - `/admin` (layout cek `is_admin`, bukan admin → 404): kartu Total / Approved / Pending; tab **Users** (cari email, filter All/Pending/Approved/Suspended, Approve, Suspend dengan `ConfirmDialog`, Approve all, Delete); tab **System** (statistik dari `admin_system_stats`, ukuran storage dan database, koneksi Supabase, env opsional seperti Upstash yang belum di-set).
  - API `/api/admin/users` (GET), `/api/admin/users/[id]` (PATCH status, DELETE), `/api/admin/users/approve-all`, `/api/admin/system`: hanya session, memanggil RPC dengan client user (RLS + cek admin di database).
  - **Delete user:** API cek `is_admin` milik pemanggil (kolom yang tidak bisa ditulis client) dan target bukan admin/diri sendiri, lalu service role menghapus file `proofs/{uid}/…` dan `auth.admin.deleteUser` (data ter-cascade). Helper yang sama dipakai fitur "hapus akun" sendiri.

### 6. Urutan kerja

| Tahap | Isi | Siapa |
|---|---|---|
| 0 | Buat project Supabase (free tier). Aktifkan Email (confirm on). Isi redirect URL (localhost, production, wildcard preview Vercel). Berikan URL, publishable key, dan service role key (lokal + env Vercel) | **User** (panduan langkah demi langkah saya siapkan) |
| 1 | Branch `feat/multi-user`; stash perubahan token env; naikkan versi Next; migrasi SQL + storage + **tes RLS** | Saya |
| 2 | Auth Supabase (proxy, halaman, callback, reset password, hapus akun) | Saya |
| 3 | Repository + API route + lampiran Storage; hapus Google/Gmail | Saya |
| 4 | Tabel token + halaman "Connect AI (MCP)" + `hustle-mcp` v2 | Saya |
| 5 | Script migrasi: dry-run → kamu cek → jalankan → verifikasi jumlah | Saya, setelah izinmu |
| 6 | Deploy preview Vercel → kamu tes → merge ke `master` (production) → update PROGRESS.md + README | Setelah izinmu |

Tidak ada push, deploy, ataupun penulisan ke database production tanpa persetujuanmu di tiap tahap.

---

## Verifikasi

1. **Tes RLS** (`npm run test:db`, PGlite + harness Preloved, tanpa Docker). Minimal mencakup:
   - user A tidak bisa select/update/delete data user B di semua tabel;
   - insert dengan `user_id` orang lain ditolak;
   - `anon` tidak bisa membaca apa pun;
   - kolom terlarang (`user_id`, `token_hash`) tidak bisa di-update;
   - `record_practice` milik orang lain → 0 baris;
   - storage: memalsukan folder `{uid lain}/…` ditolak;
   - `api_tokens`: user hanya melihat tokennya sendiri, batas 5 token, fungsi private tidak bisa dipanggil `anon`.
2. **Unit test (vitest):**
   - mapper repository (`Job` ↔ baris);
   - normalisasi script migrasi (status/stage/tanggal lama);
   - verifikasi token (hash, revoked, scope);
   - `safeNextPath`.
3. `npx tsc --noEmit`, `npx eslint src`, `npm run build` (sesuai `PROGRESS.md`).
4. **End-to-end di lokal / preview dengan 2 akun:**
   - daftar email (verifikasi), lupa password;
   - akun A tidak melihat data akun B (UI dan API langsung dengan cookie A ke id milik B → 404);
   - upload/lihat/hapus bukti;
   - generate token → `hustle-mcp` v2: list, add (dry run lalu simpan), attach, update di akun yang benar;
   - token di-revoke → 401; token ke `/api/settings` → 401.
5. **Migrasi:** dry-run → jalankan → jumlah 203 lamaran plus distribusi status/stage plus jumlah file **sama persis** dengan Sheet. Spot-check 5 lamaran di UI.
6. **Supabase Security Advisor:** 0 peringatan untuk tabel/fungsi tanpa RLS atau `search_path`.
7. Cek tampilan sesuai `PROGRESS.md` (1280@150%, 1600@120%, 390 px) untuk halaman login baru dan "Connect AI".
