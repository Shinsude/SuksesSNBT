# Fase 5 — Catatan Audit dan QA

Tanggal pemeriksaan: 17 November 2026  
Branch: `integrasi-snbt-learning-center-2026-11`  
Commit terbaru yang diperiksa: `0cba1b1f7c122ce28bb456729def64acb909e7ba`

## Ringkasan status

Pemeriksaan otomatis atas struktur situs, tautan internal, PWA, konfigurasi Android TWA, sintaks JavaScript, bank soal, interaksi tryout/paket, skenario dasar sinkronisasi progres, dan wiring autentikasi telah lulus pada CI terbaru. Preview Vercel terbaru berstatus `READY`.

Empat header keamanan HTTP juga telah diverifikasi langsung pada respons halaman akun di preview terbaru. Pemeriksaan tersebut memastikan header dikirim pada halaman yang diuji, bukan sekadar tercantum dalam konfigurasi.

Fase 5 belum dapat dinyatakan lulus penuh atau menjadi persetujuan rilis karena pengujian autentikasi email, isolasi dua akun nyata, browser end-to-end, dan perangkat Android masih memerlukan pengujian runtime/manual.

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

## Autentikasi dan sinkronisasi

- Client menggunakan Supabase publishable key, bukan service-role key.
- Session persistence, auto-refresh, dan deteksi callback URL diaktifkan pada Supabase client.
- Kode menyediakan Google OAuth, email/password sign-in dan sign-up, reset password, update password, dan sign-out.
- Google login telah berhasil diuji oleh pengguna; alur email belum diverifikasi end-to-end.
- **Peningkatan QA:** `scripts/verify_auth.js` memeriksa keberadaan elemen UI yang dipakai kode autentikasi, metode Auth utama, URL redirect konfirmasi email dan reset password, recovery mode, opsi session client, serta batas pemakaian publishable key. Pemeriksaan ini adalah smoke test statis, bukan simulasi email atau uji autentikasi langsung.
- Sinkronisasi progres menggunakan `user_id` dan `client_id`; pembacaan data dilakukan setelah session aktif.
- Cache lokal akun yang keluar diarsipkan berdasarkan user ID, lalu cache aktif dibersihkan agar pengguna berikutnya tidak melihat data akun sebelumnya.
- Saat akun berganti, cache akun sebelumnya dipisahkan sebelum data akun baru ditampilkan atau disinkronkan. Ini mencegah riwayat akun A terunggah ke akun B.
- Kegagalan sinkronisasi tidak menghapus riwayat lokal; data dapat dicoba sinkronkan kembali saat koneksi pulih.
- Pengujian otomatis mencakup logout, isolasi cache A/B, pemulihan cache masing-masing akun, dan retensi data ketika unggahan offline gagal. Ini belum menggantikan uji dua akun nyata dan dua perangkat.

## Konten latihan dan tryout

- Bank latihan berisi 105 soal unik, 15 soal untuk masing-masing dari 7 subtes.
- Tersedia 14 paket latihan: 7 paket dasar dan 7 paket pendalaman.
- Tryout terpisah berisi 70 soal dengan timer 105 menit.
- Smoke test memastikan 70 tombol navigasi tryout ditampilkan dan seluruh 14 paket dasar/pendalaman dapat membuka soal serta empat opsi jawaban.
- CI memeriksa empat opsi unik, kunci jawaban yang tersedia, metadata, pembahasan, ID unik, serta kelengkapan seluruh paket.
- Soal merupakan materi latihan orisinal platform, bukan soal resmi SNBT.

## Header keamanan HTTP

Respons `akun.html` pada preview terbaru diverifikasi pada 17 November 2026 dan mengirim header berikut:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Content Security Policy (CSP) belum ditambahkan karena perlu inventarisasi dan pengujian seluruh sumber CDN/OAuth agar tidak merusak login dan aset halaman. Verifikasi ini dilakukan pada satu halaman preview; belum merupakan pengujian seluruh rute atau domain produksi.

## CI dan deployment

- GitHub Actions terbaru: sukses, run [44089047895](https://github.com/Shinsude/SuksesSNBT/actions/runs/44089047895).
- Commit CI: `a5faa466af5981fd388b6bf81431a98458fed4a4`.
- Commit deployment preview terbaru: `0cba1b1f7c122ce28bb456729def64acb909e7ba`.
- Preview Vercel: [https://suksessnbt-cl47jhlie-ai-ced3.vercel.app/](https://suksessnbt-cl47jhlie-ai-ced3.vercel.app/), status `READY`.
- Halaman akun preview yang diperiksa: [https://suksessnbt-cl47jhlie-ai-ced3.vercel.app/akun.html](https://suksessnbt-cl47jhlie-ai-ced3.vercel.app/akun.html).
- Perubahan tetap pada branch pengembangan; belum digabung ke `main` dan belum dipromosikan ke produksi.
- Branch protection / required status checks belum terverifikasi aktif.

## Pengujian yang masih wajib sebelum rilis

1. Uji pendaftaran email, konfirmasi email, login email, reset dan ubah password.
2. Uji isolasi dua akun nyata: akun A tidak boleh membaca atau mengubah progres akun B.
3. Uji simpan, sinkronkan, muat ulang, offline/online, pergantian akun, dan pergantian perangkat pada browser nyata.
4. Uji alur penuh seluruh paket latihan dan tryout di browser: jawaban, timer, hasil, pembahasan, dan penyimpanan.
5. Uji responsif, navigasi keyboard, screen reader dasar, dan browser Android.
6. Audit Content Security Policy, dependensi CDN, serta penanganan kegagalan Supabase.
7. Tinjau branch protection dan required CI checks sebelum perubahan diizinkan masuk ke branch utama.

## Batasan audit dan keputusan rilis

Pemeriksaan kode, SQL, advisor, CI, dan header HTTP pada preview bukan pengganti penetration test atau browser end-to-end test. Karena beberapa pengujian runtime masih membutuhkan akun/perangkat pengguna, **Fase 5 berstatus “otomatis lulus, validasi manual tersisa” dan belum disetujui untuk rilis produksi atau APK**.

Tidak ada perubahan pada branch `main`, konfigurasi autentikasi Supabase, kebijakan RLS, atau deployment produksi dalam pekerjaan ini.
