# Sukses SNBT — Learning Center

Platform belajar mandiri UTBK-SNBT berbasis HTML, CSS, dan JavaScript statis, dengan Progressive Web App (PWA).

## Fitur dan halaman
- Beranda: ringkasan platform dan navigasi.
- Materi: katalog tujuh subtes dan rangkaian pertemuan pembelajaran.
- Latihan: 105 soal latihan orisinal, masing-masing 15 soal untuk PU, PPU, PBM, PK, Penalaran Matematika, Literasi Bahasa Indonesia, dan Literasi Bahasa Inggris.
- Paket latihan: dua paket per subtes: paket dasar dan paket pendalaman menengah–sulit, dilengkapi umpan balik dan pembahasan.
- Tryout: simulasi komprehensif 70 soal dengan timer 105 menit. Ini latihan buatan platform, bukan ujian resmi atau prediksi nilai resmi SNBT.
- Progres: riwayat hasil lokal dan sinkronisasi ke akun.
- Akun: registrasi email/password, login Google, logout, dan pemulihan kata sandi Supabase.

## Jalankan lokal
Jalankan server statis dari root repositori:

```bash
python3 -m http.server 8080
```

Buka `http://localhost:8080`. Service worker dan instalasi PWA memerlukan HTTPS pada deployment; localhost juga dianggap secure context oleh browser.

## Penyimpanan progres
Riwayat tamu disimpan pada `localStorage` dengan kunci `snbt-progress-history`. Setelah login, progres disinkronkan ke tabel `progress_entries` pada Supabase. Row Level Security membatasi akses ke data milik akun sendiri. Saat pengguna keluar, data akun lokal dibersihkan dari browser bersama untuk mencegah pengguna berikutnya melihat riwayat akun sebelumnya.

## Supabase
- Project ref: `yogtbxautvovqazmthwn`.
- Migrasi `snbt_user_progress` telah diterapkan; tabel `profiles` dan `progress_entries` menggunakan RLS.
- Build Vercel menyediakan `js/supabase-config.js` dari `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Hanya URL dan publishable key yang masuk ke browser. Jangan pernah mengekspos secret/service-role key atau kredensial database ke browser atau Git.

## OAuth dan pengujian akun
Kode login Google sudah tersedia pada Preview, tetapi integrasi OAuth belum dapat dinyatakan berhasil sebelum Google OAuth Client ID dan Client Secret dikonfigurasi pada Google Cloud dan Supabase, lalu alur login benar-benar diuji. Registrasi email, konfirmasi email, reset password, isolasi data antarakun, dan sinkronisasi lintas perangkat juga masih perlu diuji pada tahap QA akhir.

Preview Vercel tetap dilindungi SSO. Jangan menonaktifkan perlindungan hanya untuk mempermudah pengujian. Jangan merge ke `main` atau mempromosikan deployment sebelum QA dan persetujuan rilis.

## PWA dan Android
PWA sudah memiliki manifest, service worker, ikon, cache offline, dan tombol instalasi yang muncul saat browser mendukung prompt instalasi. Di Android, pengguna dapat memasang website dari menu Chrome. Folder `android/` berisi panduan dan template konfigurasi Trusted Web Activity (TWA). APK TWA masih memerlukan konfirmasi application ID, signing keystore, Digital Asset Links, build, dan uji perangkat; belum ada APK bertanda tangan di repositori.

## Verifikasi
Jalankan pemeriksaan lokal dari root repositori:

```bash
python3 scripts/verify_site.py
find js data -type f -name '*.js' -print0 | xargs -0 -n1 node --check
node scripts/verify_content.js
```

Workflow GitHub Actions menjalankan pemeriksaan tautan internal, manifest, aset precache, sintaks JavaScript, konsistensi bank soal, serta smoke test interaksi tryout dan paket lintas subtes pada push/PR. QA browser dan backend menyeluruh dilakukan setelah pekerjaan pengembangan selesai.

## Branch dan rilis
- `main` adalah sumber website produksi.
- `integrasi-snbt-learning-center-2026-11` adalah branch pengembangan.
- Semua perubahan saat ini berada di branch integrasi.
- Jangan merge ke `main`, mempromosikan deployment, atau mengubah produksi tanpa persetujuan pemilik proyek.
