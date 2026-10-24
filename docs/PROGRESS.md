# Progress: migrasi Hustle multi-user

_Terakhir diperbarui: 24 Oktober 2026 · branch `feat/multi-user` · rencana lengkap di `docs/MULTI_USER_PLAN.md`_

Legenda: ✅ selesai · 🔄 sedang dikerjakan · ⬜ belum · 👤 dikerjakan pemilik akun · 🤖 dikerjakan Claude · 🔒 butuh izin pemilik

## Sisa pekerjaan

### A. Deploy (urut)

| # | Pekerjaan | Siapa | Status |
|---|---|---|---|
| 1 | Isi env Supabase di Vercel (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (Secret) | 🤖 lewat Vercel CLI, atas permintaan pemilik | ✅ 24 Okt; 2 nilai publik dicek cocok (hash), secret dicek di langkah 3 |
| 2 | Push branch `feat/multi-user` + buat Pull Request ke `master` | 🤖 🔒 | ✅ 24 Okt: [PR #9](https://github.com/alfitranurr/HUSTLE-APPS/pull/9); data uji di tes diganti nama fiktif (repo publik) |
| 3 | Tes **preview deployment**: login, 203 lamaran, file bukti, Admin Panel (System: "Secret key: Works", "Rate limiting" hijau), Connect AI, `/api/mcp` | 👤 (🤖 cek log) | ✅ 24 Okt, user |
| 4 | Merge ke `master` → production | 🤖 🔒 | ✅ 24 Okt: PR #9 → `70efedb`, production Ready |
| 5 | Cek production setelah merge (login, data, `/api/mcp`) | 🤖 + 👤 | ✅ 24 Okt: `/login` baru, `/dashboard` → login, `/api/jobs` 401, `/api/mcp` menolak key salah |
| 5b | Domain utama **`hustle-career.vercel.app`** (permintaan user; `hustle.vercel.app` milik akun lain). `hustle-apps-six.vercel.app` tetap jalan | 🤖 | ✅ 24 Okt, dicek |
| 5d | Alamat lama `hustle-apps-six.vercel.app` dimatikan: redirect permanen 308 ke `hustle-career.vercel.app` (path ikut; tidak dihapus supaya namanya tidak bisa diambil orang lain). Deployment lama hanya bisa dibuka lewat login Vercel | 🤖 atas permintaan user | ✅ 24 Okt, dicek |
| 5c | Supabase URL Configuration: Site URL → `https://hustle-career.vercel.app`, tambah Redirect URL `https://hustle-career.vercel.app/**` | 👤 | ✅ 24 Okt |

### B. Tepat setelah production jalan

| # | Pekerjaan | Siapa | Status |
|---|---|---|---|
| 6 | Ganti config MCP `hustle` di Claude ke versi URL (`--transport http`); config lama (login password) mati setelah merge | 🤖 🔒 | ✅ 24 Okt: user scope → `https://hustle-career.vercel.app/api/mcp`, Connected, tool dites (203 lamaran) |
| 7 | Regenerate access key "Laptop" (sempat ditempel di chat), pakai key baru di langkah 6 | 👤 | ✅ 24 Okt (key baru juga sempat ditempel di chat: regenerate sekali lagi jika ingin bersih) |
| 7b | Tombol **Delete** untuk key yang sudah dimatikan (`0007_delete_turned_off_keys.sql` + UI) | 🤖 🔒 | ✅ 24 Okt: 0007 di-apply (backup), PR #10 → production |
| 7c | MCP CRUD penuh (permintaan user): `hustle_get_application`, add/edit semua kolom form (link, jadwal, tanggal kontrak, stage dates, catatan per poin), hapus file bukti, `hustle_delete_application` (wajib `confirm`); halaman Connect AI diperbarui | 🤖 🔒 | ✅ 24 Okt: tes tulis di akun (tambah → ubah → hapus, data kembali 203), PR #11 → production, 6 tool aktif |
| 8 | Update `README.md`, root `PROGRESS.md`, bagian "Current work" di `CLAUDE.md` | 🤖 | ⬜ |

### C. Bersih-bersih keamanan (setelah production stabil)

| # | Pekerjaan | Siapa | Status |
|---|---|---|---|
| 9 | Supabase: matikan legacy API keys + rotate secret key (sempat ditempel di chat), update `.env.local` + Vercel | 👤 (🤖 memandu, update env) | ⬜ |
| 10 | Upstash: reset token (sempat ditempel di chat), salin yang baru ke `.env.local` | 👤 | ⬜ |
| 11 | Hapus env lama di Vercel: `OWNER_EMAIL`, `OWNER_NAME`, `LOGIN_PASSWORD`, `JWT_SECRET`, `GOOGLE_*` | 🤖 🔒 | ⬜ |
| 12 | Cabut / rotate secret Google lama (OAuth client, service account); Sheet + Drive tetap arsip | 👤 | ⬜ |
| 13 | Hapus env Google + `HUSTLE_API_TOKEN` dari `.env.local` | 🤖 | ⬜ |
| 14 | Buang `git stash` lama (token env, sudah digantikan) | 🤖 🔒 | ⬜ |

### D. Opsional

| # | Pekerjaan | Siapa | Status |
|---|---|---|---|
| 15 | Isi Stage dates 8 lamaran lama yang sudah lewat Screening (Insights jadi akurat) | 👤 | ⬜ |
| 16 | Simpan folder `hustle-mcp` ke git (sekarang bukan repo; backup 1.0.1 ada) | 🤖 🔒 | ⬜ |
| 17 | Jika naik ke paket Pro: nyalakan *leaked password protection* di Supabase | 👤 | ⬜ |

## Sudah selesai (riwayat)

Semua langkah sejak 24 Oktober 2026. Rincian teknis per tahap ada di tabel status `docs/MULTI_USER_PLAN.md`.

| | Prompt | Langkah | Catatan |
|---|---|---|---|
| [x] | Tahap 1 | Migrasi SQL `0001`–`0003` dibuat | `supabase/migrations/` |
| [x] | Tahap 1 | Tes RLS lokal (`npm run test:db`) lulus | 92/92 |
| [x] | Tahap 1b | Backup database sebelum migrasi | `D:\AL FITRA\backups\hustle-supabase\2026-10-24_120037_before-0001\` |
| [x] | Tahap 1b | Apply `0001_core.sql` | Lewat `psql`, 24 Okt |
| [x] | Tahap 1b | Apply `0002_api_tokens.sql` | Lewat `psql`, 24 Okt |
| [x] | Tahap 1b | Apply `0003_storage.sql` | Lewat `psql`, 24 Okt |
| [x] | Tahap 1b | RLS aktif di semua tabel (cek SQL) | 8 tabel, semuanya ada policy |
| [x] | Tahap 1b | Security Advisor | 24 Okt: 0 error, 9 warning yang disengaja (lihat MULTI_USER_PLAN tahap 1) |
| [x] | Tahap 1c | Migrasi `0004_admin.sql` + tes lokal | 127/127 |
| [x] | Tahap 1c | Backup + apply `0004_admin.sql` | Lewat `psql`, 24 Okt |
| [x] | Tahap 1d | Migrasi `0005_admin_privacy.sql` + tes lokal | 129/129 |
| [x] | Tahap 1d | Backup + apply `0005_admin_privacy.sql` | Lewat `psql`, 24 Okt, dengan izin |
| [x] | Tahap 1e | `0006_admin_tokens.sql` (admin kelola access key): tes lokal + apply | 145/145, 24 Okt, dengan izin |
| [x] | Tahap 1e | Tes tab Access keys di Admin Panel | 24 Okt, user |
| [x] | Tahap 0 (sisa) | Email confirm aktif, password minimal 8 | Dicek lewat `/auth/v1/settings`: confirm on, Google off |
| [x] | Tahap 0 (sisa) | Site URL + Redirect URLs | 24 Okt: Site URL production; localhost, production, wildcard preview Vercel |
| [x] | Tahap 0 (sisa) | Env Supabase di `.env.local` | 24 Okt; secret key dicek (admin API 200) |
| [x] | Tahap 2 | Kode auth Supabase (proxy, login/signup, callback, reset password, `/pending`, hapus akun) | tsc/eslint/vitest/build lulus |
| [x] | Tahap 2 | Tes login sungguhan (daftar, verifikasi email, login, reset password) | 24 Okt, user |
| [x] | Tahap 2 | Akun owner dijadikan admin | 24 Okt, dengan izin |
| [x] | Tahap 3 | Repository + Storage, kode Google dihapus (kode) | tsc/eslint/vitest 26/26/build lulus |
| [x] | Tahap 3 | Tes di browser: tambah/edit/hapus lamaran + bukti | 24 Okt, user; DB dicek: tetap 203 lamaran, 99 file, tanpa sisa |
| [x] | Tahap 3b | Admin Panel: sidebar, `/admin` (Users + System), API admin (kode) | RPC dicek di production |
| [x] | Tahap 3b | Tes Admin Panel di browser | User, 24 Okt: berhasil |
| [x] | Tahap 4 | API token + halaman "Connect AI" (kode) | vitest 55, build lulus |
| [x] | Tahap 4 | `hustle-mcp` v2.0.0 (kode) | 15/15 tes |
| [x] | Tahap 4 | Tes end-to-end dengan access key asli | 24 Okt: HTTP 13 kasus + MCP stdio (list, add/attach dry-run, guard duplikat) |
| [x] | Tahap 4/6 | Upstash Redis dibuat + env diisi | 24 Okt via Vercel Storage; tes rate limit lulus |
| [x] | Tahap 4b | Endpoint MCP di aplikasi `/api/mcp` (pilihan user, bukan npm) | 24 Okt, tes e2e lulus |
| [x] | Tes E2E | 2 akun tes lulus | 24 Okt, user |
| [x] | Tes E2E | Akun test-a / test-b dihapus | Dicek: hanya akun owner, tanpa profil/file yatim |
| [x] | Tahap 5 | Dry-run migrasi dicek | 24 Okt, perbaikan teks disetujui |
| [x] | Tahap 5 | 203 lamaran dimigrasi, jumlah cocok dengan Sheet | 203/203, 99 file, status/stage identik |

---

## Prompt siap tempel

Tempel di sesi Claude Code yang dibuka dari folder `D:\AL FITRA\GITHUB\HUSTLE APPS`. Setiap prompt meminta Claude membaca `CLAUDE.md` dan `docs/MULTI_USER_PLAN.md`, jadi tidak perlu menjelaskan ulang.

### Mulai / lanjut kapan saja (prompt umum)

```text
Baca CLAUDE.md dan docs/MULTI_USER_PLAN.md. Ringkas status tiap tahap dari tabel status dan cek git status branch feat/multi-user, lalu lanjutkan tahap yang sedang berjalan. Ikuti aturan keamanan Supabase di CLAUDE.md: perintah baca boleh langsung, setiap perintah tulis ke database tunggu izin saya.
```

### Tahap 1: skema database + RLS + tes lokal

```text
Baca CLAUDE.md dan docs/MULTI_USER_PLAN.md, lalu kerjakan tahap 1.
1. Cek project Supabase secara read-only: list tables, extensions, dan jalankan Security Advisor. Laporkan hasilnya.
2. Buat migrasi di supabase/migrations/ sesuai bagian "1. Database" di rencana: semua tabel dengan user_id + RLS + grant per kolom, schema private, trigger handle_new_user dan set_updated_at, RPC record_practice, tabel api_tokens + private.verify_api_token, bucket storage proofs (private) + policy per folder. Pakai pola Preloved (D:\AL FITRA\GITHUB\Preloved\supabase\migrations) dan hindari kesalahan RLS dari laporan Nunnn.
3. Buat supabase/tests/rls.test.mjs (PGlite, pola Preloved) dengan semua skenario di bagian Verifikasi nomor 1, tambahkan script npm "test:db", lalu jalankan sampai semua lulus.
4. Jangan apply ke Supabase dulu. Tunjukkan ringkasan tabel, policy, dan hasil tes, lalu update tabel status di docs/MULTI_USER_PLAN.md.
```

### Tahap 1b: apply migrasi ke Supabase (setelah tes lokal lulus)

```text
Tes RLS lokal sudah lulus. Sekarang:
1. Backup database dengan supabase db dump ke folder lokal di luar git, dan tunjukkan lokasinya.
2. Tunjukkan daftar migrasi yang akan di-apply, lalu apply satu per satu lewat MCP (saya akan klik izin untuk tiap migrasi).
3. Setelah itu jalankan Security Advisor dan list tables untuk memastikan RLS aktif di semua tabel dan tidak ada peringatan. Update tabel status.
```

### Tahap 0 (sisa): pengaturan dashboard Supabase

```text
Pandu saya langkah demi langkah mengisi pengaturan dashboard Supabase untuk project rzzzqmvafauvdpbzupdv:
1. Authentication: aktifkan Email dengan "Confirm email" menyala dan panjang password minimal 8 (login Google tidak dipakai).
2. URL Configuration: Site URL dan Redirect URLs untuk localhost:3000, https://hustle-apps-six.vercel.app, dan preview Vercel (wildcard).
3. Ambil Project URL, publishable key, dan service role key, lalu isi ke .env.local (tunjukkan nama variabelnya saja, saya yang menempel nilainya; jangan tampilkan atau baca nilainya di chat).
Cek hasilnya secara read-only kalau bisa lewat MCP.
```

### Tahap 2: autentikasi Supabase

```text
Baca CLAUDE.md dan docs/MULTI_USER_PLAN.md, lalu kerjakan tahap 2 (bagian "2. Auth"): src/lib/supabase/{server,client,proxy,admin}.ts pola Preloved, tulis ulang src/proxy.ts, halaman login, signup, auth/callback (code + token_hash), forgot-password, reset-password, signout, nama di sidebar dari profiles, dan fitur hapus akun. Hapus auth HMAC lama dan env OWNER_*/LOGIN_PASSWORD/JWT_SECRET. Baca dulu dokumentasi Next.js 16 di node_modules/next/dist/docs untuk proxy dan route handler. Jalankan tsc, eslint, build, dan unit test safeNextPath. Update tabel status.
```

### Tahap 3: lapisan data ke Supabase + Storage

```text
Kerjakan tahap 3 di docs/MULTI_USER_PLAN.md: withAuth memberi ctx { db, userId, via }, tulis ulang semua repository (jobs, interviews, settings, profile, recommendations) di atas Supabase dengan tanda tangan fungsi tetap sama, lampiran ke bucket proofs dengan signed URL (attachments = {id, name, url}, keepAttachments pakai id), hapus semua kode Google/Gmail beserta dependensinya, update CSP di next.config.ts. Tambahkan unit test vitest untuk mapper repository. Jalankan tsc, eslint, build, dan test. Update tabel status.
```

### Tahap 4: API token per akun + halaman "Connect AI (MCP)" + hustle-mcp v2

```text
Kerjakan tahap 4 di docs/MULTI_USER_PLAN.md:
1. API /api/tokens (session saja), src/lib/server/tokenContext.ts (verify_api_token, scope /api/jobs, semua query eq user_id), rate limit Upstash opsional.
2. Item sidebar "Connect AI (MCP)" + src/features/integrations (daftar token, generate yang ditampilkan sekali dengan tombol salin dan contoh config claude mcp add / JSON, revoke). Ikuti komponen UI yang sudah ada.
3. Update D:\AL FITRA\GITHUB\hustle-mcp ke v2.0.0: auth HUSTLE_API_TOKEN (Bearer), hapus mode password, attach_proof pakai id lampiran, update README, CHANGELOG, dan tes.
Jalankan semua tes. Update tabel status.
```

### Tes end-to-end dengan 2 akun (setelah tahap 1–4)

```text
Bantu saya tes end-to-end di lokal (npm run dev) sesuai bagian Verifikasi nomor 4: daftar 2 akun tes (test-a dan test-b), pastikan data tidak saling terlihat lewat UI dan lewat API langsung, upload/lihat/hapus bukti, generate token dan tes hustle-mcp v2, token di-revoke → 401, token ke /api/settings → 401. Setelah selesai, hapus kedua akun tes (minta izin saya untuk penghapusannya).
```

### Tahap 5: migrasi 203 lamaran lama

```text
Kerjakan tahap 5 di docs/MULTI_USER_PLAN.md: buat scripts/migrate-from-sheets.ts (tsx). Jalankan dulu --dry-run dan tunjukkan jumlah per tabel, distribusi status/stage, jumlah file lampiran, dan 5 contoh hasil mapping. Jangan menulis apa pun ke Supabase sebelum saya setuju. Setelah saya setuju: backup database, jalankan migrasi ke akun saya, lalu verifikasi jumlahnya sama persis dengan Google Sheet. Google Sheet dan Drive tidak boleh diubah.
```

### Tahap 6: preview lalu production

```text
Kerjakan tahap 6 di docs/MULTI_USER_PLAN.md: rangkum semua perubahan di branch feat/multi-user, commit dengan pesan yang rapi, lalu tanya saya sebelum push. Setelah saya setuju: push branch, buat Pull Request, dan bantu cek deploy preview Vercel (env Supabase di Vercel, redirect URL preview). Setelah saya tes dan setuju, merge ke master, update PROGRESS.md dan README, dan pastikan production jalan. Ingatkan saya untuk rotate atau cabut secret Google lama setelah stabil.
```
