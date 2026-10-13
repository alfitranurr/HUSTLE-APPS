# Progress — Hustle (Job Search Tracker)

_Terakhir diperbarui: 14 Oktober 2026_

## Status saat ini

| | |
|---|---|
| **Production** | https://hustle-apps-six.vercel.app — commit `21e5062` (merge PR #1), redeploy 13 Okt 2026 setelah ganti `LOGIN_PASSWORD` |
| **Menunggu merge** | [PR #2](https://github.com/alfitranurr/HUSTLE-APPS/pull/2) — drill-down kartu statistik + perapian filter |
| **Tooling** | GitHub CLI (`gh`) dan Vercel CLI terpasang & login; folder lokal ter-link ke project Vercel `hustle-apps` |

---

## Sudah selesai

### 1. Keamanan — `2ac6f86` (PR #1)
- Semua API (`/api/jobs`, `/api/interviews`, `/api/settings`) wajib login; sebelumnya terbuka untuk publik.
- Fallback secret (`alfitra123`, JWT fallback) dihapus; env divalidasi zod saat start, aplikasi menolak jalan kalau env kurang/lemah.
- Sesi HMAC dengan verifikasi constant-time, cookie `HttpOnly` + `Secure` + `SameSite=Lax`, logout POST-only.
- Login dibatasi 5 percobaan / 15 menit; pesan error generik.
- Request lintas-origin ke API ditolak (CSRF).
- Tulis ke Sheet pakai `RAW` (anti formula injection, mis. `=IMPORTXML`).
- Drive: hanya file di folder upload yang bisa dihapus; upload dibatasi 5 file × 4 MB, cek tipe dari isi file (PDF/PNG/JPG/WebP); file tidak lagi dibagikan publik.
- Secret OAuth tidak lagi tercetak di log; error ke klien generik.
- Header keamanan: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.
- File lama dihapus: `backend.gs`, `frontend.html`, `scratch/`, stub UMR.

### 2. Struktur kode & desain — `836a952`
- Kode dipecah per fitur (`src/features/*`) + komponen UI bersama (`src/components/ui/*`); file 600–960 baris jadi modul kecil.
- Lapisan server: `lib/server/google/*` + repository yang memetakan baris Sheet ke tipe `Job` / `InterviewQuestion`.
- Satu sumber konstanta & warna (`lib/constants.ts`, `lib/tones.ts`).
- Desain putih dengan garis aksen warna (status/stage), copy berbahasa Inggris, modal aksesibel.
- Bug diperbaiki: statistik Interviews selalu 0, toggle timeframe Insights, rentang heatmap, sorting antar halaman.

### 3. Fitur — `b731348`
- Board Kanban drag-and-drop per stage.
- Pengingat follow-up (In Progress tanpa update ≥ 14 hari) + tombol "Followed up".
- Export CSV dari tampilan yang difilter.
- Target mingguan (tab `Settings` di Sheet) + streak.

### 4. Penyempurnaan UI — `a1cef80`, `18ee12e`, `550b813`, `06877dd`
- Gradien pelangi diganti indigo solid; splash screen; progress bar atas saat navigasi/aksi.
- Kolom Links terpisah di tabel; layout fluid untuk layar lebar (breakpoint `3xl`/`4xl`).
- Tanggal kontrak (kolom `ContractDate`) untuk Offering Letter / Contract Signed.
- Modal edit/detail lebih lebar; Cards view auto-fill.
- **Tanggal setiap tahapan** (kolom `StageDates`): otomatis terisi saat stage berubah (WIB), bisa diedit/backfill.
- Popup detail berbasis card (Progress, Notes, Links, Attachments, Details).
- Angka di chart Top positions.
- Densitas default 80% di desktop dengan scaling OS 125–175%.
- Retry otomatis untuk gangguan jaringan ke Google (hanya request idempoten).

### 5. Drill-down statistik — PR #2 (`e31ff5e`, `25d2e19`) — _belum di-merge_
- Kartu statistik di Dashboard & Insights bisa diklik → daftar perusahaan (cari, klik untuk detail).
- Filter **Group** baru (Active / Reached an interview / Offers / Rejected) + deep link `/tracker?segment=...`.
- Urutan filter dirapikan; keterangan timeframe di kartu Applications Insights.

### Deploy & konfigurasi (13 Okt 2026)
- PR #1 di-merge, production ter-deploy dan diverifikasi (login, API, header keamanan).
- Env Vercel: `OWNER_EMAIL`, `OWNER_NAME` ditambahkan; `JWT_SECRET` dan `LOGIN_PASSWORD` diganti (Production + Preview).

---

## Belum selesai / perlu tindakan

- [ ] **Merge PR #2** ke `master` (deploy otomatis ke production).
- [ ] **Rotasi `GOOGLE_CLIENT_SECRET` & `GOOGLE_REFRESH_TOKEN`** — pernah tercetak di log Vercel oleh kode lama. Reset di Google Cloud Console, lalu masukkan nilai baru ke Vercel + `.env.local`.

---

## Snapshot data (14 Okt 2026)

| Metrik | Nilai |
|---|---|
| Total lamaran | 201 |
| Status | Not Started 77 · In Progress 106 · Success 1 · Failed 17 |
| In Progress tapi stage masih "Not Started" | 90 |
| In Progress tanpa update ≥ 60 hari | 93 |
| Duplikat (perusahaan + posisi sama) | 2 pasang (ACC; PT Toyota Astra Financial Services) |
| Platform kosong | 177 (88%) |
| Lokasi kosong | 177 (88%) |
| Career level tidak diisi | 180 (90%) |
| Punya tanggal per tahapan | 2 |
| Lamaran baru 30 hari terakhir | 0 (terakhir 4 Agu 2026) |

---

## Backlog rekomendasi

### Dashboard
| # | Rekomendasi | Alasan | Prioritas |
|---|---|---|---|
| D1 | Kategori **"No response"** (In Progress > 60 hari tanpa kabar) + tutup massal dari kartu Follow-up | Active 183 tidak realistis; 93 lamaran basi | Tinggi |
| D2 | Perbaikan massal stage "Not Started + In Progress → Document Screening" (dengan konfirmasi); default stage lamaran baru | 90 data tidak konsisten; funnel tidak akurat | Tinggi |
| D3 | Persentase < 10% tampil 1 desimal | "1 offer" tapi tertulis "0% success rate" | Tinggi |
| D4 | Kartu Upcoming diringkas saat kosong; ganti ruangnya dengan **Recent activity** (perubahan stage terbaru) | Kartu kosong memakan ⅔ lebar | Sedang |
| D5 | Tren mingguan di kartu (mis. "+6 vs minggu lalu") | Melihat momentum | Rendah |
| D6 | **Response rate** (lamaran yang dapat respons apa pun) | Metrik paling relevan bagi pencari kerja | Rendah |

### Halaman Applications
| # | Rekomendasi | Alasan | Prioritas |
|---|---|---|---|
| A1 | **Aksi massal**: pilih banyak baris → ubah status/stage, "Close as no response", hapus | Membersihkan 90 + 93 data satu per satu tidak realistis | Tinggi |
| A2 | **Ubah status/stage langsung di tabel** (dropdown inline) tanpa buka form | Edit paling sering = ganti stage/status | Tinggi |
| A3 | **Quick filter chips** di atas tabel: Needs follow-up · Interviewing · Offers · Rejected · No response | Filter penting sekarang tersembunyi di panel Filters | Tinggi |
| A4 | Kolom **"Last update"** (hari sejak update) yang bisa di-sort; Location/Platform bisa disembunyikan | 88% baris kosong di kolom Location & Platform; staleness lebih berguna | Sedang |
| A5 | **Simpan filter, sort & tampilan** di URL (+ ingat tampilan terakhir) | Saat ini hilang setelah refresh / pindah halaman | Sedang |
| A6 | **Deteksi duplikat** saat menambah lamaran (perusahaan + posisi sama) + tanda di tabel | Sudah ada 2 pasang duplikat | Sedang |
| A7 | Board: toggle **"Hide closed"** (Success/Failed) + batasi kartu per kolom ("Show more") | Kolom Not Started berisi 176 kartu | Sedang |
| A8 | Pilihan jumlah baris per halaman (20 / 50 / 100) | Nyaman saat review besar-besaran | Rendah |

---

## Catatan teknis

- **Kolom Sheet `DataLowongan` (A–U):** kolom baru `LastUpdated` (S), `ContractDate` (T), `StageDates` (U, JSON). Tab `Interviews` dan `Settings` dibuat otomatis.
- **Env wajib:** `OWNER_EMAIL`, `LOGIN_PASSWORD` (≥ 8), `JWT_SECRET` (≥ 32), `GOOGLE_SHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, dan kredensial Google (OAuth atau service account). Lihat `.env.example`.
- **Deploy:** merge ke `master` → Vercel deploy production otomatis. Perubahan env di Vercel butuh redeploy (`vercel redeploy https://hustle-apps-six.vercel.app --target production`).
- **Verifikasi yang dipakai:** `npm run typecheck`, `npm run lint`, `npm run build`; uji E2E lewat UI (Puppeteer) terhadap Sheet asli memakai data uji "ZZ TEST" yang dihapus otomatis (33/33 lolos pada 13 Okt 2026).
- **Dev lokal:** setelah mengubah `@theme` di `globals.css` atau `.env.local`, restart `npm run dev`.
