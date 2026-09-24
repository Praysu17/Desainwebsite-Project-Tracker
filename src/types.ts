export type ClientStatus = 'Aktif' | 'Perlu Follow-up' | 'Tidak Aktif';

export interface Client {
  id: string;
  name: string;
  contact: string; // WhatsApp / Email
  firstService: string;
  firstOrderDate: string;
  lastOrderDate: string;
  status: ClientStatus;
  nextFollowUpDate: string;
  notes: string;
  // Computed fields (derived dynamically from linked projects)
  completedOrdersCount?: number;
  lifetimeValue?: number;
  avgOrderValue?: number;
}

export type ProjectStatus = 'Deal' | 'Proses' | 'Revisi' | 'Selesai' | 'Batal';
export type PaymentStatus = 'Belum DP' | 'DP Diterima' | 'Lunas';

export interface Project {
  id: string;
  projectNo: number; // Auto increment
  clientId: string;
  clientName: string;
  serviceType: string;
  pic: string; // Multi-user or team member assigned
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  progress: number; // 0 - 100
  projectValue: number; // Rp
  paymentStatus: PaymentStatus;
  dpReceived: number; // Rp
  remainingPayment: number; // Nilai Proyek - DP Diterima (auto-calculated)
  notes: string;
}

export type IncomeType = 'DP' | 'Pelunasan' | 'Retainer Bulanan' | 'Lainnya';
export type PaymentMethod = 'Transfer Bank' | 'QRIS' | 'E-Wallet' | 'Cash';

export interface IncomeTransaction {
  id: string;
  date: string;
  clientId?: string;
  clientName: string;
  projectId?: string;
  projectTitle?: string;
  invoiceId?: string;
  incomeType: IncomeType;
  amount: number;
  method: PaymentMethod;
  notes: string;
}

export interface ExpenseTransaction {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  method: PaymentMethod;
  notes: string;
}

export type ProposalStatus = 'Draft' | 'Terkirim' | 'Dilihat' | 'Disetujui' | 'Ditolak';

export interface ProposalLineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
}

export type InvoiceItem = ProposalLineItem;

export interface Proposal {
  id: string;
  proposalNumber: string; // PRP-YYYY-000102
  clientId: string;
  clientName: string;
  clientContact: string;
  projectTitle: string;
  items: ProposalLineItem[];
  totalValue: number;
  terms: string;
  expiryDate: string;
  status: ProposalStatus;
  shareToken: string;
  createdAt: string;
  viewedAt?: string;
  respondedAt?: string;
  rejectionReason?: string;
  generatedInvoiceId?: string;
  invoiceId?: string;
}

export type InvoiceStatus = 'Draft' | 'Terkirim' | 'Belum Bayar' | 'Belum Dibayar' | 'DP Diterima' | 'Lunas' | 'Jatuh Tempo';

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-YYYY-000102
  proposalId?: string;
  projectId?: string;
  clientId: string;
  clientName: string;
  clientContact: string;
  projectTitle: string;
  items: ProposalLineItem[];
  totalAmount: number;
  amountPaid: number;
  dueDate: string;
  status: InvoiceStatus;
  shareToken: string;
  createdAt: string;
  paidAt?: string;
  paymentNotes?: string;
}

export interface PartnerSplit {
  id: string;
  name: string;
  percentage: number; // e.g. 50, 50
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Owner/Admin' | 'Staff' | 'Admin' | 'Project Manager' | 'Freelancer';
  avatar?: string;
  password?: string;
}

export type TeamMember = UserAccount;

export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface AppSettings {
  agencyName: string;
  agencyTagline: string;
  logoUrl: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  brandColor: string;
  accentColor: string;
  
  // Proposal templates
  proposalOpening: string;
  proposalClosing: string;
  proposalDefaultTerms: string;
  
  // Invoice templates
  bankAccounts: BankAccountInfo[];
  qrisImageUrl?: string;
  invoicePaymentInstructions: string;
  invoiceFooterNote: string;
  invoiceDefaultNotes?: string;
  autoInvoicePercentage?: number;
  
  // Flat convenience fields
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  agencyPhone?: string;
  agencyEmail?: string;
  agencyAddress?: string;

  // Custom sidebar labels
  sidebarLabels: {
    dashboard: string;
    clients: string;
    projects: string;
    finance: string;
    proposals: string;
    invoices: string;
    reports: string;
    settings: string;
  };
  
  // Categories & splits
  expenseCategories: string[];
  partnerSplits: PartnerSplit[];
  users: UserAccount[];
  teamMembers?: UserAccount[];
}

export type AgencySettings = AppSettings;

export type ActiveTab = 'dashboard' | 'clients' | 'projects' | 'finance' | 'proposals' | 'invoices' | 'reports' | 'settings';
