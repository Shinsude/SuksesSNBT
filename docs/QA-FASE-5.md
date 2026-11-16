# Fase 5 — Catatan Audit dan QA

Tanggal pemeriksaan: 16 November 2026  
Branch: `integrasi-snbt-learning-center-2026-11`  
Commit audit dasar: `1cad14aff660e7dc46fd59572d9c7e8bd62276f1`

## Ringkasan status

Audit teknis database, hak akses, advisor Supabase, alur autentikasi dan sinkronisasi pada tingkat kode, CI, serta konfigurasi deployment telah diperiksa. Ini belum merupakan persetujuan rilis. Pengujian browser end-to-end dan validasi dengan dua akun nyata masih diperlukan.

## Keamanan Supabase

- Tabel `public.profiles` dan `public.progress_entries` memiliki Row Level Security aktif.
- Kebijakan SELECT/INSERT/UPDATE membatasi baris berdasarkan `auth.uid()` dan identitas pemilik.
- Kebijakan UPDATE memiliki `USING` dan `WITH CHECK`.
- Hak akses tabel tercatat untuk role `authenticated`; role `anon` tidak tercantum dalam ACL kedua tabel.
- Fungsi trigger `public.handle_new_snbt_user()` memakai `SECURITY DEFINER` dengan `search_path` tetap (`pg_catalog, public`). Hak EXECUTE yang teramati hanya untuk `postgres` dan `service_role`.
- Tidak ditemukan view pada schema `public` dalam pemeriksaan sebelumnya.
- Indeks unik `(user_id, client_id)` mendukung upsert progres yang idempoten; indeks `(user_id, completed_at DESC)` mendukung pemuatan riwayat per pengguna.

### Temuan dan keputusan

**WARN — Leaked Password Protection Disabled.** Supabase Auth melaporkan perlindungan kata sandi bocor belum aktif. Pengguna memutuskan menunda pengaturan ini dan tidak meng-upgrade paket Supabase Free. Catat sebagai keterbatasan yang perlu dievaluasi kembali sebelum peluncuran publik.

**CAPTCHA / Bot Protection — ditunda atas arahan pengguna.** Tidak ada konfigurasi CAPTCHA atau integrasi Turnstile yang dilakukan.

Referensi: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Autentikasi dan sinkronisasi — pemeriksaan kode

- Client menggunakan Supabase publishable key, bukan service-role key.
- Session persistence dan auto-refresh diaktifkan pada Supabase client.
- Kode menyediakan Google OAuth, email/password sign-in dan sign-up, reset password, update password, dan sign-out. Google login telah berhasil diuji oleh pengguna; alur email belum diverifikasi end-to-end.
- Sinkronisasi progres menggunakan `user_id` dan `client_id`; pembacaan data dilakukan setelah session aktif.
- Kode berusaha mencegah riwayat lokal milik akun sebelumnya diunggah ke akun lain pada browser yang sama.
- Perilaku multi-akun, perangkat bersama, offline, dan konflik sinkronisasi tetap harus diuji secara nyata sebelum dinyatakan lulus.

## Header keamanan

Pada commit setelah audit dasar, konfigurasi Vercel diperbarui untuk menambahkan header global:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Header ini merupakan lapisan dasar. Content Security Policy belum ditambahkan karena perlu inventarisasi dan pengujian seluruh sumber CDN/OAuth agar tidak merusak login dan aset halaman.

## Advisor, CI, dan deployment

- Security advisor: satu peringatan Leaked Password Protection di atas.
- Performance advisor: tidak ada temuan.
- Health advisor: tidak ada temuan.
- GitHub Actions pada commit `1cad14a`: sukses, run `43875642571`.
- Preview Vercel untuk commit `1cad14a`: `READY`; preview dilindungi autentikasi Vercel.
- Perubahan header keamanan dibuat pada commit `17de475576fe1bcc27d3cc98390f1c9053d01e28`; menunggu hasil CI dan preview deployment untuk commit ini.
- Branch pengembangan saat ini belum memiliki branch protection / required status checks. Ini bukan temuan akses data, tetapi kontrol proses yang direkomendasikan sebelum kolaborasi atau rilis.

## Pengujian yang masih wajib

1. Uji login Google, logout, pendaftaran email, konfirmasi email, login email, reset dan ubah password.
2. Uji isolasi dua akun: akun A tidak boleh membaca atau mengubah progres akun B.
3. Uji simpan, sinkronkan, muat ulang, offline/online, dan pergantian perangkat.
4. Uji seluruh paket latihan dan tryout: nilai benar/salah/kosong, timer, hasil, pembahasan, dan penyimpanan.
5. Uji responsif dan aksesibilitas pada desktop serta Android.
6. Verifikasi header keamanan benar-benar terkirim pada preview deployment.
7. Audit Content Security Policy, dependensi CDN, serta penanganan kegagalan Supabase.
8. Tinjau branch protection dan required CI checks sebelum perubahan diizinkan masuk ke branch utama.

## Batasan audit

Pemeriksaan kode, SQL, advisor, dan CI bukan pengganti penetration test atau browser end-to-end test. Tidak ada perubahan pada branch `main`, konfigurasi autentikasi Supabase, kebijakan RLS, atau deployment produksi dalam pekerjaan ini.
