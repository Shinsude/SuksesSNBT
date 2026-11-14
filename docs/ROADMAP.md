# Roadmap Penyelesaian Sukses SNBT

## Arah kerja
Selesaikan implementasi seluruh fitur terlebih dahulu di branch `integrasi-snbt-learning-center-2026-11`. Setelah pengembangan selesai, lakukan satu putaran QA menyeluruh untuk seluruh fase. Produksi tetap tidak berubah sampai pemilik proyek menyetujui rilis.

## Yang sudah dibangun
- Website statis responsif dengan halaman beranda, materi, latihan, paket, tryout, progres, dan akun.
- PWA dengan manifest, ikon, service worker, dan cache aset inti.
- Supabase Auth, profil, riwayat progres, RLS, dan sinkronisasi lokal/cloud.
- Login Google telah berhasil diuji oleh pemilik proyek pada Preview.
- Bank soal latihan orisinal berjumlah 70 soal: 10 soal untuk masing-masing tujuh subtes.
- Paket dasar aktif untuk ketujuh subtes.
- Simulasi komprehensif lintas subtes berisi 70 soal dan timer 105 menit.
- Dashboard progres menampilkan rata-rata nilai per subtes; metadata subtes disimpan bersama riwayat cloud.
- Persiapan Android TWA tersedia di `android/` berupa panduan, template manifest, dan aturan agar signing key tidak masuk Git.

## Pekerjaan pengembangan yang masih perlu dituntaskan
1. Perluas dan perdalam materi tiap subtes serta bank soal secara bertahap; 70 soal saat ini adalah bank awal, belum cukup untuk mengklaim persiapan SNBT menyeluruh.
2. Tingkatkan fitur latihan: filter tingkat kesulitan/topik, variasi paket, pembahasan lebih rinci, dan pengalaman belajar yang konsisten.
3. Tingkatkan progres: ringkasan per subtes, tren nilai, dan sinkronisasi yang konsisten.
4. Rapikan tampilan dan aksesibilitas seluruh halaman untuk layar HP dan desktop.
5. Lengkapi SEO, metadata, dokumentasi, serta pengalaman instalasi PWA.
6. Siapkan TWA/APK Android setelah application ID dan signing disepakati. Signing key tidak boleh disimpan di Git.
7. Perbarui dokumentasi dan CI agar seluruh aset serta konten baru terjaga.

## QA akhir — dilakukan setelah seluruh pengembangan
- Jalankan pemeriksaan tautan, manifest, precache, dan sintaks JavaScript.
- Uji alur daftar email, verifikasi email, login email, Google OAuth, logout, dan reset password.
- Uji latihan, paket, tryout, hasil, dan penyimpanan progres.
- Uji sinkronisasi lintas browser/perangkat dan isolasi data antar akun.
- Uji PWA offline, instalasi Android, responsivitas, aksesibilitas, dan performa.
- Periksa Supabase security/performance/health advisors dan deployment Preview.
- Perbaiki semua temuan sebelum meminta persetujuan rilis.

## Batas rilis
- Pertahankan `main` dan domain produksi tanpa perubahan.
- Jangan mengubah proteksi SSO Preview untuk melewati QA.
- Jangan merge, mempromosikan deployment, atau merilis APK ke publik tanpa persetujuan eksplisit pemilik proyek.
