import React, { useState } from 'react';
import { Download, FileText, Check, Copy, Printer, ExternalLink, ShieldCheck, Terminal, BookOpen } from 'lucide-react';

const DOC_3_CONTENT = `# DOKUMENTASI TEKNIS & PANDUAN PENGEMBANGAN
## SP Digital Agency Management & Invoicing Suite

Selamat datang di repositori resmi **Agency Management & Invoicing Suite**. Dokumen ini ditujukan bagi tim *software engineer*, *system administrator*, dan *product team* untuk memandu proses instalasi lokal, konfigurasi database cloud, pengaturan keamanan, dan deployment ke lingkungan produksi (*production*).

---

## 1. Spesifikasi Tumpukan Teknologi (Tech Stack)

* **Frontend Framework :** React 19 (TypeScript)
* **Build System :** Vite 6
* **Styling Engine :** Tailwind CSS v4
* **State Management :** React Context API (AppContext.tsx) dengan sinkronisasi multi-layer (Memory, LocalStorage, Firestore)
* **Icons & UI Assets :** Lucide React Icons
* **Database & Realtime Sync :** Google Cloud Firestore (NoSQL Document Store)
* **Authentication Engine :** Firebase Auth (Google OAuth 2.0 & Custom Encrypted Multi-Device Credentials)
* **Export Engine :** Native HTML5 Canvas / PDF Generation Engine

---

## 2. Struktur Direktori Proyek (Project Structure)

\`\`\`text
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
\`\`\`

---

## 3. Langkah Instalasi Lingkungan Lokal (Local Development)

### Prasyarat Sistem:
* Node.js versi 18.0.0 atau lebih tinggi (disarankan Node.js LTS v20+)
* Paket manajer npm atau yarn / pnpm

### Langkah-langkah:
1. **Clone Repositori :**
   \`\`\`bash
   git clone <URL_REPOSITORI_ANDA>
   cd agency-management-suite
   \`\`\`

2. **Instalasi Seluruh Dependensi :**
   \`\`\`bash
   npm install
   \`\`\`

3. **Jalankan Server Development :**
   \`\`\`bash
   npm run dev
   \`\`\`
   Aplikasi akan berjalan di http://localhost:3000 (atau port yang ditentukan Vite).

4. **Validasi Tipe Data & Linting :**
   \`\`\`bash
   npm run lint
   \`\`\`

5. **Build untuk Produksi :**
   \`\`\`bash
   npm run build
   \`\`\`
   Hasil build siap saji akan tercipta di direktori dist/.

---

## 4. Konfigurasi Basis Data Firebase (Setup Database Baru)

Jika Anda ingin menghubungkan aplikasi ke project Firebase baru milik perusahaan Anda:

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru.
2. Aktifkan produk berikut:
   * **Authentication :** Aktifkan penyedia Email/Password dan Google Sign-In.
   * **Cloud Firestore :** Buat database dalam mode Production.
3. Buka **Project Settings** -> **General** -> **Your Apps** -> Tambahkan Web App.
4. Salin konfigurasi kredensial Firebase Anda ke berkas firebase-applet-config.json atau sesuaikan pada berkas src/firebase.ts:
   \`\`\`json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "projek-anda.firebaseapp.com",
     "projectId": "projek-anda",
     "storageBucket": "projek-anda.appspot.com",
     "messagingSenderId": "...",
     "appId": "..."
   }
   \`\`\`
5. **Deploy Security Rules :**
   Pastikan menerapkan aturan firestore.rules agar data agensi terlindungi:
   \`\`\`bash
   firebase deploy --only firestore:rules
   \`\`\`

---

## 5. Logika Bisnis & Fitur Khusus

### A. Mekanisme Multi-Device Limit (Maksimal 2 Perangkat Aktif)
* Terletak pada src/utils/deviceHelper.ts dan diatur secara otomatis di src/context/AppContext.tsx.
* Setiap sesi login menghasilkan deviceId unik berbasis browser fingerprinting.
* Setiap akun pengguna dibatasi maksimal 2 sesi perangkat aktif. Jika login di perangkat ke-3, sistem akan:
  1. Menampilkan notifikasi bahwa kuota 2 perangkat telah tercapai.
  2. Memberikan opsi kepada pengguna untuk memutuskan sesi perangkat lama secara mandiri.
* Administrator/Owner dapat memutuskan sesi perangkat anggota tim secara paksa melalui tab Pengaturan -> Anggota Tim -> Sesi Perangkat.

### B. Link Publik Proposal & Invoice Interaktif
* Rute /share/proposal/:token dan /share/invoice/:token dapat diakses oleh klien luar tanpa harus memiliki akun.
* Ketika klien mengklik tombol "Terima Proposal", status proposal otomatis berubah menjadi disetujui (Approved), proyek baru otomatis terbuat, dan invoice uang muka (DP) otomatis diterbitkan.

### C. Alur Automasi Pesan WhatsApp
* Template pesan diformat secara dinamis pada src/components/InvoicesView.tsx dan src/components/ProposalsView.tsx menggunakan format https://wa.me/{nomor}?text={pesan_terenkripsi_uri}.
* Mengisi otomatis nama klien, nomor invoice/proposal, rincian nominal, tanggal jatuh tempo, dan link web publik.

---

## 6. Panduan Deployment ke Lingkungan Produksi (Production Deployment)

### Opsi A: Deployment ke Vercel (Paling Cepat & Gratis)
1. Hubungkan repositori GitHub ke akun Vercel.
2. Framework preset akan terdeteksi otomatis sebagai Vite.
3. Build Command : npm run build
4. Output Directory : dist
5. Untuk menangani routing SPA (Single Page Application), pastikan menambahkan file vercel.json:
   \`\`\`json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   \`\`\`

### Opsi B: Deployment ke Firebase Hosting
1. Pasang Firebase CLI: npm install -g firebase-tools
2. Jalankan firebase login dan firebase init hosting.
3. Tentukan direktori publik: dist.
4. Konfigurasikan sebagai Single-Page App (SPA): Yes.
5. Eksekusi deployment:
   \`\`\`bash
   npm run build && firebase deploy --only hosting
   \`\`\`

---

## 7. Pemeliharaan & Kustomisasi Mandiri

* **Mengubah Branding Utama :** Buka menu Pengaturan Agensi langsung dari aplikasi saat login sebagai Owner/Admin, atau modifikasi nilai awal di src/data/seedData.ts.
* **Menambah Kategori Biaya / Role Akses :** Sesuaikan pada src/types.ts dan form dropdown terkait.

---
*Dokumentasi ini disiapkan secara resmi sebagai bagian dari paket serah terima Full Source Code Buyout.*
`;

export const TechnicalDocsView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  // 1. Download sebagai file .md (Markdown murni)
  const handleDownloadMarkdown = () => {
    const blob = new Blob([DOC_3_CONTENT], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DOKUMEN_3_PANDUAN_TEKNIS_DAN_SETUP.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Download sebagai file .txt (Teks biasa yang bisa dibuka di HP/Notepad)
  const handleDownloadTxt = () => {
    const blob = new Blob([DOC_3_CONTENT], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DOKUMEN_3_PANDUAN_TEKNIS_DAN_SETUP.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Salin seluruh teks ke clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(DOC_3_CONTENT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // 4. Cetak langsung / Simpan ke PDF via browser Print Dialog
  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DOKUMEN_3_PANDUAN_TEKNIS_DAN_SETUP</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 22px; color: #0f172a; border-bottom: 2px solid #0891b2; padding-bottom: 8px; }
            h2 { font-size: 17px; color: #0891b2; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            h3 { font-size: 14px; color: #334155; }
            pre { background: #0f172a; color: #f8fafc; padding: 14px; border-radius: 8px; overflow-x: auto; font-size: 12px; }
            code { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
            pre code { background: transparent; padding: 0; color: inherit; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background: #f8fafc; font-weight: bold; }
            ul, ol { padding-left: 20px; font-size: 13px; }
            li { margin-bottom: 6px; }
            hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <pre style="white-space: pre-wrap; font-family: inherit; background: transparent; color: inherit; font-size: 13px;">${DOC_3_CONTENT.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dokumentasi Resmi Serah Terima (Handover Aset)</span>
          </div>
          <h2 className="text-xl font-bold">Dokumen 3: Panduan Teknis & Setup</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Dokumen arsitektur lengkap, petunjuk instalasi lokal, koneksi Firebase, dan panduan deployment produksi untuk tim pengembang atau calon pembeli aset.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:shadow-cyan-500/20"
            title="Download file .md (Markdown murni)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            title="Download file .txt (bisa dibuka di Notepad / HP)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download .TXT</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            title="Salin seluruh isi teks dokumen"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            title="Buka dialog cetak atau simpan sebagai PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">Tech Stack</span>
            <span className="text-slate-500 text-[11px]">React 19 + Vite + Tailwind v4</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">Cloud Database</span>
            <span className="text-slate-500 text-[11px]">Firebase Cloud Firestore & Auth</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">Nama Berkas</span>
            <span className="text-slate-500 text-[11px] font-mono">DOKUMEN_3_PANDUAN_TEKNIS_DAN_SETUP.md</span>
          </div>
        </div>
      </div>

      {/* Document Preview Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-600" />
            Preview Isi Dokumen Teknis
          </span>
          <span className="text-[11px] font-mono text-slate-400">Siap Cetak & Kirim</span>
        </div>

        <div className="p-6 md:p-8 font-mono text-xs text-slate-800 leading-relaxed bg-white overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre-wrap select-text">
          {DOC_3_CONTENT}
        </div>
      </div>
    </div>
  );
};
