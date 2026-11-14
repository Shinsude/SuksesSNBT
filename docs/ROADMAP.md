# Roadmap Integrasi Lanjutan

## Backend dan akun — integrasi terpasang, implementasi berjalan
Supabase dipilih sebagai backend karena satu integrasi menyediakan PostgreSQL, Auth, Storage, dan Realtime untuk aplikasi statis ini. Provisioning harus dilakukan melalui Vercel Marketplace oleh pemilik akun; jangan membuat kode backend atau mengganti provider sebelum resource nyata tersedia.

1. Supabase Free sudah terpasang dan terhubung ke proyek `suksessnbt` pada Development, Preview, dan Production; region `sin1`.
2. Vercel menyediakan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pada ketiga environment. Build statis menghasilkan file konfigurasi publik; secret/service-role tidak dikirim ke browser.
3. Migrasi SQL tersedia di `supabase/migrations/202611140001_snbt_user_progress.sql`; pemilik proyek perlu menjalankannya di Supabase SQL Editor karena koneksi integrasi yang tersedia hanya mengizinkan pembacaan resource, bukan eksekusi SQL.
4. Halaman akun, autentikasi email/password, pemulihan kata sandi, dan sinkronisasi riwayat lokal ke cloud diimplementasikan pada branch integrasi.
5. Atur Supabase Auth Site URL dan Redirect URLs sebelum pengujian email.
6. Uji daftar akun → verifikasi email → login → simpan hasil → muat ulang → sinkron lintas perangkat → logout, lalu uji isolasi RLS.
7. Gunakan Preview untuk seluruh pengujian. Jangan mempromosikan deployment sebelum uji keamanan dan persetujuan rilis.

**Catatan paket Free:** $0/bulan, termasuk database 500 MB dan 50.000 MAU; proyek yang tidak aktif selama sekitar satu minggu dapat dijeda. Periksa batas terbaru sebelum rilis publik.

## APK Android
1. Konfirmasi application ID/package name yang akan dipakai.
2. Siapkan signing keystore dan simpan rahasianya di tempat aman (jangan commit ke Git).
3. Pastikan domain produksi dan `/.well-known/assetlinks.json` terverifikasi.
4. Build Trusted Web Activity (TWA) dari PWA yang sudah stabil.
5. Uji APK pada perangkat Android sebelum distribusi.

## Rilis
- Pertahankan branch `main` dan deployment produksi hingga backend, browser QA, dan APK lulus.
- Buat pull request dari branch integrasi setelah seluruh prasyarat eksternal selesai.
