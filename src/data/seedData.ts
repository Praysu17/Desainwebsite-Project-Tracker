import {
  AppSettings,
  Client,
  ExpenseTransaction,
  IncomeTransaction,
  Invoice,
  Project,
  Proposal,
} from '../types';

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_INCOME: IncomeTransaction[] = [];

export const INITIAL_EXPENSES: ExpenseTransaction[] = [];

export const INITIAL_PROPOSALS: Proposal[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  agencyName: 'SP Digital',
  agencyTagline: 'Digital Partner Solution',
  logoUrl: '/sugeng-logo.svg',
  address: 'Jl. Pemuda No. 88, Surabaya, Jawa Timur, Indonesia',
  contactEmail: 'hello@spdigital.id',
  contactPhone: '+62 812-3456-7890',
  brandColor: '#0A192F', // Deep Navy Dark
  accentColor: '#38F2DC', // Vibrant Electric Cyan

  // Flat convenience fields for public pages & modals
  bankName: 'Bank Central Asia (BCA)',
  bankAccount: '829-019-8273',
  bankHolder: 'PRAYUGO SUGENG',
  agencyPhone: '+62 812-3456-7890',
  agencyEmail: 'hello@spdigital.id',
  agencyAddress: 'Jl. Pemuda No. 88, Surabaya, Jawa Timur, Indonesia',
  invoiceDefaultNotes:
    'Silakan lakukan transfer ke rekening resmi kami di atas. Cantumkan nomor invoice pada berita transfer untuk percepatan verifikasi sistem.',

  proposalOpening:
    'Yth. Pimpinan & Tim Manajemen,\n\nTerima kasih atas kepercayaan Anda mendiskusikan kebutuhan digital bisnis bersama kami. Berikut kami lampirkan dokumen proposal penawaran resmi dengan rincian ruang lingkup pengerjaan, estimasi biaya, dan jadwal implementasi.',
  proposalClosing:
    'Kami berkomitmen menghadirkan solusi teknologi berkualitas tinggi dengan standar performa dan keamanan terbaik. Apabila proposal ini sesuai dengan ekspektasi Anda, silakan klik tombol "Terima Proposal" di bawah untuk segera memulai proyek.',
  proposalDefaultTerms:
    '1. Pembayaran Uang Muka (DP) minimal 50% diperlukan sebelum proses pengerjaan dimulai.\n2. Estimasi waktu pengerjaan dihitung sejak materi lengkap & DP diterima.\n3. Seluruh hak kekayaan intelektual (source code & aset final) menjadi milik klien setelah pelunasan penuh.\n4. Revisi gratis diberikan sebanyak 3 putaran pada tahap perancangan desain.',

  bankAccounts: [
    {
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '829-019-8273',
      accountHolder: 'PRAYUGO SUGENG',
    },
  ],
  qrisImageUrl: '',
  invoicePaymentInstructions:
    'Silakan lakukan transfer ke salah satu rekening resmi kami di atas. Cantumkan nomor invoice pada berita transfer untuk percepatan verifikasi sistem.',
  invoiceFooterNote:
    'Terima kasih atas kerja sama Anda. Untuk konfirmasi bukti transfer atau pertanyaan lebih lanjut, silakan hubungi kami via WhatsApp.',

  sidebarLabels: {
    dashboard: 'Ringkasan',
    clients: 'Klien',
    projects: 'Proyek',
    finance: 'Keuangan',
    proposals: 'Proposal',
    invoices: 'Invoice',
    reports: 'Laporan',
    settings: 'Pengaturan',
  },

  expenseCategories: [
    'Domain & Hosting',
    'Software & Tools',
    'Iklan Internal',
    'Split Profit',
    'Gaji/Fee Tim',
    'Operasional',
    'Lainnya',
  ],

  partnerSplits: [
    { id: 'part-1', name: 'Sugeng Prayitno', percentage: 100 },
  ],

  users: [
    {
      id: 'usr-1',
      name: 'Sugeng Prayitno',
      email: 'sugeng@agency.com',
      role: 'Owner/Admin',
      password: 'Password01',
      avatar: '',
    },
  ],
  teamMembers: [
    {
      id: 'usr-1',
      name: 'Sugeng Prayitno',
      email: 'sugeng@agency.com',
      role: 'Owner/Admin',
      password: 'Password01',
      avatar: '',
    },
  ],
};
