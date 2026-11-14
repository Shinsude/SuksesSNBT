# Roadmap Integrasi Lanjutan

## Backend dan akun — database terpasang, pengujian aplikasi berjalan

1. Supabase Free terpasang melalui Vercel Marketplace dan terhubung ke proyek `suksessnbt` pada Development, Preview, dan Production; region Vercel `sin1`.
2. Proyek Supabase yang benar telah dicocokkan: `supabase-aero-candle`, project ref `yogtbxautvovqazmthwn`, organisasi Supabase `AI`.
3. Vercel menyediakan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pada ketiga environment. Build statis hanya memasukkan URL dan publishable key ke browser; secret/service-role dan kredensial database tidak dimasukkan ke bundle klien.
4. Migrasi `snbt_user_progress` sudah diterapkan langsung ke database. Tabel `profiles` dan `progress_entries` terverifikasi ada, RLS aktif, tujuh kebijakan kepemilikan tersedia, dan trigger profil otomatis terpasang.
5. Halaman akun, autentikasi email/password, pemulihan kata sandi, dan sinkronisasi riwayat lokal ke cloud sudah diimplementasikan pada branch integrasi.
6. Pengaturan Supabase Auth Site URL dan Redirect URLs perlu diperiksa untuk domain produksi dan URL Preview yang dipakai saat uji email.
7. Lakukan uji browser: daftar akun → verifikasi email → login → selesaikan latihan/tryout → muat ulang → sinkronisasi → login pada browser/perangkat lain → logout. Uji bahwa akun kedua tidak dapat membaca atau mengubah progres akun pertama.
8. Preview Vercel saat ini READY tetapi dilindungi SSO. Pertahankan perlindungan ini; jangan mengubahnya hanya untuk mempermudah pengujian. Gunakan akses pemilik proyek atau mekanisme preview protection yang sah.
9. Jangan merge ke `main` atau mempromosikan deployment sebelum pengujian browser, backend, dan persetujuan rilis selesai.

**Catatan paket Free:** proyek dapat dijeda setelah periode tidak aktif; pantau status proyek dan kuota dari Supabase Dashboard.

## APK Android
1. Konfirmasi application ID/package name yang akan dipakai.
2. Siapkan signing keystore dan simpan rahasianya di tempat aman (jangan commit ke Git).
3. Pastikan domain produksi dan `/.well-known/assetlinks.json` terverifikasi.
4. Build Trusted Web Activity (TWA) dari PWA yang sudah stabil.
5. Uji APK pada perangkat Android sebelum distribusi.

## Rilis
- Pertahankan branch `main` dan deployment produksi hingga backend, browser QA, dan APK lulus.
- Buat pull request dari branch integrasi setelah seluruh prasyarat eksternal selesai.
