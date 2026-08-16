# Dokumen Persyaratan — Life 4 Cuts: 14 Fitur Baru

## Introduction

Dokumen ini mendefinisikan persyaratan fungsional untuk 14 fitur baru yang akan ditambahkan ke aplikasi photobooth berbasis browser **Life 4 Cuts** (React + Vite, deploy di Vercel). Aplikasi saat ini sudah memiliki: 4-snap auto session, berbagai filter & frame theme, AI background swap, AR props, doodle canvas, stiker, caption, download PNG/GIF, print modal, galeri lokal (IndexedDB), music player, dan celebration screen.

Ke-14 fitur dikelompokkan dalam 4 fase:
- **Fase 1 — Core Experience**: Mobile Responsive, Pose Gap, Watermark Branding
- **Fase 2 — Event Ready**: Lead Capture, PIN Event, QR Delivery, Kiosk Mode
- **Fase 3 — Owner Tools**: Analytics Dashboard, Admin Panel, Backup & Export
- **Fase 4 — Polish & Extras**: Musik Kustom, Multi-line Caption, Retake dari Celebration, Notifikasi

---

## Glosarium

- **App**: Aplikasi Life 4 Cuts secara keseluruhan
- **Studio**: Layar utama pengambilan foto (screen `studio`)
- **Session**: Satu rangkaian 4 jepretan foto hingga selesai
- **Strip**: Gambar akhir yang dihasilkan dari 1 session (PNG)
- **CelebrationScreen**: Komponen `CelebrationScreen.jsx` yang muncul setelah session selesai
- **Controls**: Komponen `Controls.jsx` — panel pengaturan di sisi kiri studio
- **CameraView**: Komponen `CameraView.jsx` — live preview kamera dan logika countdown
- **GalleryModal**: Komponen `GalleryModal.jsx` — modal galeri lokal berbasis IndexedDB
- **WelcomeScreen**: Komponen `WelcomeScreen.jsx` — halaman awal sebelum masuk studio
- **IndexedDB**: Penyimpanan lokal browser yang dikelola via `src/utils/db.js`
- **Owner**: Pemilik / operator booth yang mengkonfigurasi event
- **Customer**: Pengguna akhir yang menggunakan booth untuk berfoto
- **Kiosk**: Mode layar penuh portrait untuk tablet stand tanpa kontrol advanced
- **PoseGap**: Jeda waktu antar jepretan dalam satu session
- **Watermark**: Teks atau logo yang dicetak transparan di atas strip foto
- **PIN**: Kode akses 4–6 digit yang diset owner untuk event privat
- **LeadCapture**: Form pengumpulan data customer (nama + nomor HP)
- **QRDelivery**: Mekanisme pengiriman link foto via QR code ke HP customer
- **AdminPanel**: Panel pengaturan owner yang dilindungi password
- **Analytics**: Data statistik sesi yang tersimpan lokal di IndexedDB
- **Blob**: File binary di memori browser (untuk objek File/audio)
- **CSV**: Format teks terpisah koma untuk export data
- **ZIP**: Format arsip terkompresi untuk export galeri

---

## Requirements

### Requirement 1

**User Story:** Sebagai customer yang menggunakan HP, saya ingin tampilan studio menyesuaikan layar portrait mobile, sehingga saya dapat berfoto dengan nyaman tanpa perlu scroll horizontal atau elemen yang terpotong.

#### Acceptance Criteria

1. WHEN lebar viewport kurang dari 768px, THE App SHALL menampilkan layout satu kolom vertikal (kamera di atas, strip preview di bawah) menggantikan layout dua kolom desktop.
2. WHEN lebar viewport kurang dari 768px, THE App SHALL menampilkan panel Controls sebagai bottom sheet atau tab navigation yang dapat di-expand/collapse dari bawah layar.
3. WHEN lebar viewport kurang dari 768px, THE CameraView SHALL menggunakan lebar penuh viewport untuk area preview kamera.
4. WHEN lebar viewport kurang dari 768px, THE App SHALL menggunakan target touch area minimal 44×44px untuk setiap tombol interaktif.
5. WHEN lebar viewport kurang dari 768px, THE App SHALL menyembunyikan elemen dekoratif welcome-strip-preview pada WelcomeScreen.
6. WHILE mode portrait mobile aktif, THE App SHALL mempertahankan semua fungsionalitas inti (mulai session, pilih filter, download, simpan galeri) tanpa memerlukan scroll horizontal.
7. IF viewport berubah dari mobile ke desktop atau sebaliknya, THEN THE App SHALL memperbarui layout secara responsif tanpa perlu reload halaman.

---

### Requirement 2

**User Story:** Sebagai customer, saya ingin ada jeda waktu antara setiap jepretan disertai layar konfirmasi pose, sehingga saya punya cukup waktu untuk berganti pose sebelum foto berikutnya diambil.

#### Acceptance Criteria

1. THE Controls SHALL menyediakan pilihan durasi PoseGap dengan opsi: 2 detik, 3 detik, dan 5 detik, dengan nilai default 3 detik.
2. WHEN session dimulai dan setelah setiap jepretan kecuali jepretan terakhir, THE CameraView SHALL menampilkan layar interstitial bertuliskan "Siap pose berikutnya!" selama durasi PoseGap yang dipilih.
3. WHILE layar PoseGap ditampilkan, THE CameraView SHALL menampilkan nomor jepretan berikutnya (contoh: "Foto ke-2 dari 4").
4. WHILE layar PoseGap ditampilkan, THE CameraView SHALL menampilkan countdown visual yang menunjukkan sisa waktu PoseGap.
5. WHEN durasi PoseGap berakhir, THE CameraView SHALL langsung memulai countdown untuk jepretan berikutnya.
6. IF PoseGap diset ke 0 detik, THEN THE CameraView SHALL melewati layar interstitial dan melanjutkan ke countdown berikutnya secara langsung.
7. THE App SHALL menyimpan preferensi PoseGap ke IndexedDB melalui saveSettings agar persisten antar sesi browser.

---

### Requirement 3

**User Story:** Sebagai owner booth, saya ingin logo atau teks studio muncul di setiap strip foto yang diunduh, sehingga foto yang disebarkan customer membawa identitas brand studio saya.

#### Acceptance Criteria

1. THE Controls SHALL menyediakan input teks untuk watermark dengan placeholder "Nama Studio / @handle" dan batas maksimal 60 karakter.
2. THE Controls SHALL menyediakan slider opacity watermark dengan rentang 10% hingga 100% dan nilai default 40%.
3. THE Controls SHALL menyediakan pilihan posisi watermark: pojok kanan bawah, pojok kiri bawah, pojok kanan atas, pojok kiri atas.
4. WHEN customer mengunduh strip PNG atau GIF, THE App SHALL merender watermark teks di atas strip sesuai posisi dan opacity yang dikonfigurasi.
5. WHEN teks watermark kosong, THE App SHALL tidak merender watermark apapun pada strip yang diunduh.
6. THE PhotoStripPreview SHALL menampilkan watermark secara real-time di preview strip agar owner dapat melihat hasilnya sebelum diunduh.
7. THE App SHALL menyimpan konfigurasi watermark (teks, opacity, posisi) ke IndexedDB melalui saveSettings.
8. WHERE fitur watermark diaktifkan dengan teks non-kosong, THE canvasExporter SHALL merender watermark sebagai lapisan terakhir di atas semua elemen strip lainnya.

---

### Requirement 4

**User Story:** Sebagai owner event, saya ingin mengumpulkan nama dan nomor HP customer sebelum mereka mulai berfoto, sehingga saya memiliki data leads untuk follow-up setelah event.

#### Acceptance Criteria

1. WHEN owner mengaktifkan fitur LeadCapture di AdminPanel, THE WelcomeScreen SHALL menampilkan form dengan field Nama (teks, wajib diisi, maks 80 karakter) dan Nomor HP (teks, opsional, maks 20 karakter).
2. THE WelcomeScreen SHALL menyediakan tombol "Lewati" sehingga customer yang tidak mau mengisi form dapat tetap masuk ke studio.
3. WHEN customer mengisi nama dan menekan tombol mulai, THE App SHALL menyimpan data lead ke IndexedDB dengan field: id, name, phone, timestamp, dan sessionId.
4. WHEN customer mengisi nama pada form LeadCapture, THE App SHALL menggunakan nama tersebut sebagai titleText pada strip foto.
5. THE AdminPanel SHALL menampilkan daftar semua data leads yang tersimpan di IndexedDB.
6. WHEN owner menekan tombol "Export CSV", THE AdminPanel SHALL menghasilkan file CSV berisi kolom Nama, Nomor HP, Waktu, Session ID dan memicu download ke browser.
7. IF nomor HP diisi dengan karakter selain angka, spasi, tanda plus, tanda minus, dan tanda kurung, THEN THE LeadCapture form SHALL menampilkan pesan validasi "Format nomor HP tidak valid".
8. THE App SHALL menyimpan status aktif atau nonaktif fitur LeadCapture ke IndexedDB melalui saveSettings.

---

### Requirement 5

**User Story:** Sebagai owner event korporat, saya ingin booth hanya bisa digunakan oleh tamu yang tahu kode PIN, sehingga booth tidak disalahgunakan di luar tamu undangan.

#### Acceptance Criteria

1. WHEN owner mengaktifkan fitur PIN di AdminPanel dan menyimpan PIN 4 hingga 6 digit, THE App SHALL menyimpan PIN yang di-hash menggunakan SHA-256 ke IndexedDB.
2. WHEN fitur PIN aktif dan customer membuka WelcomeScreen, THE App SHALL menampilkan layar input PIN sebelum form LeadCapture atau tombol mulai.
3. WHEN customer memasukkan PIN yang benar, THE App SHALL memberikan akses ke studio dan menyimpan status "terverifikasi" di sessionStorage untuk durasi tab tersebut.
4. WHEN customer memasukkan PIN yang salah, THE App SHALL menampilkan pesan "PIN salah, coba lagi" dan mengosongkan field input.
5. WHEN customer salah memasukkan PIN sebanyak 5 kali berturut-turut, THE App SHALL menampilkan cooldown 30 detik sebelum boleh mencoba lagi.
6. WHEN owner menonaktifkan fitur PIN di AdminPanel, THE App SHALL menghapus PIN yang tersimpan dan tidak lagi meminta PIN kepada customer.
7. THE AdminPanel SHALL menyediakan tombol ganti PIN yang meminta konfirmasi input PIN lama sebelum bisa menyimpan PIN baru.
8. IF browser tidak mendukung SubtleCrypto API, THEN THE App SHALL menggunakan fallback hashing sederhana dan menampilkan peringatan bahwa keamanan PIN terbatas.

---

### Requirement 6

**User Story:** Sebagai customer, saya ingin memindai QR code setelah sesi foto selesai untuk membuka link download foto langsung di HP saya, sehingga saya tidak perlu mengirim file secara manual.

#### Acceptance Criteria

1. WHEN session foto selesai dan strip PNG telah dirender, THE App SHALL menyimpan strip PNG sebagai data URL ke IndexedDB dengan key unik yang dapat direferensikan via URL.
2. THE CelebrationScreen SHALL menampilkan QR code berukuran minimal 120×120px dengan warna kontras tinggi yang berisi URL untuk mengakses strip foto tersebut.
3. WHEN customer memindai QR code dengan kamera HP, THE browser HP SHALL membuka halaman yang menampilkan strip foto beserta tombol unduh.
4. THE halaman delivery QR SHALL dapat diakses tanpa login dan menampilkan strip foto beserta tombol "Unduh Foto" dan nama event.
5. WHERE aplikasi berjalan di deployment publik, THE App SHALL menggunakan URL hash atau query parameter yang berisi referensi ke data foto agar link dapat dibuka di perangkat lain.
6. WHEN ukuran strip PNG melebihi 2MB, THE App SHALL mengurangi kualitas kompresi dan menampilkan peringatan "Foto dikompresi untuk QR delivery".
7. IF mekanisme URL foto tidak tersedia, THEN THE App SHALL menampilkan tombol "Salin Link" sebagai fallback dengan instruksi untuk membagikan secara manual.

---

### Requirement 7

**User Story:** Sebagai owner yang memasang booth di atas tablet stand, saya ingin mode layar penuh portrait yang bersih tanpa kontrol teknis, sehingga customer dapat menggunakannya secara mandiri dengan antarmuka yang sederhana.

#### Acceptance Criteria

1. THE AdminPanel SHALL menyediakan toggle untuk mengaktifkan dan menonaktifkan Kiosk Mode.
2. WHEN Kiosk Mode diaktifkan, THE App SHALL meminta browser masuk ke mode layar penuh melalui Fullscreen API.
3. WHILE Kiosk Mode aktif, THE App SHALL menyembunyikan Header navigation, Controls panel, tombol galeri, dan music player control.
4. WHILE Kiosk Mode aktif, THE App SHALL hanya menampilkan kamera preview, tombol mulai foto, countdown, celebration screen, dan tombol unduh serta reset.
5. WHEN customer tidak berinteraksi selama 60 detik setelah session selesai atau di welcome screen, THE App SHALL mereset secara otomatis ke WelcomeScreen.
6. WHEN App melakukan auto-reset ke WelcomeScreen di Kiosk Mode, THE App SHALL menghapus semua data session dari state lokal.
7. THE App SHALL menyimpan status Kiosk Mode ke IndexedDB agar persisten jika browser di-refresh.
8. WHEN owner ingin keluar dari Kiosk Mode, THE App SHALL menyediakan mekanisme tersembunyi berupa ketuk sudut layar 5 kali berturut-turut yang menampilkan dialog konfirmasi password AdminPanel.
9. IF Fullscreen API gagal dijalankan, THEN THE App SHALL tetap menampilkan Kiosk Mode dalam window biasa tanpa menampilkan error kepada customer.

---

### Requirement 8

**User Story:** Sebagai owner booth, saya ingin melihat statistik penggunaan booth secara lokal, sehingga saya dapat mengetahui seberapa ramai booth digunakan dan filter/frame apa yang paling populer.

#### Acceptance Criteria

1. THE App SHALL menyimpan data analytics untuk setiap session yang selesai ke IndexedDB dengan field: sessionId, timestamp, frameTheme, filter, layout, dan duration dalam detik.
2. THE AdminPanel SHALL menampilkan Analytics Dashboard dengan metrik total session hari ini, total session minggu ini, dan total session bulan ini.
3. THE Analytics Dashboard SHALL menampilkan daftar 5 frame theme yang paling sering digunakan beserta jumlah pemakaiannya.
4. THE Analytics Dashboard SHALL menampilkan daftar 5 filter yang paling sering digunakan beserta jumlah pemakaiannya.
5. THE Analytics Dashboard SHALL menampilkan heatmap jam 0 hingga 23 yang menunjukkan distribusi jumlah session per jam dalam periode yang dipilih.
6. THE Analytics Dashboard SHALL menyediakan selector periode: Hari Ini, 7 Hari Terakhir, dan 30 Hari Terakhir.
7. WHEN tidak ada data analytics tersimpan, THE Analytics Dashboard SHALL menampilkan pesan "Belum ada data. Mulai sesi foto untuk mengumpulkan statistik."
8. THE Analytics Dashboard SHALL mengambil data hanya dari IndexedDB lokal tanpa koneksi ke server eksternal.

---

### Requirement 9

**User Story:** Sebagai owner booth, saya ingin panel pengaturan yang dilindungi password, sehingga saya dapat mengkonfigurasi booth tanpa risiko customer mengubah pengaturan secara tidak sengaja.

#### Acceptance Criteria

1. THE Header SHALL menyediakan mekanisme akses AdminPanel yang tidak mudah ditemukan customer, misalnya dengan mengetuk logo sebanyak 5 kali berturut-turut.
2. WHEN owner mengakses AdminPanel, THE App SHALL menampilkan dialog input password. Password default pertama kali adalah string "admin1234" dan dapat diubah oleh owner.
3. WHEN password benar dimasukkan, THE App SHALL memberikan akses ke AdminPanel dan menyimpan status admin terautentikasi di sessionStorage.
4. WHEN password salah dimasukkan 3 kali berturut-turut, THE App SHALL menerapkan cooldown 60 detik sebelum dapat mencoba lagi.
5. THE AdminPanel SHALL menyediakan toggle on/off untuk fitur: LeadCapture, PIN Event, Kiosk Mode, Watermark Branding, dan Browser Notification.
6. THE AdminPanel SHALL menyediakan pengaturan default session berupa frame theme default, filter default, dan countdown duration default.
7. THE AdminPanel SHALL menampilkan daftar semua session yang tersimpan beserta tanggal, tema, filter, dan tombol hapus per item.
8. WHEN owner menekan tombol "Hapus Semua Session", THE AdminPanel SHALL menampilkan dialog konfirmasi yang mencantumkan jumlah session yang akan dihapus sebelum menjalankan penghapusan.
9. THE AdminPanel SHALL menampilkan Analytics Dashboard sebagai tab atau bagian terpisah di dalam panel.
10. THE App SHALL menyimpan password AdminPanel yang di-hash SHA-256 dan semua konfigurasi admin ke IndexedDB.

---

### Requirement 10

**User Story:** Sebagai owner booth, saya ingin mengekspor semua foto dan data leads ke file yang dapat disimpan di luar browser, sehingga data tidak hilang jika browser di-clear atau perangkat berganti.

#### Acceptance Criteria

1. THE AdminPanel SHALL menyediakan tombol "Export Galeri ZIP" yang mengambil semua session dari IndexedDB dan menghasilkan file ZIP berisi semua file PNG strip foto.
2. WHEN export ZIP dilakukan, THE App SHALL memberi nama setiap file PNG dengan format: life4cuts-{tanggal}-{sessionId}.png.
3. THE AdminPanel SHALL menyediakan tombol "Export Leads CSV" yang menghasilkan file CSV dengan kolom Nama, Nomor HP, Waktu, dan Session ID.
4. WHEN tidak ada data leads tersimpan, THE App SHALL menampilkan pesan "Belum ada data leads untuk diekspor" dan menonaktifkan tombol Export Leads CSV.
5. THE AdminPanel SHALL menyediakan tombol "Import Backup" yang menerima file ZIP sebelumnya dan memulihkan semua session ke IndexedDB.
6. WHEN proses export atau import berjalan, THE App SHALL menampilkan progress indicator berupa spinner dan persentase penyelesaian.
7. IF ukuran total data galeri melebihi 50MB, THEN THE App SHALL menampilkan peringatan sebelum memulai proses export.
8. THE ZIP export SHALL menggunakan library kompresi yang berjalan di browser tanpa memerlukan server.

---

### Requirement 11

**User Story:** Sebagai owner event, saya ingin musik latar yang saya upload dapat fade in saat sesi foto dimulai dan fade out saat selesai, sehingga pengalaman customer terasa lebih sinematik dan profesional.

#### Acceptance Criteria

1. THE MusicPlayer SHALL mendukung upload file audio dalam format MP3, WAV, M4A, dan OGG dengan batas ukuran 20MB per file.
2. WHEN customer menekan tombol mulai session, THE MusicPlayer SHALL melakukan fade in volume dari 0 ke volume yang dikonfigurasi dalam durasi 1 detik.
3. WHEN session foto selesai setelah semua 4 jepretan, THE MusicPlayer SHALL melakukan fade out volume ke 0 dalam durasi 2 detik.
4. WHEN CelebrationScreen ditampilkan, THE MusicPlayer SHALL memainkan musik dengan volume 50% dari volume normal sebagai background celebration.
5. THE Controls SHALL menyediakan toggle "Fade In/Out Otomatis" yang dapat dinonaktifkan oleh owner.
6. WHEN toggle Fade dinonaktifkan, THE MusicPlayer SHALL mempertahankan volume konstan selama seluruh session.
7. THE MusicPlayer SHALL mempertahankan kompatibilitas penuh dengan fitur playlist dan preset track yang sudah ada.
8. IF file audio yang diupload tidak dapat diputar, THEN THE MusicPlayer SHALL menampilkan pesan "File audio tidak dapat diputar. Coba format lain." dan tidak mengubah track yang sedang aktif.

---

### Requirement 12

**User Story:** Sebagai customer, saya ingin bisa mengetik caption panjang yang otomatis membungkus ke baris berikutnya di strip foto, serta menggunakan template teks preset, sehingga foto terasa lebih personal dan ekspresif.

#### Acceptance Criteria

1. THE Controls SHALL menampilkan textarea yang mendukung multi-line dengan tampilan minimal 3 baris untuk input caption pada strip.
2. WHEN teks caption melebihi lebar strip pada canvas, THE canvasExporter SHALL membungkus teks ke baris berikutnya tanpa memotong kata di tengah.
3. THE Controls SHALL menyediakan minimal 6 template teks preset yang dapat dipilih dengan satu klik, antara lain: "Best Friends Forever 💖", "Squad Goals 📸", "Memories Made Here ✨", "Date Night 🌙", "Bestie Vibes Only 🎀", dan "Moment to Remember 🌸".
4. WHEN customer memilih template preset, THE textarea SHALL terisi dengan teks template yang dapat diedit lebih lanjut oleh customer.
5. THE canvasExporter SHALL merender caption multi-line dengan line height 1.4 kali ukuran font pada canvas strip.
6. WHEN jumlah baris teks caption melebihi 3 baris pada ukuran font yang dipilih, THE App SHALL menampilkan peringatan "Teks terlalu panjang, mungkin terpotong di strip".
7. THE DraggableOverlayLayer SHALL menampilkan caption multi-line dengan word wrap yang konsisten dengan hasil render canvasExporter.

---

### Requirement 13

**User Story:** Sebagai customer, saya ingin bisa mengulang foto tertentu langsung dari celebration screen tanpa menutup celebration, sehingga saya tidak kehilangan foto lain yang sudah bagus.

#### Acceptance Criteria

1. THE CelebrationScreen SHALL menampilkan tombol "Ulang" di bawah setiap thumbnail foto dalam grid preview.
2. WHEN customer menekan tombol "Ulang" pada foto ke-N di CelebrationScreen, THE App SHALL menampilkan overlay countdown retake di atas CelebrationScreen tanpa menutup atau mengganti halaman.
3. WHEN retake selesai, THE CelebrationScreen SHALL memperbarui thumbnail foto ke-N dengan foto hasil retake yang baru.
4. WHILE proses retake berlangsung, THE CelebrationScreen SHALL menonaktifkan semua tombol aksi lain seperti unduh, cetak, dan sesi baru.
5. WHEN retake selesai, THE CelebrationScreen SHALL mengaktifkan kembali semua tombol aksi.
6. THE CelebrationScreen SHALL menampilkan label "Baru" di atas thumbnail foto yang baru saja di-retake selama 3 detik.
7. IF kamera tidak dapat diakses saat tombol retake ditekan, THEN THE App SHALL menampilkan pesan "Aktifkan kamera untuk mengulang foto" dan membatalkan proses retake.

---

### Requirement 14

**User Story:** Sebagai customer, saya ingin mendapatkan pengingat untuk menyimpan foto setelah sesi selesai, sehingga saya tidak lupa mendownload atau menyimpan strip foto ke galeri.

#### Acceptance Criteria

1. WHEN CelebrationScreen ditampilkan dan foto belum disimpan ke galeri lokal, THE App SHALL menampilkan banner reminder in-app bertuliskan "Jangan lupa simpan ke galeri!" di bagian bawah CelebrationScreen.
2. WHEN customer menekan tombol simpan galeri dari CelebrationScreen, THE App SHALL menyembunyikan banner reminder tersebut.
3. THE AdminPanel SHALL menyediakan toggle "Browser Notification" yang meminta izin notifikasi dari browser saat pertama kali diaktifkan.
4. WHEN toggle Browser Notification aktif dan customer telah memberikan izin, THE App SHALL mengirimkan browser notification dengan judul "Life 4 Cuts" dan pesan "Strip fotomu sudah siap! Jangan lupa disimpan ya" setelah session selesai.
5. WHEN customer menolak izin browser notification, THE App SHALL menonaktifkan toggle Browser Notification secara otomatis dan tidak menampilkan error.
6. WHEN customer mencabut izin browser notification setelah sebelumnya memberikan izin, THE App SHALL menangani NotAllowedError dengan silent fail tanpa menampilkan error di layar.
7. THE App SHALL menyimpan preferensi toggle Browser Notification ke IndexedDB melalui saveSettings.
8. IF browser tidak mendukung Notification API, THEN THE App SHALL menyembunyikan toggle Browser Notification dan hanya mengandalkan reminder in-app.
