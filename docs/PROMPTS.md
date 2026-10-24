# Prompt siap tempel: migrasi Hustle multi-user

Tempel di sesi Claude Code yang dibuka dari folder `D:\AL FITRA\GITHUB\HUSTLE APPS` (tempat MCP Supabase tersambung). Jalankan berurutan, satu tahap per sesi atau per beberapa pesan. Setiap prompt meminta Claude membaca `CLAUDE.md` dan `docs/MULTI_USER_PLAN.md`, jadi tidak perlu menjelaskan ulang.

## Checklist progres

Centang (`[x]`) setelah langkahnya benar-benar selesai. Rincian status ada di tabel status `docs/MULTI_USER_PLAN.md`.

| | Prompt | Langkah | Catatan |
|---|---|---|---|
| [x] | Tahap 1 | Migrasi SQL `0001`–`0003` dibuat | `supabase/migrations/` |
| [x] | Tahap 1 | Tes RLS lokal (`npm run test:db`) lulus | 92/92 |
| [x] | Tahap 1b | Backup database sebelum migrasi | `D:\AL FITRA\backups\hustle-supabase\2026-10-24_120037_before-0001\` |
| [x] | Tahap 1b | Apply `0001_core.sql` | Lewat `psql`, 24 Okt |
| [x] | Tahap 1b | Apply `0002_api_tokens.sql` | Lewat `psql`, 24 Okt |
| [x] | Tahap 1b | Apply `0003_storage.sql` | Lewat `psql`, 24 Okt |
| [x] | Tahap 1b | RLS aktif di semua tabel (cek SQL) | 8 tabel, semuanya ada policy |
| [ ] | Tahap 1b | Security Advisor bersih | Butuh MCP atau dashboard → Advisors |
| [x] | Tahap 1c | Migrasi `0004_admin.sql` + tes lokal | 127/127 |
| [x] | Tahap 1c | Backup + apply `0004_admin.sql` | Lewat `psql`, 24 Okt |
| [x] | Tahap 1d | Migrasi `0005_admin_privacy.sql` + tes lokal | 129/129 |
| [x] | Tahap 1d | Backup + apply `0005_admin_privacy.sql` | Lewat `psql`, 24 Okt, dengan izin |
| [x] | Tahap 1e | `0006_admin_tokens.sql` (admin kelola access key): tes lokal + apply | 145/145, 24 Okt, dengan izin |
| [ ] | Tahap 1e | Tes tab Access keys di Admin Panel | User |
| [x] | Tahap 0 (sisa) | Email confirm aktif, password minimal 8 | Dicek lewat `/auth/v1/settings`: confirm on, Google off |
| [ ] | Tahap 0 (sisa) | Site URL + Redirect URLs | |
| [x] | Tahap 0 (sisa) | Env Supabase di `.env.local` | 24 Okt; secret key dicek (admin API 200) |
| [x] | Tahap 2 | Kode auth Supabase (proxy, login/signup, callback, reset password, `/pending`, hapus akun) | tsc/eslint/vitest/build lulus |
| [ ] | Tahap 2 | Tes login sungguhan (daftar, verifikasi email, login, reset password) | Setelah tahap 0 |
| [x] | Tahap 2 | Akun alfitranurr@gmail.com dijadikan admin | 24 Okt, dengan izin; id `7601bd7c-…` |
| [x] | Tahap 3 | Repository + Storage, kode Google dihapus (kode) | tsc/eslint/vitest 26/26/build lulus |
| [ ] | Tahap 3 | Tes di browser: tambah/edit/hapus lamaran + bukti, interview, Job match, target mingguan | User |
| [x] | Tahap 3b | Admin Panel: sidebar, `/admin` (Users + System), API admin (kode) | RPC dicek di production |
| [x] | Tahap 3b | Tes Admin Panel di browser | User, 24 Okt: berhasil |
| [x] | Tahap 4 | API token + halaman "Connect AI" (kode) | vitest 55, build lulus |
| [x] | Tahap 4 | `hustle-mcp` v2.0.0 (kode) | 15/15 tes |
| [x] | Tahap 4 | Tes end-to-end dengan access key asli | 24 Okt: HTTP 13 kasus + MCP stdio (list, add/attach dry-run, guard duplikat) |
| [x] | Tahap 4/6 | Upstash Redis dibuat + env diisi | 24 Okt via Vercel Storage; tes rate limit lulus |
| [ ] | Tahap 6 | `hustle-mcp` dipublikasikan (npm) atau cara lain dibagikan | Perlu keputusan user |
| [ ] | Tes E2E | 2 akun tes lulus | |
| [ ] | Tes E2E | Akun test-a / test-b dihapus | |
| [x] | Tahap 5 | Dry-run migrasi dicek | 24 Okt, perbaikan teks disetujui |
| [x] | Tahap 5 | 203 lamaran dimigrasi, jumlah cocok dengan Sheet | 203/203, 99 file, status/stage identik |
| [ ] | Tahap 6 | Commit + push + PR + preview Vercel dites | |
| [ ] | Tahap 6 | Merge ke `master`, production jalan | |
| [ ] | Tahap 6 | Secret Google lama di-rotate / dicabut | |

---

## Mulai / lanjut kapan saja (prompt umum)

```text
Baca CLAUDE.md dan docs/MULTI_USER_PLAN.md. Ringkas status tiap tahap dari tabel status dan cek git status branch feat/multi-user, lalu lanjutkan tahap yang sedang berjalan. Ikuti aturan keamanan Supabase di CLAUDE.md: perintah baca boleh langsung, setiap perintah tulis ke database tunggu izin saya.
```

## Tahap 1: skema database + RLS + tes lokal

```text
Baca CLAUDE.md dan docs/MULTI_USER_PLAN.md, lalu kerjakan tahap 1.
1. Cek project Supabase secara read-only: list tables, extensions, dan jalankan Security Advisor. Laporkan hasilnya.
2. Buat migrasi di supabase/migrations/ sesuai bagian "1. Database" di rencana: semua tabel dengan user_id + RLS + grant per kolom, schema private, trigger handle_new_user dan set_updated_at, RPC record_practice, tabel api_tokens + private.verify_api_token, bucket storage proofs (private) + policy per folder. Pakai pola Preloved (D:\AL FITRA\GITHUB\Preloved\supabase\migrations) dan hindari kesalahan RLS dari laporan Nunnn.
3. Buat supabase/tests/rls.test.mjs (PGlite, pola Preloved) dengan semua skenario di bagian Verifikasi nomor 1, tambahkan script npm "test:db", lalu jalankan sampai semua lulus.
4. Jangan apply ke Supabase dulu. Tunjukkan ringkasan tabel, policy, dan hasil tes, lalu update tabel status di docs/MULTI_USER_PLAN.md.
```

## Tahap 1b: apply migrasi ke Supabase (setelah tes lokal lulus)

```text
Tes RLS lokal sudah lulus. Sekarang:
1. Backup database dengan supabase db dump ke folder lokal di luar git, dan tunjukkan lokasinya.
2. Tunjukkan daftar migrasi yang akan di-apply, lalu apply satu per satu lewat MCP (saya akan klik izin untuk tiap migrasi).
3. Setelah itu jalankan Security Advisor dan list tables untuk memastikan RLS aktif di semua tabel dan tidak ada peringatan. Update tabel status.
```

## Tahap 0 (sisa): pengaturan dashboard Supabase

```text
Pandu saya langkah demi langkah mengisi pengaturan dashboard Supabase untuk project rzzzqmvafauvdpbzupdv:
1. Authentication: aktifkan Email dengan "Confirm email" menyala dan panjang password minimal 8 (login Google tidak dipakai).
2. URL Configuration: Site URL dan Redirect URLs untuk localhost:3000, https://hustle-apps-six.vercel.app, dan preview Vercel (wildcard).
3. Ambil Project URL, publishable key, dan service role key, lalu isi ke .env.local (tunjukkan nama variabelnya saja, saya yang menempel nilainya; jangan tampilkan atau baca nilainya di chat).
Cek hasilnya secara read-only kalau bisa lewat MCP.
```

## Tahap 2: autentikasi Supabase

```text
Baca CLAUDE.md dan docs/MULTI_USER_PLAN.md, lalu kerjakan tahap 2 (bagian "2. Auth"): src/lib/supabase/{server,client,proxy,admin}.ts pola Preloved, tulis ulang src/proxy.ts, halaman login, signup, auth/callback (code + token_hash), forgot-password, reset-password, signout, nama di sidebar dari profiles, dan fitur hapus akun. Hapus auth HMAC lama dan env OWNER_*/LOGIN_PASSWORD/JWT_SECRET. Baca dulu dokumentasi Next.js 16 di node_modules/next/dist/docs untuk proxy dan route handler. Jalankan tsc, eslint, build, dan unit test safeNextPath. Update tabel status.
```

## Tahap 3: lapisan data ke Supabase + Storage

```text
Kerjakan tahap 3 di docs/MULTI_USER_PLAN.md: withAuth memberi ctx { db, userId, via }, tulis ulang semua repository (jobs, interviews, settings, profile, recommendations) di atas Supabase dengan tanda tangan fungsi tetap sama, lampiran ke bucket proofs dengan signed URL (attachments = {id, name, url}, keepAttachments pakai id), hapus semua kode Google/Gmail beserta dependensinya, update CSP di next.config.ts. Tambahkan unit test vitest untuk mapper repository. Jalankan tsc, eslint, build, dan test. Update tabel status.
```

## Tahap 4: API token per akun + halaman "Connect AI (MCP)" + hustle-mcp v2

```text
Kerjakan tahap 4 di docs/MULTI_USER_PLAN.md:
1. API /api/tokens (session saja), src/lib/server/tokenContext.ts (verify_api_token, scope /api/jobs, semua query eq user_id), rate limit Upstash opsional.
2. Item sidebar "Connect AI (MCP)" + src/features/integrations (daftar token, generate yang ditampilkan sekali dengan tombol salin dan contoh config claude mcp add / JSON, revoke). Ikuti komponen UI yang sudah ada.
3. Update D:\AL FITRA\GITHUB\hustle-mcp ke v2.0.0: auth HUSTLE_API_TOKEN (Bearer), hapus mode password, attach_proof pakai id lampiran, update README, CHANGELOG, dan tes.
Jalankan semua tes. Update tabel status.
```

## Tes end-to-end dengan 2 akun (setelah tahap 1–4)

```text
Bantu saya tes end-to-end di lokal (npm run dev) sesuai bagian Verifikasi nomor 4: daftar 2 akun tes (test-a dan test-b), pastikan data tidak saling terlihat lewat UI dan lewat API langsung, upload/lihat/hapus bukti, generate token dan tes hustle-mcp v2, token di-revoke → 401, token ke /api/settings → 401. Setelah selesai, hapus kedua akun tes (minta izin saya untuk penghapusannya).
```

## Tahap 5: migrasi 203 lamaran lama

```text
Kerjakan tahap 5 di docs/MULTI_USER_PLAN.md: buat scripts/migrate-from-sheets.ts (tsx). Jalankan dulu --dry-run dan tunjukkan jumlah per tabel, distribusi status/stage, jumlah file lampiran, dan 5 contoh hasil mapping. Jangan menulis apa pun ke Supabase sebelum saya setuju. Setelah saya setuju: backup database, jalankan migrasi ke akun saya, lalu verifikasi jumlahnya sama persis dengan Google Sheet. Google Sheet dan Drive tidak boleh diubah.
```

## Tahap 6: preview lalu production

```text
Kerjakan tahap 6 di docs/MULTI_USER_PLAN.md: rangkum semua perubahan di branch feat/multi-user, commit dengan pesan yang rapi, lalu tanya saya sebelum push. Setelah saya setuju: push branch, buat Pull Request, dan bantu cek deploy preview Vercel (env Supabase di Vercel, redirect URL preview). Setelah saya tes dan setuju, merge ke master, update PROGRESS.md dan README, dan pastikan production jalan. Ingatkan saya untuk rotate atau cabut secret Google lama setelah stabil.
```
