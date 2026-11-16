# Fase 5 — Catatan Audit Awal

Tanggal pemeriksaan: 16 November 2026  
Branch: `integrasi-snbt-learning-center-2026-11`  
Commit dasar yang diperiksa: `63a9c635b95dc00cadb51fcfc5475b87d8123b71`

## Ringkasan status

Audit awal berhasil memeriksa kebijakan database, hak akses tabel, fungsi trigger, advisor Supabase, workflow CI, dan konfigurasi deployment. Ini belum merupakan persetujuan rilis.

## Hasil keamanan Supabase

- Tabel `public.profiles` dan `public.progress_entries` memiliki Row Level Security aktif.
- Kebijakan SELECT/INSERT/UPDATE membatasi baris menggunakan `auth.uid()` terhadap `id` atau `user_id` pemilik data.
- Kebijakan UPDATE memiliki `USING` dan `WITH CHECK`, sehingga pemilik tidak dapat memindahkan kepemilikan baris.
- Hak akses tabel diberikan kepada `authenticated`; role `anon` tidak tercantum dalam ACL kedua tabel.
- Fungsi trigger `public.handle_new_snbt_user()` memakai `SECURITY DEFINER` dengan `search_path` tetap (`pg_catalog, public`). Hak EXECUTE yang teramati hanya untuk `postgres` dan `service_role`; fungsi dipanggil oleh trigger pembuatan user. Metadata user hanya dipakai untuk mengisi nama tampilan, bukan keputusan otorisasi.
- Tidak ditemukan view pada schema `public` dalam pemeriksaan objek database.

### Temuan yang perlu ditindaklanjuti

**WARN — Leaked Password Protection Disabled.** Supabase Auth melaporkan perlindungan terhadap kata sandi yang diketahui bocor belum aktif. Karena antarmuka proyek menyediakan autentikasi email/password, aktifkan pengaturan ini pada Supabase Dashboard > Authentication > Settings/Password Security sebelum rilis. Pengaturan ini belum diubah dalam audit ini.

Referensi: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Advisor database

- Security: satu peringatan di atas.
- Performance: tidak ada temuan.
- Health: tidak ada temuan.

## CI dan deployment

- Workflow GitHub Actions terakhir pada commit dasar berstatus sukses: `43871363174`.
- Pemeriksaan yang dijalankan: tautan internal/PWA, konfigurasi Android TWA, sintaks JavaScript, konsistensi bank soal, dan smoke test interaksi tryout/paket.
- Preview Vercel pada commit dasar berstatus `READY`.
- Preview tetap terlindungi autentikasi Vercel. Pengujian browser lintas perangkat dan alur pengguna nyata belum dianggap selesai.

## Pengujian yang masih wajib

1. Login Google, logout, pendaftaran email, konfirmasi email, login email, reset dan ubah password.
2. Isolasi data dua akun berbeda: akun A tidak boleh membaca atau mengubah progres akun B.
3. Simpan, sinkronkan, dan muat ulang progres saat online/offline serta pergantian perangkat.
4. Alur lengkap paket latihan dan tryout: nilai benar/salah/kosong, timer, hasil, pembahasan, dan penyimpanan.
5. Pengujian responsif dan aksesibilitas pada desktop serta Android.
6. Pemeriksaan konfigurasi produksi, header keamanan, dependensi CDN, dan pemulihan ketika layanan Supabase gagal.

## Batasan audit

Pemeriksaan database dan CI bukan pengganti penetration test atau end-to-end browser test. Tidak ada perubahan pada branch `main`, konfigurasi produksi, kebijakan RLS, maupun pengaturan autentikasi dalam audit awal ini.
