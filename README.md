# Sukses SNBT — Learning Center

Platform belajar mandiri UTBK-SNBT berbasis HTML, CSS, dan JavaScript statis, dengan Progressive Web App (PWA).

## Halaman
- `index.html` — beranda dan navigasi 7 subtes.
- `materi.html` dan `materi/` — katalog serta materi pembelajaran.
- `latihan.html` — katalog latihan; saat ini paket aktif tersedia untuk Penalaran Umum.
- `paket-latihan.html` — daftar paket latihan.
- `latihan-paket.html?paket=pu-dasar-1` — pengerjaan paket.
- `latihan-demo.html` — demo latihan interaktif.
- `tryout.html` — simulasi tryout PU lima menit (simulasi platform, bukan ujian resmi).
- `progres.html` — riwayat hasil latihan lokal dan sinkronisasi akun.
- `akun.html` — registrasi, login, logout, dan pemulihan kata sandi Supabase.

## Jalankan lokal
Jalankan server statis dari root repositori:

```bash
python3 -m http.server 8080
```

Buka `http://localhost:8080`. Service worker dan fitur instalasi PWA memerlukan HTTPS pada deployment; localhost juga dianggap secure context oleh browser.

## Penyimpanan progres
Riwayat tamu disimpan pada `localStorage` dengan kunci `snbt-progress-history`. Setelah login, progres disinkronkan ke tabel `progress_entries` pada Supabase. Row Level Security membatasi akses ke data milik akun sendiri.

## Supabase setup
1. Jalankan SQL pada `supabase/migrations/202611140001_snbt_user_progress.sql` di Supabase SQL Editor.
2. Atur Site URL dan Redirect URLs Supabase Auth ke domain SuksesSNBT dan URL preview yang dipakai untuk pengujian.
3. Deploy branch integrasi agar build menghasilkan `js/supabase-config.js` dari `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Jangan pernah mengekspos `SUPABASE_SECRET_KEY` atau `SUPABASE_SERVICE_ROLE_KEY` ke browser.

## Verifikasi
Jalankan pemeriksaan tautan, manifest, dan aset precache:

```bash
python3 scripts/verify_site.py
find js -type f -name '*.js' -print0 | xargs -0 -n1 node --check
```

Workflow GitHub Actions disiapkan untuk menjalankan pemeriksaan yang sama pada push ke branch integrasi dan pull request ke `main`.

## Deployment
- `main` adalah sumber website produksi.
- `integrasi-snbt-learning-center-2026-11` adalah branch pengembangan.
- Jangan merge ke `main` sebelum pengujian browser, backend, dan persetujuan rilis selesai.

## Batasan yang belum diselesaikan
- Belum ada akun pengguna atau database cloud; progres saat ini hanya lokal.
- Belum ada APK/TWA yang ditandatangani. Instalasi PWA melalui Chrome adalah opsi Android yang tersedia setelah deployment dirilis.
- Konten latihan aktif yang disediakan saat ini adalah lima soal Penalaran Umum. Jangan mengiklankan jumlah soal lebih besar sebelum bank soal benar-benar ditambahkan dan diperiksa.
