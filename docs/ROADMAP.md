# Roadmap Integrasi Lanjutan

## Backend dan akun
1. Provision database Postgres melalui integrasi Vercel Marketplace (Neon direkomendasikan untuk database).
2. Pilih dan provision autentikasi yang sesuai untuk aplikasi statis/Functions; Better Auth memerlukan database dan endpoint server.
3. Tambahkan environment variables ke Vercel Preview terlebih dahulu.
4. Buat skema pengguna, sesi belajar, hasil latihan, dan progres.
5. Migrasikan riwayat lokal secara opsional setelah pengguna masuk.
6. Uji alur daftar akun → masuk → simpan hasil → muat ulang → sinkron lintas perangkat.
7. Promosikan konfigurasi ke Production hanya setelah uji Preview lulus.

## APK Android
1. Konfirmasi application ID/package name yang akan dipakai.
2. Siapkan signing keystore dan simpan rahasianya di tempat aman (jangan commit ke Git).
3. Pastikan domain produksi dan `/.well-known/assetlinks.json` terverifikasi.
4. Build Trusted Web Activity (TWA) dari PWA yang sudah stabil.
5. Uji APK pada perangkat Android sebelum distribusi.

## Rilis
- Pertahankan branch `main` dan deployment produksi hingga backend, browser QA, dan APK lulus.
- Buat pull request dari branch integrasi setelah seluruh prasyarat eksternal selesai.
