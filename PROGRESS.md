# Progress — Hustle (Job Search Tracker)

_Terakhir diperbarui: 14 Oktober 2026_

Legenda: ✅ selesai · 🟡 menunggu merge / sedang dikerjakan · ⬜ belum · ↩️ dibuat lalu dicabut atas permintaan

## Status saat ini

| | |
|---|---|
| **Production** | https://hustle-apps-six.vercel.app — commit `284a922` (merge PR #3), 14 Okt 2026 |
| **Rilis berikutnya** | PR #4 (Insights) → PR #5 (Interview prep P1–P3) → PR #6 (Interview prep P4–P5 + kartu Companies) — di-merge berurutan 14 Okt 2026 |
| **Tooling** | GitHub CLI (`gh`) dan Vercel CLI terpasang & login; folder lokal ter-link ke project Vercel `hustle-apps` |

## Checklist tindakan

- [x] Merge PR #1, #2, #3 (live di production)
- [x] Pulihkan `LastUpdated` 90 lamaran yang tereset oleh perbaikan stage (backup dulu, lalu restore; Needs follow-up kembali 106)
- [x] Merge PR #4, #5, #6 berurutan → production
- [ ] Buka Interview prep → **Add starter questions**, lalu tulis jawaban STAR untuk pertanyaan Behavioral dan isi catatan tes
- [ ] **Rotasi `GOOGLE_CLIENT_SECRET` & `GOOGLE_REFRESH_TOKEN`** — pernah tercetak di log Vercel oleh kode lama. Reset di Google Cloud Console, lalu masukkan nilai baru ke Vercel + `.env.local` _(harus dilakukan pemilik akun)_
- [ ] Jalankan pembersihan data dari UI: banner stage di Applications + "Close as no response" di Dashboard (183 lamaran terbuka, mayoritas > 60 hari tanpa kabar)
- [ ] Lengkapi Platform / Level / Lokasi di lamaran lama (baru 21–24 dari 201 terisi) agar kartu Application profile bermakna
- [ ] Tentukan item backlog berikutnya (Interview prep P1–P8, Dashboard D4–D6, Applications A4–A8, Insights I5–I6)

---

## Riwayat rilis

| Rilis | Isi utama | Status |
|---|---|---|
| PR #1 · `2ac6f86` | Keamanan: semua API wajib login, env divalidasi, sesi HMAC, rate limit login, CSRF, Sheets `RAW`, Drive dibatasi, header keamanan | ✅ live 13 Okt |
| PR #1 · `836a952` | Struktur kode per fitur, komponen UI bersama, desain putih + garis aksen, copy English | ✅ live 13 Okt |
| PR #1 · `b731348` | Kanban, follow-up reminder, export CSV, target mingguan + streak | ✅ live 13 Okt |
| PR #1 · `a1cef80` → `06877dd` | Splash, progress bar atas, kolom Links, layout fluid, tanggal kontrak, tanggal tiap tahapan, popup detail berbasis card, densitas 80% | ✅ live 13 Okt |
| PR #2 · `e31ff5e`, `25d2e19` | Kartu statistik → daftar perusahaan; filter Group; deep link `/tracker?segment=` | ✅ live 14 Okt |
| PR #3 · `a5300b7`, `13108d4` | Status No Response, perbaikan stage massal, bulk delete, quick filter chips, form per card, tanpa scroll horizontal | ✅ live 14 Okt |
| PR #4 | Insights I1–I4 + drill-down semua kartu + konfirmasi sign out | ✅ |
| PR #5 | Interview prep: perbaikan skor Answer check, starter pack 20 pertanyaan, kategori Assessment / Test + kolom Notes, popup lebih lebar | ✅ |
| PR #6 | Interview prep: kartu "In your pipeline", tombol Interview prep di detail lamaran, mode latihan + timer 2 menit; Insights: kartu Companies menggantikan Top positions, timeline lebih jelas | ✅ |

### Detail PR #4 — Insights
| Item | Perubahan | Status |
|---|---|---|
| I1 | **Pipeline conversion**: berapa lamaran mencapai tiap tahap (atau lebih jauh) + % lolos per tahap + sorotan "Biggest drop" (Screening → Test: 115 → 8) | ✅ |
| I2 | **Where you get rejected**: penolakan per tahap relatif terhadap yang mencapai tahap itu (Test: 4 dari 8 = 50%) + jumlah No response | ✅ |
| I3 | **Application profile**: Level / Platform / City / Province dalam satu kartu bertab, dengan cakupan data ("Filled in for 21 of 201") | ✅ |
| I4 | **Conversion by position**: posisi ≥ 3 lamaran → jumlah, interviewed (%), rejected; nama posisi tidak lagi terpotong | ✅ |
| — | **Key takeaways** (dulu "Recommendations") pindah ke atas; saran baru dari biggest drop & titik penolakan terbesar | ✅ |
| — | Urutan: stat cards → Key takeaways → Status / Conversion by position / Application profile → Funnel + Rejections → Companies + Timeline | ✅ |
| — | **Semua kartu bisa diklik** → daftar perusahaan (Status, posisi, profil, funnel, penolakan, top positions, bulan di timeline, No response); latar hover mengikuti warna bar | ✅ |
| — | "Open in Applications" membawa filter yang sama (status, stage, posisi, level, provinsi, rentang tanggal, timeframe) — jumlahnya identik dengan dialog | ✅ |
| — | Top positions **dihapus** (angkanya sama dengan Conversion by position); Conversion by position punya "View all" untuk semua posisi | ✅ PR #6 |
| — | **Companies**: perusahaan diurutkan dari tahap terjauh yang dicapai (badge stage + status), "View all" dengan pencarian, klik → daftar lamaran | ✅ PR #6 |
| — | Timeline: garis lurus antarbulan, dot di tiap bulan, angka di titik, Applications putus-putus vs Interviews solid, label bulan tidak berdempetan | ✅ PR #6 |
| — | Sign out meminta konfirmasi dulu | ✅ |

---

## Snapshot data (14 Okt 2026)

| Metrik | Nilai |
|---|---|
| Total lamaran | 201 |
| Status | Not Started 77 · In Progress 106 · Failed 17 · Success 1 |
| Funnel | 201 → 115 Screening → 8 Test → 4 HR Interview → 3 User Interview → 2 FGD → 2 Offer → 1 Signed |
| Penolakan per tahap | Applied 9 · Screening 2 · Test 4 (50%) · User Interview 1 · Offer 1 |
| Posisi terbanyak | Data Analyst 31 lamaran → 1 interview (3.2%) |
| Platform / level / lokasi terisi | 21–24 dari 201 |
| Lamaran baru 30 hari terakhir | 0 (terakhir 4 Agu 2026) |
| Pertanyaan di Interview prep | 0 |

---

## Backlog

### Dashboard
| # | Rekomendasi | Alasan | Prioritas | Status |
|---|---|---|---|---|
| D1 | Status "No response" + tutup massal dari kartu Follow-up | Active 183 tidak realistis | Tinggi | ✅ PR #3 |
| D2 | Perbaikan massal stage Not Started + In Progress → Document Screening | 90 data tidak konsisten | Tinggi | ✅ PR #3 |
| D3 | Persentase < 10% tampil 1 desimal | "1 offer" tapi tertulis 0% | Tinggi | ✅ PR #3 |
| D4 | Kartu Upcoming diringkas saat kosong; ruangnya untuk **Recent activity** | Kartu kosong memakan ⅔ lebar | Sedang | ⬜ |
| D5 | Tren mingguan di kartu ("+6 vs minggu lalu") | Melihat momentum | Rendah | ⬜ |
| D6 | **Response rate** (lamaran yang dapat respons apa pun) | Metrik paling relevan bagi pencari kerja | Rendah | ⬜ |

### Applications
| # | Rekomendasi | Alasan | Prioritas | Status |
|---|---|---|---|---|
| A1 | Aksi massal (pilih baris → Delete) | Membersihkan data satu per satu tidak realistis | Tinggi | ✅ PR #3 (Delete saja) |
| A2 | Ubah status/stage langsung di tabel | Edit paling sering | Tinggi | ↩️ edit hanya lewat tombol Edit |
| A3 | Quick filter chips dengan jumlah | Filter penting tersembunyi | Tinggi | ✅ PR #3 |
| A4 | Kolom **Last update** yang bisa di-sort; Location/Platform bisa disembunyikan | 88% kolom lokasi/platform kosong | Sedang | ⬜ |
| A5 | Simpan filter, sort & tampilan di URL | Hilang setelah refresh | Sedang | ⬜ |
| A6 | Deteksi duplikat (perusahaan + posisi sama) | Ada 2 pasang duplikat | Sedang | ⬜ |
| A7 | Board: toggle "Hide closed" + "Show more" per kolom | Kolom Not Started berisi 77+ kartu | Sedang | ⬜ |
| A8 | Pilihan jumlah baris per halaman (20 / 50 / 100) | Review besar-besaran | Rendah | ⬜ |

### Insights
| # | Rekomendasi | Alasan | Prioritas | Status |
|---|---|---|---|---|
| I1 | Funnel konversi + % lolos per tahap | Titik bocor Screening → Test tidak terlihat | Tinggi | ✅ PR #4 |
| I2 | Di tahap mana ditolak (+ No response) | Test: 4 dari 8 ditolak | Tinggi | ✅ PR #4 |
| I3 | Profil bertab + cakupan data | 88–90% kosong, kartu lama menyesatkan | Tinggi | ✅ PR #4 |
| I4 | Konversi per posisi | Data Analyst: 31 lamaran → 1 interview | Sedang | ✅ PR #4 |
| I5 | Tren per minggu (12 minggu) | Ritme melamar | Rendah | ⬜ |
| I6 | Waktu respons (hari dari melamar ke tahap berikutnya) | Tanggal tahapan baru mulai tercatat | Rendah | ⬜ |

### Interview prep
Kondisi 14 Okt 2026: bank pertanyaan **kosong (0)**, padahal 8 lamaran sudah sampai Test dan 4 sampai interview; titik penolakan terbesar ada di **Assessment Test (50%)**.

| # | Rekomendasi | Alasan | Prioritas | Status |
|---|---|---|---|---|
| P1 | ~~Bug Answer check~~ **diperbaiki**: kalau draft STAR sudah tersimpan, jawaban yang diketik selalu dianggap mencakup S/T/A/R → skor terlalu tinggi. Nilai hanya teks yang diketik (draft dipakai hanya bila kolom jawaban kosong) | Skor menyesatkan | Tinggi | ✅ PR #5 |
| P2 | **Starter pack**: tambah 10–15 pertanyaan umum sekali klik (HR, behavioral, Data Analyst: SQL/Excel/studi kasus) | Bank kosong; memulai dari nol berat | Tinggi | ✅ PR #5 (20 pertanyaan: HR, Salary, Behavioral, Leadership, Technical, Assessment) |
| P3 | Kategori **Assessment / Test** (SQL, Excel, logika, psikotes) + catatan materi | Penolakan terbanyak di tahap Test | Tinggi | ✅ PR #5 (kolom Notes = K; kategori tes tanpa STAR & tanpa Answer check) |
| P4 | Hubungkan pertanyaan ke **lamaran**: kartu "In your pipeline" (lamaran aktif di tahap Test/Interview + jumlah pertanyaan per perusahaan), tombol **Interview prep** di detail lamaran (`/interviews?company=`), saran nama perusahaan di form, filter per perusahaan | Persiapan per perusahaan langsung dari tracker | Sedang | ✅ PR #6 |
| P5 | **Mode latihan**: urutan otomatis (belum mastered & paling lama tidak dilatih dulu), timer 2 menit, buka draft STAR/catatan setelahnya; tercatat terakhir dilatih & jumlah latihan (kolom L–M); stat "Practised this week" | Status Mastered saja tidak menunjukkan kapan terakhir berlatih | Sedang | ✅ PR #6 |
| P6 | Simpan **skor Answer check terakhir** per pertanyaan + tren | Melihat kemajuan | Rendah | ⬜ |
| P7 | Stat card bisa diklik → filter daftar (konsisten dengan halaman lain); quick filter chips | Konsistensi | Rendah | ⬜ |
| P8 | Kartu STAR 4 kolom terlalu sempit di grid 2 kolom layar lebar → 2×2 | Teks panjang sulit dibaca | Rendah | ✅ PR #5 (+ popup pertanyaan & Answer check diperlebar) |

---

## Catatan teknis

- **Kolom Sheet `DataLowongan` (A–U):** `LastUpdated` (S), `ContractDate` (T), `StageDates` (U, JSON). Tab `Interviews` (A–M: `Notes` K, `LastPracticed` L, `PracticeCount` M — header ditambahkan otomatis) dan `Settings` dibuat otomatis.
- **Env wajib:** `OWNER_EMAIL`, `LOGIN_PASSWORD` (≥ 8), `JWT_SECRET` (≥ 32), `GOOGLE_SHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, dan kredensial Google (OAuth atau service account). Lihat `.env.example`.
- **Deploy:** merge ke `master` → Vercel deploy production otomatis. Perubahan env di Vercel butuh redeploy (`vercel redeploy https://hustle-apps-six.vercel.app --target production`).
- **Deep link Interview prep:** `/interviews?company=Nama` (filter per perusahaan).
- **Deep link Applications:** `/tracker?segment=&status=&stage=&position=&careerLevel=&province=&search=&from=&to=&followUp=yes` (divalidasi di server).
- **Drill-down:** setiap angka/baris membangun `JobSelection` (`src/features/jobs/selection.ts`) — filter dialog dan filter deep link berasal dari satu tempat.
- **Verifikasi:** `npx tsc --noEmit`, `npx eslint src`, `npm run build`; uji UI dengan Puppeteer di 1280px @150% (layar pemilik), 1600px @120%, dan 390px ponsel — 0 overflow horizontal.
- **Dev lokal:** setelah mengubah `@theme` di `globals.css` atau `.env.local`, restart `npm run dev`.
