# Roadmap Integrasi Lanjutan

## Backend dan akun — menunggu provisioning Supabase
Supabase dipilih sebagai backend karena satu integrasi menyediakan PostgreSQL, Auth, Storage, dan Realtime untuk aplikasi statis ini. Provisioning harus dilakukan melalui Vercel Marketplace oleh pemilik akun; jangan membuat kode backend atau mengganti provider sebelum resource nyata tersedia.

1. Pemilik akun memasang [Supabase di Vercel Marketplace](https://vercel.com/marketplace/supabase) dan memilih paket Free ($0); jangan memilih paket berbayar atau add-on berbayar.
2. Hubungkan resource Supabase ke proyek Vercel `suksessnbt`; pastikan environment variables tersinkron ke Preview.
3. Verifikasi hanya nama environment variable di Vercel; jangan menyalin secret ke GitHub atau percakapan.
4. Setelah provisioning terkonfirmasi, implementasikan client Supabase untuk aplikasi HTML/JS statis menggunakan publishable key. Secret/service-role key hanya boleh digunakan di server dan tidak pernah dikirim ke browser.
5. Buat skema profil pengguna, hasil latihan, riwayat tryout, dan progres; aktifkan Row Level Security (RLS) serta policy yang membatasi setiap pengguna ke datanya sendiri.
6. Implementasikan registrasi, login, logout, pemulihan akun, dan sinkronisasi progres; pertahankan mode lokal bila pengguna belum login.
7. Uji alur daftar akun → verifikasi email → masuk → simpan hasil → muat ulang → sinkron lintas perangkat → keluar.
8. Gunakan Preview untuk seluruh pengujian. Jangan menghubungkan resource ke Production atau mempromosikan deployment sebelum uji keamanan dan persetujuan rilis.

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
