# Fase 5 — Catatan Audit dan QA

Tanggal pemeriksaan: 16 November 2026  
Branch: `integrasi-snbt-learning-center-2026-11`  
Commit audit terbaru: `b62ce79b56b782b7ebadb10595479874579b1d1a`

## Ringkasan status

Pemeriksaan otomatis atas struktur situs, tautan internal, PWA, konfigurasi Android TWA, sintaks JavaScript, bank soal, interaksi tryout/paket, dan skenario dasar sinkronisasi progres telah lulus pada CI terbaru. Deployment preview terbaru berstatus `READY`.

Fase 5 belum dapat dinyatakan lulus penuh atau menjadi persetujuan rilis karena pengujian autentikasi email, isolasi dua akun nyata, browser end-to-end, perangkat Android, dan verifikasi header HTTP aktual masih memerlukan pengujian runtime/manual.

## Keamanan Supabase

- Tabel `public.profiles` dan `public.progress_entries` memiliki Row Level Security aktif.
- Kebijakan SELECT/INSERT/UPDATE membatasi baris berdasarkan `auth.uid()` dan identitas pemilik.
- Kebijakan UPDATE memiliki `USING` dan `WITH CHECK`.
- Hak akses tabel tercatat untuk role `authenticated`; role `anon` tidak tercantum dalam ACL kedua tabel.
- Fungsi trigger `public.handle_new_snbt_user()` memakai `SECURITY DEFINER` dengan `search_path` tetap (`pg_catalog, public`). Hak EXECUTE yang teramati hanya untuk `postgres` dan `service_role`.
- Tidak ditemukan view pada schema `public` dalam pemeriksaan sebelumnya.
- Indeks unik `(user_id, client_id)` mendukung upsert progres yang idempoten; indeks `(user_id, completed_at DESC)` mendukung pemuatan riwayat per pengguna.

### Temuan dan keputusan

**WARN — Leaked Password Protection Disabled.** Supabase Auth melaporkan perlindungan kata sandi bocor belum aktif. Pengguna memutuskan menunda pengaturan ini dan tidak meng-upgrade paket Supabase Free. Evaluasi kembali sebelum peluncuran publik.

**CAPTCHA / Bot Protection — ditunda atas arahan pengguna.** Tidak ada konfigurasi CAPTCHA atau integrasi Turnstile yang dilakukan.

## Autentikasi dan sinkronisasi — pemeriksaan kode

- Client menggunakan Supabase publishable key, bukan service-role key.
- Session persistence dan auto-refresh diaktifkan pada Supabase client.
- Kode menyediakan Google OAuth, email/password sign-in dan sign-up, reset password, update password, dan sign-out. Google login telah berhasil diuji oleh pengguna; alur email belum diverifikasi end-to-end.
- Sinkronisasi progres menggunakan `user_id` dan `client_id`; pembacaan data dilakukan setelah session aktif.
- **Perbaikan Fase 5:** riwayat lokal akun yang keluar diarsipkan berdasarkan user ID, lalu cache aktif dibersihkan agar pengguna berikutnya tidak melihat data akun sebelumnya.
- Saat akun berganti, cache akun sebelumnya segera dipisahkan sebelum data akun baru ditampilkan atau disinkronkan. Ini mencegah riwayat akun A terunggah ke akun B.
- Kegagalan sinkronisasi tidak menghapus riwayat lokal; data dapat dicoba sinkronkan kembali saat koneksi pulih.
- Pengujian otomatis baru mencakup logout, isolasi cache A/B, pemulihan cache masing-masing akun, dan retensi data ketika unggahan offline gagal. Ini belum menggantikan uji dua akun nyata dan dua perangkat.

## Konten latihan dan tryout

- Bank latihan berisi 105 soal unik, 15 soal untuk masing-masing dari 7 subtes.
- Tersedia 14 paket latihan: 7 paket dasar dan 7 paket pendalaman.
- Tryout tetap terpisah: 70 soal dan timer 105 menit. Smoke test memastikan 70 tombol navigasi ditampilkan.
- CI memeriksa empat opsi unik, kunci jawaban yang tersedia, metadata, pembahasan, ID unik, serta kelengkapan seluruh paket.
- Soal merupakan materi latihan orisinal platform, bukan soal resmi SNBT.

## Header keamanan

Konfigurasi Vercel menambahkan header global:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Content Security Policy belum ditambahkan karena perlu inventarisasi dan pengujian seluruh sumber CDN/OAuth agar tidak merusak login dan aset halaman. Header HTTP aktual belum diverifikasi melalui sesi browser/HTTP pada deployment yang terlindungi.

## Advisor, CI, dan deployment

- Security advisor: satu peringatan Leaked Password Protection di atas.
- Performance advisor: tidak ada temuan.
- Health advisor: tidak ada temuan.
- GitHub Actions terbaru: sukses, run `43899094394`.
- Commit CI: `b62ce79b56b782b7ebadb10595479874579b1d1a`.
- Preview Vercel untuk commit audit ini: `READY`. Alias branch pengembangan tetap `https://suksessnbt-git-integrasi-snbt-learning-center-2026-11-ai-ced3.vercel.app`. Preview dilindungi autentikasi Vercel.
- Perubahan belum digabung ke `main` dan belum dipromosikan ke produksi.
- Branch pengembangan belum memiliki branch protection / required status checks. Ini kontrol proses yang direkomendasikan sebelum kolaborasi atau rilis.

## Pengujian yang masih wajib sebelum rilis

1. Uji pendaftaran email, konfirmasi email, login email, reset dan ubah password.
2. Uji isolasi dua akun nyata: akun A tidak boleh membaca atau mengubah progres akun B.
3. Uji simpan, sinkronkan, muat ulang, offline/online, pergantian akun, dan pergantian perangkat pada browser nyata.
4. Uji alur penuh seluruh paket latihan dan tryout di browser: jawaban, timer, hasil, pembahasan, dan penyimpanan.
5. Uji responsif, navigasi keyboard, screen reader dasar, dan browser Android.
6. Verifikasi empat header keamanan benar-benar terkirim pada preview/produksi setelah akses preview tersedia.
7. Audit Content Security Policy, dependensi CDN, serta penanganan kegagalan Supabase.
8. Tinjau branch protection dan required CI checks sebelum perubahan diizinkan masuk ke branch utama.

## Batasan audit dan keputusan rilis

Pemeriksaan kode, SQL, advisor, dan CI bukan pengganti penetration test atau browser end-to-end test. Karena beberapa pengujian runtime masih membutuhkan akun/perangkat pengguna, **Fase 5 berstatus “otomatis lulus, validasi manual tersisa” dan belum disetujui untuk rilis produksi atau APK**.

Tidak ada perubahan pada branch `main`, konfigurasi autentikasi Supabase, kebijakan RLS, atau deployment produksi dalam pekerjaan ini.
