# Implementation Plan: Photobooth Enhancement

## Overview

Rencana implementasi ini mencakup 14 fitur baru untuk aplikasi **Life 4 Cuts** (React + Vite) secara inkremental. Urutan task mengikuti dependency: fondasi data (IndexedDB v2) → infrastruktur (testing, deps) → Core Experience → Event Ready → Owner Tools → Polish. Setiap task merujuk ke requirement spesifik agar dapat di-trace.

---

## Tasks

### Fase 0 — Fondasi & Infrastruktur

- [x] 1. Upgrade IndexedDB schema ke v2 dan install dependency baru
  - [x] 1.1 Upgrade `db.js` — tambah store `leadCaptures` dan `adminConfig`, bump `DB_VERSION` ke 2
    - Tambah `onupgradeneeded` handler yang idempotent (cek `objectStoreNames.contains` sebelum buat store baru)
    - Store `leadCaptures`: keyPath `id`, index `sessionId` dan `date`
    - Store `adminConfig`: keyPath `key`
    - Tambah fungsi CRUD: `saveLead`, `getLeads`, `deleteLead`, `saveAdminConfig`, `loadAdminConfig`
    - Tambah fungsi helper `saveSetting(key, value)` dan `loadSetting(key)` untuk single-key access ke `userSettings`
    - Pastikan store existing (`photoSessions`, `musicPlaylist`, `userSettings`) tidak terpengaruh upgrade
    - _Requirements: 4.4, 5.6, 7.7, 8.1, 9.8_

  - [x] 1.2 Install jszip dan setup testing framework
    - Jalankan `npm install jszip`
    - Jalankan `npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom fast-check @fast-check/vitest jsdom`
    - Update `vite.config.js` — tambah blok `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/__tests__/setup.ts'] }`
    - Buat file `src/__tests__/setup.ts` — import `@testing-library/jest-dom`
    - Tambah script `"test": "vitest --run"` dan `"test:watch": "vitest"` ke `package.json`
    - Buat struktur direktori: `src/__tests__/unit/`, `src/__tests__/properties/`, `src/__tests__/integration/`
    - _Requirements: (testing infrastructure untuk semua fitur)_

  - [ ]* 1.3 Tulis unit test untuk db.js v2
    - Test `saveLead` / `getLeads` / `deleteLead` — CRUD leads
    - Test `saveAdminConfig` / `loadAdminConfig` — config persistence
    - Test edge case: upgrade dari v1 ke v2 tidak merusak store existing
    - Gunakan `fake-indexeddb` atau mock indexedDB
    - _Requirements: 4.4, 5.6, 9.8_

- [ ] 2. Checkpoint awal
  - Pastikan `npm run build` berjalan tanpa error setelah upgrade schema dan install deps.

---

### Fase 1 — Core Experience

- [x] 3. Fitur 1: Mobile Responsive Layout
  - [x] 3.1 Tambah CSS media queries untuk layout satu kolom di `src/index.css`
    - Breakpoint `< 768px`: ubah `.studio-layout` ke `flex-direction: column`
    - Sembunyikan `.studio-right` (strip preview besar) di mobile; tampilkan inline di bawah camera
    - Pastikan semua touch target (tombol, pill, toggle) minimal `44px × 44px`
    - Sembunyikan header non-essential dan footer saat mobile
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 3.2 Implementasi bottom sheet / tab navigation untuk Controls di mobile
    - Bungkus `Controls` di `BottomSheet.jsx` yang muncul slide-up dari bawah pada mobile
    - Tab navigation: Layout | Filter | Frame | Extras
    - Pada desktop, Controls tetap render inline seperti semula
    - Update `App.jsx` untuk render `BottomSheet` saat `window.innerWidth < 768`
    - _Requirements: 1.2, 1.5_

  - [ ] 3.3 Responsif tablet landscape (768px–1024px)
    - Tambah CSS breakpoint `768px–1024px` — two-column layout proporsional
    - Test layout di viewport 768, 900, dan 1024px
    - _Requirements: 1.6_

---

- [x] 4. Fitur 2: Pose Gap (Jeda Antar Foto)
  - [x] 4.1 Tambah prop `poseGapSeconds` ke `CameraView.jsx` dan modifikasi `startStudioSession`
    - Terima prop `poseGapSeconds: 2 | 3 | 5` (default `3`)
    - Setelah setiap shot kecuali terakhir: set state `isPoseGap = true`, tampilkan overlay "Siap pose berikutnya! ✨", tunggu `poseGapSeconds * 1000` ms, lalu `isPoseGap = false`
    - Tambah progress bar countdown PoseGap yang visible selama jeda
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 4.2 Tambah PoseGap selector di `Controls.jsx` dan wiring ke `App.jsx`
    - Tambah state `poseGapSeconds` di `App.jsx`, default `3`
    - Tambah section "⏸️ Jeda Antar Pose" di Controls dengan pill selector: 2s / 3s / 5s
    - Pass `poseGapSeconds` sebagai prop ke `CameraView`
    - Auto-save ke IndexedDB via `saveSetting('poseGapSeconds', value)` saat berubah
    - Load dari IndexedDB saat app mount
    - _Requirements: 2.1, 2.5_

  - [ ]* 4.3 Tulis property test P1: Persistensi PoseGap round trip
    - File: `src/__tests__/properties/db.property.test.ts`
    - Generator: `fc.constantFrom(2, 3, 5)`
    - **Property 1: Persistensi PoseGap — Round Trip**
    - **Validates: Requirements 2.5**

  - [ ]* 4.4 Tulis property test P2: PoseGap overlay timing
    - File: `src/__tests__/properties/cameraView.property.test.ts`
    - Generator: `fc.constantFrom(2, 3, 5)` + fake timers (Vitest `vi.useFakeTimers`)
    - **Property 2: Overlay PoseGap Ditampilkan Selama Durasi yang Dikonfigurasi**
    - **Validates: Requirements 2.2, 2.4**

---

- [x] 5. Fitur 3: Watermark Branding
  - [x] 5.1 Extend `canvasExporter.js` — tambah parameter `watermarkText` dan `watermarkOpacity`
    - Tambah Step 14 di `renderAllAndResolve`: render teks watermark di pojok kanan bawah canvas
    - Implementasi `wrapText` helper jika teks watermark panjang
    - Watermark tidak dirender jika `watermarkText` kosong atau `watermarkOpacity === 0`
    - _Requirements: 3.2, 3.4_

  - [x] 5.2 Extend `gifExporter.js` — pass watermark params ke canvasExporter
    - Tambah `watermarkText` dan `watermarkOpacity` ke options yang diteruskan ke `drawPhotoStripToCanvas`
    - _Requirements: 3.2_

  - [ ] 5.3 Tambah Watermark controls di `Controls.jsx` dan wiring ke `App.jsx`
    - Tambah section "🏷️ Watermark Studio" di Controls
    - Field teks watermark (input text, placeholder "Nama studio / Instagram...")
    - Slider opacity 0–100
    - Tambah state `watermarkText` dan `watermarkOpacity` di `App.jsx`
    - Pass ke `Controls`, `canvasExporter`, dan `gifExporter` di semua call site
    - Auto-save ke IndexedDB; load saat mount
    - _Requirements: 3.1, 3.3, 3.5_

  - [ ] 5.4 Tambah pratinjau watermark real-time di `PhotoStripPreview`
    - Render teks watermark overlay di pojok kanan bawah `PhotoStripPreview` secara live
    - Gunakan CSS absolute positioning agar tidak mempengaruhi canvas export
    - _Requirements: 3.6_

  - [ ]* 5.5 Tulis property test P3: Watermark dirender saat opacity > 0
    - File: `src/__tests__/properties/canvasExporter.property.test.ts`
    - Generator: `fc.string({ minLength: 1 })`, `fc.float({ min: 0.01, max: 1 })`
    - **Property 3: Watermark Muncul di Pojok Kanan Bawah Strip**
    - **Validates: Requirements 3.2**

  - [ ]* 5.6 Tulis property test P4: Watermark config round trip
    - File: `src/__tests__/properties/db.property.test.ts`
    - Generator: `fc.string()`, `fc.float({ min: 0, max: 1 })`
    - **Property 4: Persistensi Konfigurasi Watermark — Round Trip**
    - **Validates: Requirements 3.5**

- [x] 6. Checkpoint Fase 1
  - Pastikan semua tests pass, `npm run build` sukses. Tanyakan ke user jika ada pertanyaan.

---

### Fase 2 — Event Ready

- [ ] 7. Fitur 5: PIN Event / Kode Akses *(dibuat sebelum Lead Capture karena jadi gatekeeper)*
  - [ ] 7.1 Buat komponen `PinGateScreen.jsx`
    - Props: `onSuccess: () => void`, `onAdminAccess?: () => void`
    - State internal: `pinInput: string`, `error: string | null`, `attempts: number`
    - Input PIN numerik (maxLength 6) dengan keyboard virtual-friendly
    - Tombol "Masuk" — validasi PIN, panggil `onSuccess` jika benar, tampilkan error jika salah
    - Setelah 5 percobaan gagal: tampilkan pesan "Terlalu banyak percobaan, hubungi penyelenggara"
    - Tap logo 5 kali → panggil `onAdminAccess` (untuk akses admin tersembunyi)
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 7.2 Integrate `PinGateScreen` ke `WelcomeScreen.jsx`
    - `WelcomeScreen` terima prop `adminConfig` (dari App)
    - Jika `adminConfig.pinEventEnabled`: render `PinGateScreen` sebagai gatekeeper
    - Setelah PIN berhasil: render konten WelcomeScreen normal
    - Redirect ke PIN gate jika Customer mencoba akses Studio tanpa PIN
    - _Requirements: 5.3, 5.7_

  - [ ]* 7.3 Tulis property test P8: PIN gate selalu aktif saat dikonfigurasi
    - File: `src/__tests__/properties/welcomeScreen.property.test.ts`
    - **Property 8: PIN Gate Selalu Aktif Saat Dikonfigurasi**
    - **Validates: Requirements 5.3, 5.7**

  - [ ]* 7.4 Tulis property test P9: PIN benar buka akses, PIN salah tolak
    - File: `src/__tests__/properties/pinGateScreen.property.test.ts`
    - Generator: `fc.string({ minLength: 4, maxLength: 6 })`
    - **Property 9: PIN Benar Membuka Akses, PIN Salah Menolak**
    - **Validates: Requirements 5.4, 5.5**

  - [ ]* 7.5 Tulis property test P10: PIN config round trip
    - File: `src/__tests__/properties/db.property.test.ts`
    - Generator: `fc.string({ minLength: 4, maxLength: 6 })` + `fc.boolean()`
    - **Property 10: Persistensi Status dan Nilai PIN — Round Trip**
    - **Validates: Requirements 5.6**

---

- [x] 8. Fitur 4: Lead Capture (Pengumpulan Data Customer)
  - [x] 8.1 Buat komponen `LeadCaptureModal.jsx`
    - Props: `onSubmit: (lead: { name, phone }) => void`, `onSkip: () => void`
    - Form: field nama (required, maxLength 50) dan nomor HP (optional, maxLength 15)
    - Validasi: nama tidak boleh kosong, nomor HP hanya angka jika diisi
    - Tombol "Lanjutkan" dan "Lewati"
    - Render sebagai modal overlay di atas WelcomeScreen
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Integrate `LeadCaptureModal` ke `WelcomeScreen.jsx` dan `App.jsx`
    - Setelah PIN gate (jika aktif): tampilkan `LeadCaptureModal` jika `adminConfig.leadCaptureEnabled`
    - Saat submit: pass nama ke `onStart` — `App.jsx` gunakan sebagai `titleText`
    - Saat skip: lanjutkan dengan `titleText` default
    - _Requirements: 4.1, 4.3_

  - [x] 8.3 Simpan data lead ke IndexedDB saat sesi selesai
    - Di `App.jsx` `handleSessionComplete`: setelah `saveSession`, panggil `saveLead({ name, phone, sessionId, date })`
    - Hanya simpan jika lead data tersedia (Customer tidak skip)
    - _Requirements: 4.4_

  - [ ]* 8.4 Tulis property test P5: Nama Customer muncul di judul PhotoStrip
    - File: `src/__tests__/properties/canvasExporter.property.test.ts`
    - Generator: `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)`
    - **Property 5: Nama Customer Muncul di Judul PhotoStrip**
    - **Validates: Requirements 4.3**

  - [ ]* 8.5 Tulis property test P6: Lead data round trip
    - File: `src/__tests__/properties/db.property.test.ts`
    - Generator: `fc.record({ name: fc.string({ minLength: 1 }), phone: fc.string() })`
    - **Property 6: Persistensi Data Lead — Round Trip**
    - **Validates: Requirements 4.4**

---

- [x] 9. Fitur 7: Kiosk Mode (Portrait/Tablet)
  - [x] 9.1 Buat komponen `KioskIdleTimer.jsx`
    - Props: `idleMinutes: 1 | 3 | 5`, `enabled: boolean`, `onIdle: () => void`
    - Pasang event listeners: `mousemove`, `keydown`, `touchstart` pada `document`
    - Reset timer setiap kali ada interaksi; fire `onIdle` jika tidak ada interaksi selama `idleMinutes` menit
    - Cleanup event listeners saat unmount
    - _Requirements: 7.4_

  - [x] 9.2 Tambah Kiosk Mode layout dan logic di `App.jsx`
    - Tambah state `kioskMode: boolean` (loaded dari adminConfig)
    - Jika `kioskMode`: apply CSS class `kiosk-mode` ke `app-container`
    - CSS `kiosk-mode`: hide header, hide footer, layout portrait fullscreen
    - Render `KioskIdleTimer` dengan `onIdle={() => setScreen('welcome')}` saat kioskMode aktif
    - `CelebrationScreen` di kiosk: tampilkan tombol "Mulai Sesi Baru 🚀" yang prominent
    - _Requirements: 7.2, 7.4, 7.6_

  - [x] 9.3 Sembunyikan advanced controls saat Kiosk Mode di `Controls.jsx`
    - Terima prop `kioskMode: boolean`
    - Jika `kioskMode === true`: sembunyikan section AI Background, AR Props, doodle tools, upload frame PNG
    - Tampilkan hanya: Layout selector, Frame presets, Filter selector
    - _Requirements: 7.3_

  - [ ]* 9.4 Tulis property test P12: Advanced controls tersembunyi saat Kiosk Mode
    - File: `src/__tests__/properties/controls.property.test.ts`
    - **Property 12: Advanced Controls Tersembunyi Saat Kiosk Mode Aktif**
    - **Validates: Requirements 7.3**

  - [ ]* 9.5 Tulis property test P13: Idle timer reset ke WelcomeScreen
    - File: `src/__tests__/properties/kioskIdleTimer.property.test.ts`
    - Generator: `fc.constantFrom(1, 3, 5)` + `vi.useFakeTimers()`
    - **Property 13: Idle Timer Reset ke WelcomeScreen**
    - **Validates: Requirements 7.4**

  - [ ]* 9.6 Tulis property test P14: KioskMode config round trip
    - File: `src/__tests__/properties/db.property.test.ts`
    - Generator: `fc.record({ kioskModeEnabled: fc.boolean(), kioskIdleMinutes: fc.constantFrom(1, 3, 5) })`
    - **Property 14: Persistensi Konfigurasi KioskMode — Round Trip**
    - **Validates: Requirements 7.7**

---

- [x] 10. Fitur 6: QR Delivery ke HP
  - [x] 10.1 Extend `CelebrationScreen.jsx` — QR code delivery dari strip PNG
    - Generate QR code dari blob URL / data sementara di localStorage (`sessionStorage.setItem('pendingStrip', base64)`)
    - Jika data > 2MB (base64): tampilkan fallback message "File terlalu besar, gunakan tombol Unduh PNG"
    - QR code ukuran minimal 120×120px
    - Tampilkan teks instruksi "Scan QR ini dengan kamera HP kamu"
    - Pass `stripDataUrl` dari `App.jsx` ke `CelebrationScreen`
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_

  - [x] 10.2 Buat halaman `QrSharePage.jsx` dan route `/share`
    - Baca `sessionStorage.getItem('pendingStrip')` atau URL parameter `?data=`
    - Tampilkan preview strip foto + tombol "Unduh PNG"
    - Tampilkan error page jika data tidak valid / tidak ditemukan
    - Tambah route `/share` ke `main.jsx` (gunakan `window.location.pathname` check, tanpa React Router)
    - _Requirements: 6.3_

  - [ ]* 10.3 Tulis property test P11: QR code ukuran minimal 120px
    - File: `src/__tests__/properties/celebration.property.test.ts`
    - **Property 11: QR Code Memiliki Ukuran Minimal yang Diperlukan**
    - **Validates: Requirements 6.4**

- [x] 11. Checkpoint Fase 2
  - Pastikan semua tests pass, `npm run build` sukses. Tanyakan ke user jika ada pertanyaan.

---

### Fase 3 — Owner Tools

- [x] 12. Fitur 8: Analytics Dashboard
  - [x] 12.1 Buat `src/utils/analytics.js` — fungsi komputasi statistik
    - `computePeriodCounts(sessions, referenceDate)` → `{ today, last7, last30 }`
    - `computeTopUsed(sessions, field)` → string nilai yang paling sering muncul
    - `computeHourlyDistribution(sessions)` → `number[24]` (sum = total sesi)
    - `computeWeeklyDistribution(sessions)` → `number[7]` (sum = total sesi)
    - Semua fungsi murni (pure functions), tidak ada side effects
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 12.2 Buat komponen `AnalyticsDashboard.jsx`
    - Baca semua sesi dari IndexedDB via `getSessions()`
    - Render: card total sesi (hari ini / 7 hari / 30 hari), top theme badge, top filter badge
    - Render tabel distribusi per jam (0–23) dan per hari dalam seminggu
    - Tampilkan "Belum ada data sesi untuk periode ini" jika data kosong
    - Tidak ada request ke server eksternal
    - _Requirements: 8.1–8.7_

  - [ ]* 12.3 Tulis property test P15: Komputasi statistik sesi per periode selalu akurat
    - File: `src/__tests__/properties/analytics.property.test.ts`
    - Generator: `fc.array(fc.record({ date: fc.date(), theme: fc.string(), filter: fc.string() }))`
    - **Property 15: Komputasi Statistik Sesi per Periode Selalu Akurat**
    - **Validates: Requirements 8.1**

  - [ ]* 12.4 Tulis property test P16: Komputasi mode (theme dan filter terpopuler) selalu benar
    - File: `src/__tests__/properties/analytics.property.test.ts`
    - **Property 16: Komputasi Mode (Theme dan Filter Terpopuler) Selalu Benar**
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 12.5 Tulis property test P17: Distribusi hourly dan weekly mencakup semua sesi
    - File: `src/__tests__/properties/analytics.property.test.ts`
    - **Property 17: Distribusi Hourly dan Weekly Mencakup Semua Sesi**
    - **Validates: Requirements 8.4, 8.5**

---

- [x] 13. Fitur 9: Admin Panel
  - [x] 13.1 Buat komponen `AdminPanel.jsx` — shell dengan password auth
    - State internal: `isAuthenticated: boolean` (sync ke `sessionStorage`)
    - Saat mount: cek `sessionStorage.getItem('adminAuth')` — jika ada, skip form password
    - Form password: hash input dengan SHA-256 (`crypto.subtle.digest`), bandingkan dengan `adminConfig.passwordHash`
    - Password salah: tampilkan error, kosongkan field
    - Password benar: set `sessionStorage.adminAuth = 'true'`, set `isAuthenticated = true`
    - Akses: URL hash `#admin` ATAU tap logo 5 kali di Header
    - Render konten admin (tabs) hanya jika `isAuthenticated`
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 13.2 Tambah tab "Config" di AdminPanel — feature toggles dan defaults
    - Toggle: LeadCapture, PINEvent (+ field nilai PIN 4-6 digit), KioskMode (+ selector idle minutes), Watermark, QR Delivery
    - Field: Default Theme selector, Default Filter selector
    - Field: ganti password Admin (input current password + new password)
    - Tombol "Simpan Konfigurasi" → `saveAdminConfig(...)` ke IndexedDB
    - _Requirements: 9.1, 9.5, 9.6, 9.7, 9.8_

  - [x] 13.3 Tambah tab "Leads" di AdminPanel — tabel data lead
    - Baca semua leads dari IndexedDB, render tabel: Nama | Nomor HP | Tanggal | ID Sesi
    - Pagination atau virtual scroll jika leads > 50 baris
    - Tombol "Export CSV" (implementasi di task 14.2)
    - _Requirements: 4.5, 4.6_

  - [x] 13.4 Integrate AdminPanel ke `App.jsx` dan Header
    - Tambah `screen === 'admin'` ke routing di App
    - Tambah `onAdminOpen` handler di Header (tap logo 5 kali)
    - Load `adminConfig` dari IndexedDB saat app mount; pass ke semua komponen yang memerlukan
    - Pass `adminConfig` sebagai prop ke `WelcomeScreen`, `Controls`, `CameraView`, `CelebrationScreen`
    - _Requirements: 9.1_

  - [ ]* 13.5 Tulis property test P18: Admin panel selalu meminta password saat tidak terotentikasi
    - File: `src/__tests__/properties/adminPanel.property.test.ts`
    - **Property 18: Admin Panel Selalu Meminta Password Saat Tidak Terotentikasi**
    - **Validates: Requirements 9.2**

  - [ ]* 13.6 Tulis property test P19: Feature toggle mempengaruhi perilaku fitur
    - File: `src/__tests__/properties/adminPanel.property.test.ts`
    - Generator: `fc.boolean()` per flag
    - **Property 19: Feature Toggle Mempengaruhi Perilaku Fitur**
    - **Validates: Requirements 9.7**

---

- [x] 14. Fitur 10: Backup & Export
  - [x] 14.1 Buat `src/utils/backupExporter.js` — fungsi export ZIP dan JSON
    - `exportPhotosAsZip(sessions)`: gunakan JSZip, tambahkan setiap `session.stripPng` sebagai file dengan nama `life4cuts-{id_sesi}-{tanggal}.png`
    - `exportBackupJson(sessions, settings)`: serialize ke JSON, download sebagai `.json`
    - `importBackupJson(file)`: parse JSON, validasi struktur, merge ke IndexedDB via `saveSession` dan `saveSettings`
    - Error handling: skip foto gagal di ZIP, tampilkan warning "X foto gagal, Y berhasil"
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.7_

  - [ ] 14.2 Buat `src/utils/csvExporter.js` — fungsi export CSV leads
    - `exportLeadsAsCsv(leads)`: generate CSV dengan header `nama,nomor_hp,tanggal,jam,id_sesi`
    - Escape nilai CSV yang mengandung koma atau newline
    - Trigger download file `.csv`
    - _Requirements: 4.7, 10.3_

  - [x] 14.3 Tambah tab "Backup" di AdminPanel — UI export/import
    - Tombol "📦 Export Foto (ZIP)" → panggil `exportPhotosAsZip`, tampilkan loading indicator, nonaktifkan tombol saat proses
    - Tombol "📊 Export Data Lead (CSV)" → panggil `exportLeadsAsCsv`
    - Tombol "💾 Export Backup Lengkap (JSON)" → panggil `exportBackupJson`
    - Tombol "📥 Import / Restore Backup" → file input `.json` → panggil `importBackupJson`
    - Tampilkan pesan error deskriptif jika proses gagal
    - _Requirements: 10.1, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 14.4 Tulis property test P20: Nama file ZIP mengikuti format yang ditentukan
    - File: `src/__tests__/properties/backupExporter.property.test.ts`
    - **Property 20: Nama File ZIP Mengikuti Format yang Ditentukan**
    - **Validates: Requirements 10.2**

  - [ ]* 14.5 Tulis property test P21: Backup JSON round trip
    - File: `src/__tests__/properties/backupExporter.property.test.ts`
    - **Property 21: Backup JSON — Export lalu Import Memulihkan State Identik**
    - **Validates: Requirements 10.5**

  - [ ]* 14.6 Tulis property test P7: Kolom CSV lead selalu lengkap
    - File: `src/__tests__/properties/csvExporter.property.test.ts`
    - Generator: `fc.array(fc.record({ name: fc.string(), phone: fc.string(), date: fc.string(), sessionId: fc.string() }))`
    - **Property 7: Kolom CSV Lead Selalu Lengkap**
    - **Validates: Requirements 4.7, 10.3**

- [x] 15. Checkpoint Fase 3
  - Pastikan semua tests pass, `npm run build` sukses. Tanyakan ke user jika ada pertanyaan.

---

### Fase 4 — Polish

- [x] 16. Fitur 11: Musik Kustom (extend MusicPlayer)
  - [x] 16.1 Extend `MusicPlayer.jsx` — tambah upload file MP3
    - Tambah input `type="file" accept="audio/mp3,audio/*"` tersembunyi
    - Validasi sebelum `FileReader.readAsDataURL`: cek MIME type (`audio/mpeg` atau `audio/mp3`) DAN ukuran (max 10MB)
    - File invalid: tampilkan error "Format harus MP3 dan ukuran maksimal 10MB", jangan proses
    - File valid: simpan `audioDataUrl` ke IndexedDB via `saveToPlaylist({ title: filename, audioDataUrl })`
    - Tampilkan nama file sebagai konfirmasi
    - Tombol hapus lagu kustom
    - Kontrol volume slider (0–100)
    - _Requirements: 11.1, 11.2, 11.5, 11.6, 11.7_

  - [x] 16.2 Tambah fade-in/fade-out audio saat sesi dimulai/selesai
    - Di `CameraView.jsx`: saat `startStudioSession` dipanggil, emit event atau panggil callback `onSessionStart` ke App
    - Di `App.jsx`: saat sesi dimulai, panggil `musicPlayer.fadeIn(1000)`; saat selesai `musicPlayer.fadeOut(1000)`
    - Implementasi `fadeIn(duration)` dan `fadeOut(duration)` di MusicPlayer via `audioRef.volume` lerp
    - _Requirements: 11.3, 11.4_

  - [ ]* 16.3 Tulis property test P22: File musik invalid selalu ditolak
    - File: `src/__tests__/properties/music.property.test.ts`
    - Generator: `fc.record({ size: fc.integer({ min: 0 }), type: fc.string() })`
    - **Property 22: Validasi File Musik — File Invalid Selalu Ditolak**
    - **Validates: Requirements 11.6**

---

- [ ] 17. Fitur 12: Multi-line Caption
  - [ ] 17.1 Tambah multi-line caption textarea dan preset di `Controls.jsx`
    - Ganti/tambah section "📝 Caption Multi-baris" dengan `<textarea>` (bukan `<input>`)
    - `maxLength={200}`, `rows={3}`
    - Karakter counter: tampilkan `{length}/200`, update real-time
    - 5 preset buttons: "Best Friends Forever 💖", "Squad Goals 🔥", "Memories 2026 ✨", "Bestie Vibes 🌸", "Party Time 🎉"
    - Klik preset: isi textarea dengan teks preset (dapat diedit lanjut)
    - State `captionText` di `App.jsx`, auto-save ke IndexedDB
    - _Requirements: 12.1, 12.3, 12.4, 12.5_

  - [x] 17.2 Extend `canvasExporter.js` — implementasi word-wrap untuk multi-line caption
    - Tambah fungsi `wrapText(ctx, text, maxWidth, lineHeight)` → return `string[]`
    - Pada Step 12 (placedCaptions), gunakan `wrapText` untuk caption panjang
    - Tambah parameter `captionText` dan `captionLineHeight` ke `drawPhotoStripToCanvas`
    - Render caption multi-baris di area footer strip dengan `lineHeight` yang terbaca
    - _Requirements: 12.2, 12.6_

  - [ ]* 17.3 Tulis property test P23: Word-wrap caption tidak memotong teks
    - File: `src/__tests__/properties/canvasExporter.property.test.ts`
    - Generator: `fc.string({ minLength: 50, maxLength: 200 })`
    - **Property 23: Word-Wrap Caption Tidak Memotong Teks**
    - **Validates: Requirements 12.2, 12.6**

  - [ ]* 17.4 Tulis property test P24: Penghitung karakter caption selalu akurat
    - File: `src/__tests__/properties/controls.property.test.ts`
    - Generator: `fc.string({ maxLength: 200 })`
    - **Property 24: Penghitung Karakter Caption Selalu Akurat**
    - **Validates: Requirements 12.5**

---

- [x] 18. Fitur 13: Retake dari Celebration Screen
  - [x] 18.1 Extend `CelebrationScreen.jsx` — tambah tombol "Ulang" per foto
    - Terima prop baru `onRetakePhoto: (index: number) => void`
    - Tambah tombol "🔄 Ulang" di setiap thumbnail foto di `celebration-photos`
    - Touch target minimal 44×44px
    - _Requirements: 13.1, 13.5_

  - [x] 18.2 Implementasi retake flow di `App.jsx`
    - Saat `onRetakePhoto(N)` dipanggil dari CelebrationScreen:
      1. `setShowCelebration(false)`
      2. Set state `retakingIndex: number | null = N`
      3. Render studio view dengan indikator "Mengambil ulang foto #N"
      4. Panggil `cameraRef.current.retakeSingleShot(N)`
      5. Setelah selesai: tunggu sebentar, lalu `setShowCelebration(true)` + `setRetakingIndex(null)`
    - _Requirements: 13.2, 13.3, 13.4_

  - [ ]* 18.3 Tulis property test P25: Retake foto ke-N hanya mengubah foto ke-N
    - File: `src/__tests__/properties/celebration.property.test.ts`
    - Generator: `fc.integer({ min: 0, max: 3 })`
    - **Property 25: Retake Foto ke-N Hanya Mengubah Foto ke-N**
    - **Validates: Requirements 13.2, 13.3**

---

- [x] 19. Fitur 14: Notifikasi / Reminder Simpan Foto
  - [x] 19.1 Tambah reminder inline dan timer di `CelebrationScreen.jsx`
    - Tampilkan pesan "Jangan lupa simpan foto ke galeri! 💾" saat mount (selalu visible)
    - `useEffect` dengan `setTimeout(30000)`: setelah 30 detik tanpa klik download/save, tampilkan reminder kedua dengan animasi pulse atau highlight warna
    - Pass callback `onDownloadOrSave` agar CelebrationScreen dapat reset timer reminder saat aksi dilakukan
    - _Requirements: 14.1, 14.2_

  - [x] 19.2 Tambah toggle Web Notifications API di `CelebrationScreen.jsx`
    - Cek `typeof Notification !== 'undefined'` sebelum render toggle
    - Toggle "🔔 Aktifkan notifikasi browser" — hanya muncul jika API tersedia
    - Saat toggle diaktifkan: panggil `Notification.requestPermission()`
    - Jika izin diberikan: kirim notification "Foto kamu sudah siap! Tap untuk menyimpan."
    - Jika ditolak: jangan tampilkan permintaan lagi dalam sesi yang sama (gunakan ref flag)
    - Jika API tidak tersedia: sembunyikan toggle, hanya tampilkan reminder inline
    - _Requirements: 14.3, 14.4, 14.5, 14.6_

- [x] 20. Checkpoint Final
  - Pastikan semua tests pass (`npm run test`), `npm run build` sukses. Tanyakan ke user jika ada pertanyaan.

---

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task merujuk ke requirement spesifik untuk traceability
- Checkpoint memastikan validasi inkremental setelah setiap fase
- Semua state global tetap di `App.jsx` — tidak ada Redux atau Context API baru
- IndexedDB adalah satu-satunya persistent storage (tidak ada backend baru)
- `jszip` adalah satu-satunya dependency baru di production; `vitest`, `fast-check`, dll hanya di devDependencies
- Property tests menggunakan `@fast-check/vitest` dengan minimum 100 iterasi per property
- Setiap property test harus mencocokkan nomor property dan requirement yang tercantum di design.md

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "4.1", "5.1"] },
    { "id": 3, "tasks": ["4.2", "5.2", "5.3", "7.1"] },
    { "id": 4, "tasks": ["4.3", "4.4", "5.4", "5.5", "5.6", "7.2", "8.1"] },
    { "id": 5, "tasks": ["7.3", "7.4", "7.5", "8.2", "8.3", "9.1"] },
    { "id": 6, "tasks": ["8.4", "8.5", "9.2", "9.3", "10.1"] },
    { "id": 7, "tasks": ["9.4", "9.5", "9.6", "10.2", "10.3", "12.1"] },
    { "id": 8, "tasks": ["12.2", "12.3", "12.4", "12.5", "13.1", "14.1"] },
    { "id": 9, "tasks": ["13.2", "13.3", "13.4", "14.2", "14.3"] },
    { "id": 10, "tasks": ["13.5", "13.6", "14.4", "14.5", "14.6", "16.1"] },
    { "id": 11, "tasks": ["16.2", "17.1", "18.1"] },
    { "id": 12, "tasks": ["16.3", "17.2", "18.2", "19.1"] },
    { "id": 13, "tasks": ["17.3", "17.4", "18.3", "19.2"] }
  ]
}
```
