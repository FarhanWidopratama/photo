# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirement untuk **Photobooth Enhancement** — sebuah penambahan besar (14 fitur baru) pada aplikasi web photobooth **Life 4 Cuts** yang sudah berjalan di Vercel. Aplikasi saat ini dibangun dengan React + Vite dan memiliki fitur: 4-shot auto capture, filters, frame themes, AI background swap, stickers, doodle, galeri (IndexedDB), print modal, GIF export, dan PNG export.

Peningkatan ini dibagi ke dalam empat fase:
- **Fase 1 — Core Experience**: Mobile Responsive, Pose Gap, Watermark Branding
- **Fase 2 — Event Ready**: Lead Capture, PIN Event, QR Delivery, Kiosk Mode
- **Fase 3 — Owner Tools**: Analytics Dashboard, Admin Panel, Backup & Export
- **Fase 4 — Polish & Extras**: Musik Kustom, Multi-line Caption, Retake dari Celebration, Notifikasi/Reminder

---

## Glossary

- **Studio**: Halaman utama tempat pengguna mengambil foto (screen `studio` di App.jsx)
- **CelebrationScreen**: Komponen yang ditampilkan setelah sesi 4-foto selesai
- **WelcomeScreen**: Halaman awal sebelum sesi foto dimulai
- **PhotoStrip**: Gambar hasil gabungan 4 foto yang dapat diunduh
- **Session**: Satu siklus lengkap pengambilan 4 foto hingga ekspor hasil
- **Owner**: Pengelola/pemilik studio photobooth yang mengonfigurasi aplikasi
- **Customer**: Pengguna akhir yang menggunakan photobooth untuk berfoto
- **IndexedDB**: Database browser lokal yang digunakan aplikasi untuk menyimpan data
- **PoseGap**: Jeda waktu yang dapat dikonfigurasi antara setiap jepretan dalam satu sesi
- **Watermark**: Teks atau logo yang ditambahkan pada hasil unduhan PhotoStrip
- **LeadCapture**: Form pengumpulan data Customer (nama dan nomor HP) sebelum sesi dimulai
- **PINEvent**: Kode akses 4–6 digit yang harus dimasukkan Customer sebelum memulai sesi
- **KioskMode**: Mode tampilan portrait fullscreen untuk perangkat tablet yang berdiri sendiri
- **AdminPanel**: Halaman pengaturan yang dilindungi password khusus untuk Owner
- **AnalyticsDashboard**: Tampilan statistik sesi yang tersimpan di lokal tanpa server
- **App**: Komponen root aplikasi React (App.jsx)
- **Controls**: Komponen panel kontrol pengaturan studio (Controls.jsx)
- **CameraView**: Komponen tampilan kamera live dan pengambilan foto (CameraView.jsx)

---

## Requirements

---

### Requirement 1: Mobile Responsive Layout

**User Story:** Sebagai Customer, saya ingin menggunakan photobooth dari smartphone saya, sehingga saya dapat berfoto kapan saja tanpa memerlukan laptop atau komputer.

#### Acceptance Criteria

1. WHEN lebar viewport kurang dari 768px, THE App SHALL menampilkan layout portrait satu kolom (stack vertikal) menggantikan layout dua kolom desktop.
2. WHEN lebar viewport kurang dari 768px, THE Controls SHALL dirender sebagai bottom sheet atau tab navigation yang dapat di-scroll secara vertikal.
3. WHEN lebar viewport kurang dari 768px, THE CameraView SHALL menggunakan lebar penuh (100vw) tanpa padding horizontal yang memotong tampilan kamera.
4. THE App SHALL menyediakan semua elemen interaktif (tombol, tab, toggle) dengan ukuran touch target minimal 44x44 piksel pada semua ukuran layar.
5. WHEN lebar viewport kurang dari 768px, THE App SHALL menampilkan urutan elemen sebagai: header → live camera → strip preview → controls → action buttons, dari atas ke bawah.
6. WHEN lebar viewport antara 768px dan 1024px (tablet landscape), THE App SHALL menampilkan layout dua kolom yang proporsional mengikuti ukuran layar.

---

### Requirement 2: Pose Gap (Jeda Antar Foto)

**User Story:** Sebagai Customer, saya ingin ada jeda waktu setelah setiap jepretan sebelum countdown berikutnya dimulai, sehingga saya punya waktu untuk mengatur pose tanpa terburu-buru.

#### Acceptance Criteria

1. THE Controls SHALL menyediakan pilihan durasi PoseGap dengan nilai 2 detik, 3 detik, dan 5 detik yang dapat dipilih oleh Customer sebelum sesi dimulai.
2. WHEN satu jepretan telah selesai diambil dan masih ada jepretan berikutnya, THE CameraView SHALL menampilkan overlay teks "Siap pose berikutnya!" selama durasi PoseGap yang dipilih sebelum countdown jepretan berikutnya dimulai.
3. WHEN Customer tidak memilih PoseGap, THE CameraView SHALL menggunakan nilai default PoseGap 3 detik.
4. WHEN PoseGap aktif ditampilkan, THE CameraView SHALL menampilkan progress bar atau indikator hitung mundur PoseGap yang dapat dilihat Customer.
5. THE App SHALL menyimpan preferensi PoseGap yang dipilih Customer ke IndexedDB sehingga tersimpan untuk sesi berikutnya.

---

### Requirement 3: Watermark Branding

**User Story:** Sebagai Owner, saya ingin logo atau teks studio saya muncul pada setiap PhotoStrip yang diunduh Customer, sehingga hasil foto mempromosikan studio saya secara otomatis.

#### Acceptance Criteria

1. THE Controls SHALL menyediakan field teks untuk Owner mengisi teks Watermark yang akan ditampilkan pada PhotoStrip hasil unduhan.
2. WHEN Watermark telah dikonfigurasi, THE App SHALL merender teks Watermark di pojok kanan bawah PhotoStrip pada setiap ekspor PNG dan GIF.
3. THE Controls SHALL menyediakan slider opacity Watermark dengan rentang nilai 0% hingga 100% yang dapat disesuaikan Owner.
4. WHEN opacity Watermark diatur ke 0%, THE App SHALL tidak merender teks Watermark pada PhotoStrip yang diekspor.
5. THE App SHALL menyimpan konfigurasi teks dan opacity Watermark ke IndexedDB sehingga tersimpan untuk sesi berikutnya.
6. WHERE Owner mengisi teks Watermark, THE App SHALL menampilkan pratinjau posisi Watermark secara real-time di komponen PhotoStripPreview.

---

### Requirement 4: Lead Capture (Pengumpulan Data Customer)

**User Story:** Sebagai Owner, saya ingin mengumpulkan nama dan nomor HP Customer sebelum sesi dimulai, sehingga saya dapat menindaklanjuti mereka dan menggunakan nama mereka di strip foto.

#### Acceptance Criteria

1. WHEN Customer mengklik tombol "Mulai Studio Session" di WelcomeScreen dan fitur LeadCapture diaktifkan oleh Owner, THE App SHALL menampilkan form LeadCapture dengan field nama (wajib diisi) dan nomor HP (opsional).
2. THE App SHALL menyediakan tombol "Lewati" yang memungkinkan Customer melewati form LeadCapture tanpa mengisi data apapun.
3. WHEN Customer mengisi nama pada form LeadCapture dan memulai sesi, THE App SHALL menggunakan nama Customer tersebut sebagai bagian dari teks judul pada PhotoStrip.
4. WHEN sesi selesai, THE App SHALL menyimpan data LeadCapture (nama, nomor HP, timestamp sesi, ID sesi) ke IndexedDB.
5. THE AdminPanel SHALL menampilkan daftar semua data LeadCapture yang tersimpan dalam tabel yang dapat di-scroll.
6. THE AdminPanel SHALL menyediakan tombol ekspor yang menghasilkan file CSV berisi semua data LeadCapture yang tersimpan.
7. WHEN file CSV di-generate, THE App SHALL menyertakan kolom: nama, nomor_hp, tanggal, jam, dan id_sesi pada file tersebut.

---

### Requirement 5: PIN Event / Kode Akses

**User Story:** Sebagai Owner, saya ingin membatasi akses studio dengan PIN untuk event private atau korporat, sehingga hanya tamu undangan yang dapat menggunakan photobooth.

#### Acceptance Criteria

1. THE AdminPanel SHALL menyediakan field untuk Owner mengatur PIN Event dengan panjang 4 hingga 6 digit angka.
2. THE AdminPanel SHALL menyediakan toggle untuk mengaktifkan atau menonaktifkan fitur PINEvent tanpa menghapus PIN yang telah diatur.
3. WHEN fitur PINEvent diaktifkan dan Customer membuka WelcomeScreen, THE App SHALL menampilkan form input PIN sebelum menampilkan konten WelcomeScreen utama.
4. WHEN Customer memasukkan PIN yang benar, THE App SHALL menyembunyikan form input PIN dan menampilkan WelcomeScreen secara penuh.
5. WHEN Customer memasukkan PIN yang salah, THE App SHALL menampilkan pesan kesalahan "PIN salah, coba lagi" dan mengosongkan field input PIN.
6. THE App SHALL menyimpan status aktivasi dan nilai PIN Event ke IndexedDB.
7. IF PIN Event diaktifkan dan Customer mencoba mengakses Studio tanpa memasukkan PIN yang benar terlebih dahulu, THEN THE App SHALL mengarahkan Customer kembali ke halaman input PIN.

---

### Requirement 6: QR Delivery ke HP

**User Story:** Sebagai Customer, saya ingin memindai QR code untuk mendapatkan hasil foto langsung di HP saya, sehingga saya tidak perlu mentransfer file secara manual.

#### Acceptance Criteria

1. WHEN sesi foto selesai dan CelebrationScreen ditampilkan, THE App SHALL meng-generate QR code yang mengarah ke URL yang dapat membuka PhotoStrip hasil sesi tersebut langsung di browser HP.
2. THE App SHALL meng-encode data PhotoStrip sebagai URL berbasis Vercel deployment URL menggunakan parameter base64 atau mekanisme penyimpanan blob sementara.
3. WHEN Customer memindai QR code menggunakan kamera HP, THE App SHALL membuka halaman yang menampilkan PhotoStrip tersebut dan menyediakan tombol unduh.
4. THE CelebrationScreen SHALL menampilkan QR code dengan ukuran minimal 120x120 piksel agar dapat dipindai dengan mudah.
5. WHEN ukuran data PhotoStrip melebihi batas URL yang praktis (lebih dari 2MB dalam base64), THE App SHALL menampilkan pesan alternatif yang menyarankan Customer untuk mengunduh langsung melalui tombol "Unduh PNG".
6. THE App SHALL menampilkan teks instruksi "Scan QR ini dengan kamera HP kamu untuk mendapatkan foto" di bawah QR code.

---

### Requirement 7: Kiosk Mode (Portrait/Tablet)

**User Story:** Sebagai Owner, saya ingin aplikasi berjalan dalam mode kiosk pada tablet yang berdiri sendiri, sehingga Customer dapat menggunakan photobooth secara mandiri di lokasi event.

#### Acceptance Criteria

1. THE AdminPanel SHALL menyediakan toggle untuk mengaktifkan atau menonaktifkan KioskMode secara permanen.
2. WHEN KioskMode diaktifkan, THE App SHALL menampilkan layout portrait fullscreen yang mengisi seluruh layar tanpa elemen navigasi header dan footer yang tidak diperlukan Customer.
3. WHEN KioskMode diaktifkan, THE Controls SHALL menyembunyikan semua kontrol tingkat lanjut yang ditujukan untuk Owner (AI Background settings, frame upload, doodle tools, AR props) dan hanya menampilkan filter dan frame preset yang telah dikonfigurasi.
4. WHEN KioskMode diaktifkan dan tidak ada interaksi pengguna selama durasi idle yang telah dikonfigurasi (default: 3 menit), THE App SHALL mereset tampilan ke WelcomeScreen secara otomatis.
5. THE AdminPanel SHALL menyediakan field untuk Owner mengatur durasi idle KioskMode dengan nilai 1 menit, 3 menit, dan 5 menit.
6. WHEN KioskMode diaktifkan, THE CelebrationScreen SHALL menampilkan tombol "Mulai Sesi Baru" yang menonjol untuk memudahkan Customer memulai ulang tanpa bantuan Owner.
7. THE App SHALL menyimpan status dan konfigurasi KioskMode ke IndexedDB sehingga tersimpan saat halaman di-refresh.

---

### Requirement 8: Analytics Dashboard

**User Story:** Sebagai Owner, saya ingin melihat statistik penggunaan studio berdasarkan data lokal, sehingga saya dapat memahami tren penggunaan dan preferensi Customer tanpa memerlukan server eksternal.

#### Acceptance Criteria

1. THE AdminPanel SHALL menampilkan AnalyticsDashboard yang memuat data total sesi untuk periode hari ini, 7 hari terakhir, dan 30 hari terakhir.
2. THE AnalyticsDashboard SHALL menampilkan frame theme yang paling sering digunakan, berdasarkan frekuensi kemunculan di data sesi yang tersimpan.
3. THE AnalyticsDashboard SHALL menampilkan filter yang paling sering digunakan, berdasarkan frekuensi kemunculan di data sesi yang tersimpan.
4. THE AnalyticsDashboard SHALL menampilkan grafik atau tabel distribusi sesi per jam dalam sehari (0–23), dihitung dari data sesi yang tersimpan.
5. THE AnalyticsDashboard SHALL menampilkan grafik atau tabel distribusi sesi per hari dalam seminggu, dihitung dari data sesi yang tersimpan.
6. WHEN tidak ada sesi yang tersimpan untuk periode yang dipilih, THE AnalyticsDashboard SHALL menampilkan pesan "Belum ada data sesi untuk periode ini".
7. THE AnalyticsDashboard SHALL hanya menggunakan data yang tersimpan di IndexedDB tanpa melakukan request ke server atau layanan eksternal apapun.

---

### Requirement 9: Admin Panel

**User Story:** Sebagai Owner, saya ingin halaman pengaturan yang terlindungi password, sehingga Customer tidak dapat mengubah konfigurasi studio secara tidak sengaja atau disengaja.

#### Acceptance Criteria

1. THE App SHALL menyediakan halaman AdminPanel yang dapat diakses melalui URL path khusus atau tombol tersembunyi (misalnya, tap logo 5 kali berturut-turut).
2. WHEN Customer atau pengguna tak dikenal mengakses halaman AdminPanel, THE App SHALL menampilkan form input password sebelum menampilkan konten AdminPanel.
3. WHEN password yang dimasukkan benar, THE App SHALL menampilkan konten AdminPanel secara penuh dan menyimpan status autentikasi di sessionStorage selama sesi browser aktif.
4. WHEN password yang dimasukkan salah, THE App SHALL menampilkan pesan "Password salah" dan mengosongkan field input.
5. THE AdminPanel SHALL menyediakan kemampuan untuk Owner menetapkan atau mengubah password AdminPanel itu sendiri.
6. THE AdminPanel SHALL menyediakan interface untuk Owner mengatur default theme dan default filter yang akan digunakan pada setiap sesi baru.
7. THE AdminPanel SHALL menyediakan toggle untuk Owner mengaktifkan atau menonaktifkan fitur-fitur berikut yang terlihat oleh Customer: LeadCapture, PINEvent, KioskMode, Watermark, dan QR Delivery.
8. THE App SHALL menyimpan password AdminPanel (dalam bentuk hash) dan semua konfigurasi AdminPanel ke IndexedDB.

---

### Requirement 10: Backup & Export

**User Story:** Sebagai Owner, saya ingin mengekspor semua foto dan data dari aplikasi ke file lokal, sehingga saya memiliki backup dan dapat memindahkan data jika diperlukan.

#### Acceptance Criteria

1. THE AdminPanel SHALL menyediakan tombol "Export Semua Foto sebagai ZIP" yang menghasilkan file ZIP berisi semua PhotoStrip PNG yang tersimpan di galeri.
2. WHEN file ZIP di-generate, THE App SHALL menamai setiap file PNG di dalam ZIP mengikuti format `life4cuts-{id_sesi}-{tanggal}.png`.
3. THE AdminPanel SHALL menyediakan tombol "Export Data Lead sebagai CSV" yang menghasilkan file CSV berisi semua data LeadCapture (sama dengan Requirement 4.6).
4. THE AdminPanel SHALL menyediakan tombol "Export Backup Lengkap" yang menghasilkan file JSON berisi semua data sesi (metadata, bukan binary foto) dan semua pengaturan yang tersimpan.
5. THE AdminPanel SHALL menyediakan tombol "Import / Restore Backup" yang memungkinkan Owner mengunggah file JSON hasil export backup untuk memulihkan data.
6. WHEN proses export sedang berjalan, THE App SHALL menampilkan indikator loading dan menonaktifkan tombol export hingga proses selesai.
7. IF proses export atau import gagal karena error, THEN THE App SHALL menampilkan pesan error yang deskriptif kepada Owner.

---

### Requirement 11: Musik Kustom

**User Story:** Sebagai Owner, saya ingin mengunggah lagu sendiri yang akan diputar selama sesi foto berlangsung, sehingga suasana studio dapat dikustomisasi sesuai tema event.

#### Acceptance Criteria

1. THE Controls SHALL menyediakan tombol "Upload Lagu (.mp3)" yang memungkinkan Owner mengunggah file audio dalam format MP3 dengan ukuran maksimal 10MB.
2. WHEN file MP3 berhasil diunggah, THE App SHALL menyimpan data audio ke IndexedDB dan menampilkan nama file yang diunggah sebagai konfirmasi.
3. WHEN sesi foto dimulai (tombol "Mulai 4-Snap Studio!" ditekan), THE App SHALL memutar lagu yang diunggah dengan efek fade-in selama 1 detik.
4. WHEN sesi foto selesai (semua 4 jepretan diambil), THE App SHALL menghentikan lagu dengan efek fade-out selama 1 detik.
5. THE Controls SHALL menyediakan kontrol volume untuk mengatur tingkat volume musik kustom dengan rentang 0% hingga 100%.
6. IF file yang diunggah bukan format MP3 atau ukurannya melebihi 10MB, THEN THE App SHALL menampilkan pesan kesalahan "Format harus MP3 dan ukuran maksimal 10MB" dan menolak file tersebut.
7. THE Controls SHALL menyediakan tombol untuk menghapus lagu yang sudah diunggah dan mengembalikan ke kondisi tanpa musik kustom.

---

### Requirement 12: Multi-line Caption

**User Story:** Sebagai Customer, saya ingin menambahkan caption multi-baris pada strip foto saya dengan word-wrap otomatis, sehingga saya dapat menulis kalimat panjang yang tampil rapi di hasil foto.

#### Acceptance Criteria

1. THE Controls SHALL menyediakan textarea (bukan input satu baris) untuk Customer memasukkan caption dengan dukungan multi-baris dan panjang maksimal 200 karakter.
2. WHEN Customer mengetik caption yang melebihi lebar area caption di PhotoStrip, THE App SHALL menerapkan word-wrap otomatis sehingga teks tidak terpotong.
3. THE Controls SHALL menyediakan minimal 5 template teks preset (misalnya: "Best Friends Forever 💖", "Squad Goals 🔥", "Memories 2026 ✨", "Bestie Vibes 🌸", "Party Time 🎉") yang dapat dipilih Customer sebagai caption awal.
4. WHEN Customer memilih template preset, THE App SHALL mengisi textarea dengan teks template tersebut yang kemudian dapat diedit lebih lanjut oleh Customer.
5. THE Controls SHALL menampilkan penghitung karakter yang menunjukkan jumlah karakter caption saat ini dari batas maksimal 200 karakter.
6. WHEN caption multi-baris diekspor sebagai bagian dari PhotoStrip PNG atau GIF, THE App SHALL merender setiap baris teks dengan spasi antar baris yang terbaca dengan jelas.

---

### Requirement 13: Retake dari Celebration Screen

**User Story:** Sebagai Customer, saya ingin dapat mengambil ulang foto tertentu langsung dari CelebrationScreen tanpa harus menutup celebration dan kembali ke studio, sehingga saya tidak kehilangan foto lain yang sudah bagus.

#### Acceptance Criteria

1. THE CelebrationScreen SHALL menampilkan tombol "Ulang" (retake) pada setiap thumbnail foto yang ditampilkan di panel preview.
2. WHEN Customer mengklik tombol "Ulang" pada foto ke-N di CelebrationScreen, THE App SHALL menutup tampilan CelebrationScreen, kembali ke tampilan Studio, dan langsung memulai countdown untuk mengambil ulang foto ke-N tersebut.
3. WHEN pengambilan ulang foto ke-N selesai, THE App SHALL menampilkan kembali CelebrationScreen dengan foto ke-N yang telah diperbarui dan foto-foto lainnya tetap tidak berubah.
4. WHEN proses retake sedang berlangsung dari CelebrationScreen, THE App SHALL menampilkan indikator yang menunjukkan foto ke berapa yang sedang diambil ulang.
5. THE CelebrationScreen SHALL menampilkan tombol "Ulang" dengan ukuran touch target minimal 44x44 piksel agar mudah digunakan di layar sentuh.

---

### Requirement 14: Notifikasi / Reminder Simpan Foto

**User Story:** Sebagai Customer, saya ingin mendapatkan reminder untuk menyimpan foto setelah sesi selesai, sehingga saya tidak lupa menyimpan hasil foto sebelum meninggalkan halaman.

#### Acceptance Criteria

1. WHEN CelebrationScreen ditampilkan, THE App SHALL menampilkan pesan reminder inline "Jangan lupa simpan foto ke galeri! 💾" yang terlihat jelas di dalam CelebrationScreen.
2. WHEN Customer telah berada di CelebrationScreen selama lebih dari 30 detik tanpa mengklik tombol unduh atau simpan, THE App SHALL menampilkan pesan reminder kedua yang lebih menonjol (misalnya, dengan animasi pulse atau warna yang lebih cerah).
3. THE CelebrationScreen SHALL menyediakan toggle opsional "Aktifkan notifikasi browser" yang meminta izin Web Notifications API kepada Customer.
4. WHEN Customer mengizinkan notifikasi browser dan sesi foto selesai, THE App SHALL mengirimkan browser notification dengan teks "Foto kamu sudah siap! Tap untuk menyimpan." yang mengarahkan kembali ke tab aplikasi.
5. WHEN Customer tidak mengizinkan notifikasi browser, THE App SHALL tidak menampilkan permintaan izin notifikasi lagi pada sesi yang sama.
6. IF browser tidak mendukung Web Notifications API, THEN THE App SHALL menyembunyikan toggle notifikasi browser dan hanya menampilkan reminder inline.
