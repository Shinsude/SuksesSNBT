# Roadmap Penyelesaian Sukses SNBT

## Arah kerja
Selesaikan implementasi seluruh fitur terlebih dahulu di branch `integrasi-snbt-learning-center-2026-11`. Setelah pengembangan selesai, lakukan satu putaran QA menyeluruh untuk seluruh fase. Produksi tetap tidak berubah sampai pemilik proyek menyetujui rilis.

## Yang sudah dibangun
- Website statis responsif dengan halaman beranda, materi, latihan, paket, tryout, progres, dan akun.
- PWA dengan manifest, ikon, service worker, dan cache aset inti.
- Supabase Auth, profil, riwayat progres, RLS, dan sinkronisasi lokal/cloud.
- Login Google telah berhasil diuji oleh pemilik proyek pada Preview.
- Bank soal latihan orisinal berjumlah 105 soal: 15 soal untuk masing-masing tujuh subtes.
- Tersedia 14 paket latihan: satu paket dasar dan satu paket pendalaman untuk masing-masing tujuh subtes.
- Simulasi komprehensif lintas subtes berisi 70 soal dan timer 105 menit.
- Dashboard progres menampilkan rata-rata nilai per subtes dan tren hingga tujuh sesi terakhir secara kronologis.
- Penyatuan UI/UX: palet Soft Sky & Mint, tipografi, kontras, fokus keyboard, ukuran target sentuh, dan gaya kartu pada halaman utama belajar.
- Navigasi utama diseragamkan pada katalog materi, latihan, paket, tryout, progres, dan akun.
- Tampilan nilai contoh di beranda diberi label ilustrasi agar tidak disangka data pengguna.
- Halaman progres untuk pengguna baru memberi ajakan langsung ke latihan ketika belum ada riwayat.
- Perbaikan materi PPU dan deskripsi subtes agar selaras dengan konten pembelajaran.
- CI memeriksa konsistensi konfigurasi TWA Android (application ID, domain produksi, URL manifest, start URL, ikon, dan warna tema) tanpa membutuhkan signing key.
- Perbaikan sumber bank soal pada tryout dan paket latihan agar seluruh 105 soal lintas tujuh subtes tersedia bagi runner.
- CI menjalankan smoke test runtime untuk navigasi tryout dan pembukaan paket latihan lintas subtes.
- Persiapan Android TWA tersedia di `android/` berupa panduan, template manifest, dan aturan agar signing key tidak masuk Git.

## Pekerjaan pengembangan yang masih perlu dituntaskan
1. Perluas dan perdalam materi tiap subtes serta bank soal secara bertahap; 105 soal saat ini adalah bank awal, belum cukup untuk mengklaim persiapan SNBT menyeluruh.
2. Tingkatkan fitur latihan: filter tingkat kesulitan/topik, variasi paket, pembahasan lebih rinci, dan pengalaman belajar yang konsisten.
3. Tinjau dashboard progres dan sinkronisasi pada browser nyata, termasuk kondisi offline/online dan pergantian akun.
4. Lakukan QA visual langsung pada layar HP dan desktop; periksa kontras, menu mobile, fokus keyboard, serta keterbacaan. Pemeriksaan kode bukan pengganti pengujian visual langsung.
5. Lengkapi SEO, metadata, dokumentasi, serta pengalaman instalasi PWA sesuai prioritas rilis.
6. Siapkan proyek TWA/APK Android dengan application ID terkonfirmasi `id.suksessnbt.app`; buat dan amankan signing key di luar Git, lalu siapkan Digital Asset Links. Signing key tidak boleh disimpan di Git.
7. Perbarui dokumentasi dan CI agar seluruh aset serta konten baru terjaga.

## QA akhir — dilakukan setelah seluruh pengembangan
- Jalankan pemeriksaan tautan, manifest, precache, sintaks JavaScript, konten, dan konfigurasi Android.
- Uji alur daftar email, verifikasi email, login email, Google OAuth, logout, dan reset password.
- Uji latihan, seluruh paket, tryout, hasil, pembahasan, dan penyimpanan progres.
- Uji sinkronisasi lintas browser/perangkat dan isolasi data antar akun.
- Uji PWA offline, instalasi Android, responsivitas, aksesibilitas, dan performa.
- Periksa Supabase security/performance/health advisors dan deployment Preview.
- Perbaiki semua temuan sebelum meminta persetujuan rilis.

## Batas rilis
- Pertahankan `main` dan domain produksi tanpa perubahan.
- Jangan mengubah proteksi SSO Preview untuk melewati QA.
- Jangan merge, mempromosikan deployment, atau merilis APK ke publik tanpa persetujuan eksplisit pemilik proyek.

## Status saat ini — 21 November 2026
- Fase 1–3: fondasi, struktur situs, dan fitur belajar utama telah dibangun; konten masih perlu diperluas bertahap.
- Fase 4: autentikasi dan sinkronisasi sudah diimplementasikan; Google Login telah diuji berhasil, tetapi alur email dan uji dua akun nyata belum tuntas.
- Fase 5: pemeriksaan otomatis dan beberapa pemeriksaan header telah lulus; validasi manual/browser, pengujian perangkat, dan audit CSP masih tersisa.
- Fase 6: penyempurnaan dan pengelolaan konten belum dinyatakan selesai.
- Fase 7: konfigurasi awal PWA/TWA tersedia; APK bertanda tangan belum dibuat.
- Fase 8: peluncuran belum dimulai.
- Semua perubahan pengembangan tetap berada di branch integrasi. Produksi belum disetujui untuk diperbarui.
