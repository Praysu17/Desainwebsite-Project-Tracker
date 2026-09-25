# DOKUMENTASI TEKNIS & PANDUAN PENGEMBANGAN
## SP Digital Agency Management & Invoicing Suite

Selamat datang di repositori resmi **Agency Management & Invoicing Suite**. Dokumen ini ditujukan bagi tim *software engineer*, *system administrator*, dan *product team* untuk memandu proses instalasi lokal, konfigurasi database cloud, pengaturan keamanan, dan deployment ke lingkungan produksi (*production*).

---

## 1. Spesifikasi Tumpukan Teknologi (Tech Stack)

* **Frontend Framework :** React 19 (TypeScript)
* **Build System :** Vite 6
* **Styling Engine :** Tailwind CSS v4
* **State Management :** React Context API (`AppContext.tsx`) dengan sinkronisasi multi-layer (Memory, LocalStorage, Firestore)
* **Icons & UI Assets :** Lucide React Icons
* **Database & Realtime Sync :** Google Cloud Firestore (NoSQL Document Store)
* **Authentication Engine :** Firebase Auth (Google OAuth 2.0 & Custom Encrypted Multi-Device Credentials)
* **Export Engine :** Native HTML5 Canvas / PDF Generation Engine

---

## 2. Struktur Direktori Proyek (Project Structure)

```text
├── public/                 # Aset statis publik (logo SVG, icon, manifest)
├── src/
│   ├── components/         # Komponen antarmuka (UI Views & Modals)
│   │   ├── ClientsView.tsx        # Manajemen Database Klien & LTV
│   │   ├── DashboardOverview.tsx  # Ringkasan KPI, Statistik, & Proyek Berjalan
│   │   ├── FinanceView.tsx        # Pembukuan Pemasukan, Pengeluaran & Laba
│   │   ├── InvoicesView.tsx       # Invoice Generator, WhatsApp & Status Bayar
│   │   ├── LoginPage.tsx          # Autentikasi Pengguna & Penegakan 2-Device Limit
│   │   ├── Navigation.tsx         # Sidebar Responsif & Akses Menu
│   │   ├── ProjectsView.tsx       # Kanban & Pelacakan Proyek
│   │   ├── ProposalsView.tsx      # Proposal Generator & Tanda Tangan Digital
│   │   ├── PublicInvoiceView.tsx  # Tautan Publik Invoice Klien (Shareable Link)
│   │   ├── PublicProposalView.tsx # Tautan Publik Proposal Klien (Shareable Link)
│   │   ├── ReportsView.tsx        # Laporan Finansial & Bagi Hasil (Split Profit)
│   │   ├── SettingsView.tsx       # Pengaturan Agensi, Rekening & Anggota Tim
│   │   └── UserProfileModal.tsx   # Profil Akun & Pengelolaan Sesi Perangkat
│   ├── context/
│   │   └── AppContext.tsx  # Core Business Logic & State Provider
│   ├── data/
│   │   └── seedData.ts     # Struktur data bawaan (Clean Template)
│   ├── firebase.ts         # Inisialisasi Firebase SDK (Auth & Firestore)
│   ├── types.ts            # Definisi Interface & Tipe Data TypeScript
│   └── utils/
│       ├── deviceHelper.ts # Fingerprinting & Logika Pembatasan 2 Perangkat
│       └── imageUtils.ts   # Kompresi & Upload Gambar Klien/Logo
├── firestore.rules         # Aturan Keamanan Database Cloud Firestore
├── firebase-applet-config.json # Konfigurasi Kredensial Firebase
├── package.json            # Daftar Dependensi & Script
└── tsconfig.json           # Konfigurasi TypeScript Compiler
```

---

## 3. Langkah Instalasi Lingkungan Lokal (Local Development)

### Prasyarat Sistem:
* Node.js versi 18.0.0 atau lebih tinggi (disarankan Node.js LTS v20+)
* Paket manajer `npm` atau `yarn` / `pnpm`

### Langkah-langkah:
1. **Clone Repositori :**
   ```bash
   git clone <URL_REPOSITORI_ANDA>
   cd agency-management-suite
   ```

2. **Instalasi Seluruh Dependensi :**
   ```bash
   npm install
   ```

3. **Jalankan Server Development :**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000` (atau port yang ditentukan Vite).

4. **Validasi Tipe Data & Linting :**
   ```bash
   npm run lint
   ```

5. **Build untuk Produksi :**
   ```bash
   npm run build
   ```
   Hasil build siap saji akan tercipta di direktori `dist/`.

---

## 4. Konfigurasi Basis Data Firebase (Setup Database Baru)

Jika Anda ingin menghubungkan aplikasi ke project Firebase baru milik perusahaan Anda:

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru.
2. Aktifkan produk berikut:
   * **Authentication :** Aktifkan penyedia *Email/Password* dan *Google Sign-In*.
   * **Cloud Firestore :** Buat database dalam mode *Production*.
3. Buka **Project Settings** -> **General** -> **Your Apps** -> Tambahkan Web App.
4. Salin konfigurasi kredensial Firebase Anda ke berkas `firebase-applet-config.json` atau sesuaikan pada berkas `src/firebase.ts`:
   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "projek-anda.firebaseapp.com",
     "projectId": "projek-anda",
     "storageBucket": "projek-anda.appspot.com",
     "messagingSenderId": "...",
     "appId": "..."
   }
   ```
5. **Deploy Security Rules :**
   Pastikan menerapkan aturan `firestore.rules` agar data agensi terlindungi:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 5. Logika Bisnis & Fitur Khusus

### A. Mekanisme Multi-Device Limit (Maksimal 2 Perangkat Aktif)
* Terletak pada `src/utils/deviceHelper.ts` dan diatur secara otomatis di `src/context/AppContext.tsx`.
* Setiap sesi login menghasilkan `deviceId` unik berbasis *browser fingerprinting*.
* Setiap akun pengguna dibatasi maksimal 2 sesi perangkat aktif. Jika login di perangkat ke-3, sistem akan:
  1. Menampilkan notifikasi bahwa kuota 2 perangkat telah tercapai.
  2. Memberikan opsi kepada pengguna untuk memutuskan sesi perangkat lama secara mandiri.
* Administrator/Owner dapat memutuskan sesi perangkat anggota tim secara paksa melalui tab **Pengaturan -> Anggota Tim -> Sesi Perangkat**.

### B. Link Publik Proposal & Invoice Interaktif
* Rute `/share/proposal/:token` dan `/share/invoice/:token` dapat diakses oleh klien luar tanpa harus memiliki akun.
* Ketika klien mengklik tombol **"Terima Proposal"**, status proposal otomatis berubah menjadi disetujui (*Approved*), proyek baru otomatis terbuat, dan invoice uang muka (DP) otomatis diterbitkan.

### C. Alur Automasi Pesan WhatsApp
* Template pesan diformat secara dinamis pada `src/components/InvoicesView.tsx` dan `src/components/ProposalsView.tsx` menggunakan format `https://wa.me/{nomor}?text={pesan_terenkripsi_uri}`.
* Mengisi otomatis nama klien, nomor invoice/proposal, rincian nominal, tanggal jatuh tempo, dan link web publik.

---

## 6. Panduan Deployment ke Lingkungan Produksi (Production Deployment)

### Opsi A: Deployment ke Vercel (Paling Cepat & Gratis)
1. Hubungkan repositori GitHub ke akun [Vercel](https://vercel.com).
2. Framework preset akan terdeteksi otomatis sebagai **Vite**.
3. *Build Command :* `npm run build`
4. *Output Directory :* `dist`
5. Untuk menangani routing SPA (Single Page Application), pastikan menambahkan file `vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### Opsi B: Deployment ke Firebase Hosting
1. Pasang Firebase CLI: `npm install -g firebase-tools`
2. Jalankan `firebase login` dan `firebase init hosting`.
3. Tentukan direktori publik: `dist`.
4. Konfigurasikan sebagai Single-Page App (SPA): `Yes`.
5. Eksekusi deployment:
   ```bash
   npm run build && firebase deploy --only hosting
   ```

---

## 7. Pemeliharaan & Kustomisasi Mandiri

* **Mengubah Branding Utama :** Buka menu **Pengaturan Agensi** langsung dari aplikasi saat login sebagai Owner/Admin, atau modifikasi nilai awal di `src/data/seedData.ts`.
* **Menambah Kategori Biaya / Role Akses :** Sesuaikan pada `src/types.ts` dan form dropdown terkait.

---
*Dokumentasi ini disiapkan secara resmi sebagai bagian dari paket serah terima Full Source Code Buyout.*
