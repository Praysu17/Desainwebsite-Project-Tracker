import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  INITIAL_CLIENTS,
  INITIAL_EXPENSES,
  INITIAL_INCOME,
  INITIAL_INVOICES,
  INITIAL_PROJECTS,
  INITIAL_PROPOSALS,
} from '../data/seedData';
import {
  ActiveTab,
  AppSettings,
  Client,
  ExpenseTransaction,
  IncomeTransaction,
  Invoice,
  PartnerSplit,
  Project,
  Proposal,
  UserAccount,
} from '../types';
import {
  createWhatsAppInvoiceMessage,
  createWhatsAppUrl,
  isAdminRole,
} from '../utils/formatters';

interface AppContextType {
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  
  // Public Sharing Links & Mode
  publicShare: {
    type: 'proposal' | 'invoice';
    token: string;
  } | null;
  setPublicShare: (share: { type: 'proposal' | 'invoice'; token: string } | null) => void;
  
  // Auth
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  login: (identifier: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;
  addUser: (user: Omit<UserAccount, 'id'>) => UserAccount;
  updateUser: (userId: string, updates: Partial<UserAccount>) => void;
  deleteUser: (userId: string) => { success: boolean; message?: string };
  
  // Search
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  
  // Notifications
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'alert' | 'success';
    date: string;
    invoiceToken?: string;
    invoiceNumber?: string;
    clientContact?: string;
    whatsappUrl?: string;
  }>;
  clearNotification: (id: string) => void;
  
  // Data Collections
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'completedOrdersCount' | 'lifetimeValue' | 'avgOrderValue'>) => string;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'projectNo' | 'remainingPayment'>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  incomes: IncomeTransaction[];
  addIncome: (income: Omit<IncomeTransaction, 'id'>) => string;
  updateIncome: (id: string, updates: Partial<IncomeTransaction>) => void;
  deleteIncome: (id: string) => void;
  
  expenses: ExpenseTransaction[];
  addExpense: (expense: Omit<ExpenseTransaction, 'id'>) => string;
  updateExpense: (id: string, updates: Partial<ExpenseTransaction>) => void;
  deleteExpense: (id: string) => void;
  
  proposals: Proposal[];
  addProposal: (proposal: Omit<Proposal, 'id' | 'proposalNumber' | 'shareToken' | 'createdAt'>) => Proposal;
  updateProposal: (id: string, updates: Partial<Proposal>) => void;
  deleteProposal: (id: string) => boolean;
  acceptProposal: (token: string) => {
    proposal: Proposal;
    invoice: Invoice;
    invoiceToken: string;
    invoiceNumber: string;
    whatsappUrl: string;
  } | null;
  rejectProposal: (token: string, reason?: string) => Proposal | null;
  markProposalViewed: (token: string) => void;
  recordProposalView: (token: string) => void;
  
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'shareToken' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => boolean;
  recordInvoicePayment: (invoiceId: string, amount: number, method: IncomeTransaction['method'], notes?: string) => void;
  markInvoiceAsPaid: (invoiceId: string, method?: IncomeTransaction['method']) => void;
  
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetAllDataToSeed: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Purge previous mock/demo data once so user enters clean live production mode with Login view
if (typeof window !== 'undefined' && !localStorage.getItem('spdigital_live_ready_v3')) {
  localStorage.removeItem('sugeng_clients');
  localStorage.removeItem('sugeng_projects');
  localStorage.removeItem('sugeng_incomes');
  localStorage.removeItem('sugeng_expenses');
  localStorage.removeItem('sugeng_proposals');
  localStorage.removeItem('sugeng_invoices');
  localStorage.removeItem('sugeng_notifications');
  localStorage.removeItem('sugeng_auth'); // Reset authentication session so initial view is Login!

  // Clean settings so only 1 user (Sugeng Prayitno) exists
  const rawSettings = localStorage.getItem('sugeng_settings');
  if (rawSettings) {
    try {
      const parsed = JSON.parse(rawSettings);
      parsed.users = [DEFAULT_SETTINGS.users[0]];
      parsed.teamMembers = [DEFAULT_SETTINGS.users[0]];
      localStorage.setItem('sugeng_settings', JSON.stringify(parsed));
    } catch {
      localStorage.removeItem('sugeng_settings');
    }
  }
  localStorage.setItem('sugeng_current_user', JSON.stringify(DEFAULT_SETTINGS.users[0]));
  localStorage.setItem('spdigital_live_ready_v3', 'true');

  // Reset URL back to root if it was lingering on an old deleted share link
  if (window.location.pathname.startsWith('/share/')) {
    try {
      window.history.replaceState({}, '', '/');
    } catch {
      // ignore
    }
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load data from localStorage or fallback to seeds (which are empty for live)
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('sugeng_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('sugeng_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [incomes, setIncomes] = useState<IncomeTransaction[]>(() => {
    const saved = localStorage.getItem('sugeng_incomes');
    return saved ? JSON.parse(saved) : INITIAL_INCOME;
  });

  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(() => {
    const saved = localStorage.getItem('sugeng_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [proposals, setProposals] = useState<Proposal[]>(() => {
    const saved = localStorage.getItem('sugeng_proposals');
    return saved ? JSON.parse(saved) : INITIAL_PROPOSALS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('sugeng_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('sugeng_settings');
    let loadedSettings: AppSettings = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;

    // Ensure Agency Name and Tagline are SP Digital and Digital Partner Solution
    if (
      !loadedSettings.agencyName ||
      loadedSettings.agencyName === 'Sugeng Project Tracker' ||
      loadedSettings.agencyName.toLowerCase().includes('sugeng project tracker')
    ) {
      loadedSettings.agencyName = 'SP Digital';
    }
    if (
      !loadedSettings.agencyTagline ||
      loadedSettings.agencyTagline === 'Digital Agency Operations & Client Portal' ||
      loadedSettings.agencyTagline.includes('Digital Agency Operations')
    ) {
      loadedSettings.agencyTagline = 'Digital Partner Solution';
    }

    // Default contact and bank fields if missing
    loadedSettings.contactEmail = loadedSettings.contactEmail || 'hello@spdigital.id';
    loadedSettings.agencyEmail = loadedSettings.agencyEmail || 'hello@spdigital.id';
    loadedSettings.agencyPhone = loadedSettings.agencyPhone || '+62 812-3456-7890';
    loadedSettings.agencyAddress =
      loadedSettings.agencyAddress || 'Jl. Pemuda No. 88, Surabaya, Jawa Timur, Indonesia';
    loadedSettings.bankName = loadedSettings.bankName || 'Bank Central Asia (BCA)';
    loadedSettings.bankAccount = loadedSettings.bankAccount || '829-019-8273';
    loadedSettings.bankHolder = loadedSettings.bankHolder || 'PRAYUGO SUGENG';
    loadedSettings.invoiceDefaultNotes =
      loadedSettings.invoiceDefaultNotes ||
      'Silakan lakukan transfer ke salah satu rekening resmi kami di atas. Cantumkan nomor invoice pada berita transfer untuk percepatan verifikasi sistem.';

    // Ensure ONLY 1 User exists: Sugeng Prayitno as Owner/Admin with Password01
    const existingSugeng = (loadedSettings.users || []).find(
      (u) =>
        u.name.toLowerCase().includes('sugeng') ||
        u.email === 'sugeng@agency.com' ||
        u.role === 'Owner/Admin'
    );

    const soleAdmin: UserAccount = {
      id: 'usr-1',
      name: 'Sugeng Prayitno',
      email: existingSugeng?.email || 'sugeng@agency.com',
      role: 'Owner/Admin',
      password: existingSugeng?.password || 'Password01',
      avatar: existingSugeng?.avatar || '',
    };

    loadedSettings.users = [soleAdmin];
    loadedSettings.teamMembers = [soleAdmin];
    return loadedSettings;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const savedUser = localStorage.getItem('sugeng_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id && parsed.name === 'Sugeng Prayitno') return parsed;
      } catch (e) {
        // ignore
      }
    }
    return settings.users[0] || DEFAULT_SETTINGS.users[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('sugeng_auth');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sugeng_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: 'info' | 'warning' | 'alert' | 'success'; date: string }>>([]);

  // Handle URL share token detection (e.g. /share/proposal/{token} or ?share=proposal&token=...)
  const [publicShare, setPublicShare] = useState<{ type: 'proposal' | 'invoice'; token: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    
    // Check search params first
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    const tokenParam = params.get('token');
    if (shareParam && tokenParam && (shareParam === 'proposal' || shareParam === 'invoice')) {
      return { type: shareParam as 'proposal' | 'invoice', token: tokenParam };
    }

    // Check path /share/proposal/:token or /share/invoice/:token
    const path = window.location.pathname;
    const match = path.match(/^\/share\/(proposal|invoice)\/([^/]+)/);
    if (match && match[2]) {
      return { type: match[1] as 'proposal' | 'invoice', token: match[2] };
    }

    return null;
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('sugeng_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('sugeng_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('sugeng_incomes', JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem('sugeng_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('sugeng_proposals', JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    localStorage.setItem('sugeng_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('sugeng_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('sugeng_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  // Enrich clients with automatic calculated metrics
  const enrichedClients = useMemo(() => {
    return clients.map((c) => {
      const clientProjects = projects.filter((p) => p.clientId === c.id || p.clientName.toLowerCase() === c.name.toLowerCase());
      const completedOrdersCount = clientProjects.filter((p) => p.status === 'Selesai').length;
      const lifetimeValue = clientProjects.reduce((sum, p) => sum + (p.projectValue || 0), 0);
      const avgOrderValue = completedOrdersCount > 0 ? Math.round(lifetimeValue / completedOrdersCount) : 0;
      
      // Also get latest order date
      const sortedDates = clientProjects
        .map((p) => p.startDate)
        .filter(Boolean)
        .sort();
      const firstOrderDate = sortedDates[0] || c.firstOrderDate;
      const lastOrderDate = sortedDates[sortedDates.length - 1] || c.lastOrderDate;

      return {
        ...c,
        firstOrderDate,
        lastOrderDate,
        completedOrdersCount,
        lifetimeValue,
        avgOrderValue,
      };
    });
  }, [clients, projects]);

  // Enrich projects ensuring remainingPayment is strictly projectValue - dpReceived
  const enrichedProjects = useMemo(() => {
    return projects.map((p) => ({
      ...p,
      remainingPayment: Math.max(0, (p.projectValue || 0) - (p.dpReceived || 0)),
    }));
  }, [projects]);

  // Enrich invoices with auto overdue check
  const enrichedInvoices = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return invoices.map((inv) => {
      if (inv.status !== 'Lunas' && inv.dueDate && inv.dueDate < todayStr) {
        return { ...inv, status: 'Jatuh Tempo' as const };
      }
      return inv;
    });
  }, [invoices]);

  // Client actions
  const addClient = (data: Omit<Client, 'id' | 'completedOrdersCount' | 'lifetimeValue' | 'avgOrderValue'>) => {
    const newId = `cli-${Date.now().toString().slice(-4)}`;
    const newClient: Client = {
      ...data,
      id: newId,
    };
    setClients((prev) => [newClient, ...prev]);
    return newId;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          // If name changed, update all projects referencing this client name
          if (updates.name && updates.name !== c.name) {
            setProjects((projList) =>
              projList.map((p) => (p.clientId === id ? { ...p, clientName: updates.name! } : p))
            );
          }
          return updated;
        }
        return c;
      })
    );
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  // Project actions
  const addProject = (data: Omit<Project, 'id' | 'projectNo' | 'remainingPayment'>) => {
    const maxNo = projects.reduce((max, p) => Math.max(max, p.projectNo || 0), 0);
    const newId = `prj-${Date.now().toString().slice(-4)}`;
    const remainingPayment = Math.max(0, data.projectValue - (data.dpReceived || 0));
    
    // Determine payment status
    let paymentStatus = data.paymentStatus;
    if (data.dpReceived >= data.projectValue && data.projectValue > 0) {
      paymentStatus = 'Lunas';
    } else if (data.dpReceived > 0) {
      paymentStatus = 'DP Diterima';
    } else {
      paymentStatus = 'Belum DP';
    }

    const newProject: Project = {
      ...data,
      id: newId,
      projectNo: maxNo + 1,
      paymentStatus,
      remainingPayment,
    };

    setProjects((prev) => [newProject, ...prev]);

    // If DP received > 0 on creation, create auto income transaction
    if (data.dpReceived > 0) {
      addIncome({
        date: data.startDate || new Date().toISOString().split('T')[0],
        clientId: data.clientId,
        clientName: data.clientName,
        projectId: newId,
        projectTitle: `${data.serviceType}`,
        incomeType: paymentStatus === 'Lunas' ? 'Pelunasan' : 'DP',
        amount: data.dpReceived,
        method: 'Transfer Bank',
        notes: `Pembayaran ${paymentStatus} proyek ${data.serviceType} (${data.clientName})`,
      });
    }

    return newId;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const val = updates.projectValue !== undefined ? updates.projectValue : p.projectValue;
          const dp = updates.dpReceived !== undefined ? updates.dpReceived : p.dpReceived;
          const remainingPayment = Math.max(0, val - dp);
          
          let paymentStatus = updates.paymentStatus || p.paymentStatus;
          if (dp >= val && val > 0) {
            paymentStatus = 'Lunas';
          } else if (dp > 0) {
            paymentStatus = 'DP Diterima';
          } else {
            paymentStatus = 'Belum DP';
          }

          return {
            ...p,
            ...updates,
            projectValue: val,
            dpReceived: dp,
            remainingPayment,
            paymentStatus,
          };
        }
        return p;
      })
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Income actions
  const addIncome = (data: Omit<IncomeTransaction, 'id'>) => {
    const newId = `inc-${Date.now().toString().slice(-4)}`;
    const newTx: IncomeTransaction = { ...data, id: newId };
    setIncomes((prev) => [newTx, ...prev]);
    return newId;
  };

  const updateIncome = (id: string, updates: Partial<IncomeTransaction>) => {
    setIncomes((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((item) => item.id !== id));
  };

  // Expense actions
  const addExpense = (data: Omit<ExpenseTransaction, 'id'>) => {
    const newId = `exp-${Date.now().toString().slice(-4)}`;
    const newTx: ExpenseTransaction = { ...data, id: newId };
    setExpenses((prev) => [newTx, ...prev]);
    return newId;
  };

  const updateExpense = (id: string, updates: Partial<ExpenseTransaction>) => {
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  // Proposal actions
  const addProposal = (data: Omit<Proposal, 'id' | 'proposalNumber' | 'shareToken' | 'createdAt'>) => {
    const year = new Date().getFullYear();
    const count = proposals.length + 1;
    const proposalNumber = `PRP-${year}-${count.toString().padStart(6, '0')}`;
    const shareToken = `prop-${Math.random().toString(36).substring(2, 10)}`;
    const newId = `prp-${Date.now().toString().slice(-4)}`;
    
    const newProposal: Proposal = {
      ...data,
      id: newId,
      proposalNumber,
      shareToken,
      createdAt: new Date().toISOString().split('T')[0],
      status: data.status || 'Draft',
    };

    setProposals((prev) => [newProposal, ...prev]);
    return newProposal;
  };

  const updateProposal = (id: string, updates: Partial<Proposal>) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProposal = (id: string): boolean => {
    if (!isAdminRole(currentUser?.role)) {
      console.warn('Izin ditolak: Hanya Admin/Owner yang dapat menghapus proposal.');
      return false;
    }
    setProposals((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  const markProposalViewed = (token: string) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.shareToken === token && (p.status === 'Draft' || p.status === 'Terkirim')) {
          return {
            ...p,
            status: 'Dilihat',
            viewedAt: new Date().toLocaleString('id-ID'),
          };
        }
        return p;
      })
    );
  };

  const acceptProposal = (token: string) => {
    const proposal = proposals.find((p) => p.shareToken === token);
    if (!proposal) return null;

    const year = new Date().getFullYear();
    const invCount = invoices.length + 1;
    const invoiceNumber = `INV-${year}-${invCount.toString().padStart(6, '0')}`;
    const invToken = `inv-${Math.random().toString(36).substring(2, 10)}`;
    const newInvId = `inv-${Date.now().toString().slice(-4)}`;

    // Due date = 7 days from now
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const dueDate = due.toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id: newInvId,
      invoiceNumber,
      proposalId: proposal.id,
      clientId: proposal.clientId,
      clientName: proposal.clientName,
      clientContact: proposal.clientContact,
      projectTitle: proposal.projectTitle,
      items: proposal.items,
      totalAmount: proposal.totalValue,
      amountPaid: 0,
      dueDate,
      status: 'Belum Bayar',
      shareToken: invToken,
      createdAt: new Date().toISOString().split('T')[0],
      paymentNotes: `Dibuat otomatis dari persetujuan proposal ${proposal.proposalNumber}`,
    };

    const updatedProposal: Proposal = {
      ...proposal,
      status: 'Disetujui',
      respondedAt: new Date().toLocaleString('id-ID'),
      generatedInvoiceId: newInvId,
      invoiceId: newInvId,
    };

    setProposals((prev) => prev.map((p) => (p.id === proposal.id ? updatedProposal : p)));
    setInvoices((prev) => [newInvoice, ...prev]);

    // Also auto-create a project if not exists
    addProject({
      clientId: proposal.clientId,
      clientName: proposal.clientName,
      serviceType: proposal.projectTitle,
      pic: 'Sugeng (Lead)',
      startDate: new Date().toISOString().split('T')[0],
      deadline: dueDate,
      status: 'Deal',
      progress: 0,
      projectValue: proposal.totalValue,
      paymentStatus: 'Belum DP',
      dpReceived: 0,
      notes: `Proyek hasil deal proposal online ${proposal.proposalNumber}`,
    });

    // Format WhatsApp invoice message & deep link
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const invoiceUrl = `${origin}/share/invoice/${invToken}`;
    const primaryBank = settings.bankAccounts?.[0] || {
      bankName: settings.bankName || 'BCA',
      accountNumber: settings.bankAccount || '8830-1928-11',
      accountHolder: settings.bankHolder || settings.agencyName,
    };

    const waText = createWhatsAppInvoiceMessage({
      clientName: proposal.clientName,
      projectTitle: proposal.projectTitle,
      invoiceNumber,
      totalAmount: proposal.totalValue,
      dueDate,
      invoiceUrl,
      agencyName: settings.agencyName,
      bankName: primaryBank.bankName,
      bankAccount: primaryBank.accountNumber,
      bankHolder: primaryBank.accountHolder,
    });

    const waUrl = createWhatsAppUrl(proposal.clientContact, waText);

    // Add alert notification for admin with direct WhatsApp trigger
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: '🎉 Proposal Disetujui!',
        message: `Klien ${proposal.clientName} menyetujui "${proposal.projectTitle}". Invoice ${invoiceNumber} telah dibuat.`,
        type: 'success',
        date: new Date().toLocaleString('id-ID'),
        invoiceToken: invToken,
        invoiceNumber,
        clientContact: proposal.clientContact,
        whatsappUrl: waUrl,
      },
      ...prev,
    ]);

    return {
      proposal: updatedProposal,
      invoice: newInvoice,
      invoiceToken: invToken,
      invoiceNumber,
      whatsappUrl: waUrl,
    };
  };

  const rejectProposal = (token: string, reason: string = 'Klien menolak proposal') => {
    const proposal = proposals.find((p) => p.shareToken === token);
    if (!proposal) return null;

    const updated: Proposal = {
      ...proposal,
      status: 'Ditolak',
      respondedAt: new Date().toLocaleString('id-ID'),
      rejectionReason: reason,
    };

    setProposals((prev) => prev.map((p) => (p.id === proposal.id ? updated : p)));

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: '⚠️ Proposal Ditolak',
        message: `Klien ${proposal.clientName} menolak proposal "${proposal.projectTitle}".`,
        type: 'alert',
        date: new Date().toLocaleString('id-ID'),
      },
      ...prev,
    ]);

    return updated;
  };

  // Invoice actions
  const addInvoice = (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'shareToken' | 'createdAt'>) => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    const invoiceNumber = `INV-${year}-${count.toString().padStart(6, '0')}`;
    const shareToken = `inv-${Math.random().toString(36).substring(2, 10)}`;
    const newId = `inv-${Date.now().toString().slice(-4)}`;

    const newInvoice: Invoice = {
      ...data,
      id: newId,
      invoiceNumber,
      shareToken,
      createdAt: new Date().toISOString().split('T')[0],
      status: data.status || 'Draft',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)));
  };

  const deleteInvoice = (id: string): boolean => {
    if (!isAdminRole(currentUser?.role)) {
      console.warn('Izin ditolak: Hanya Admin/Owner yang dapat menghapus invoice.');
      return false;
    }
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    return true;
  };

  // Record Invoice Payment -> Auto adds entry to Pemasukan (Keuangan) & updates invoice + linked project!
  const recordInvoicePayment = (
    invoiceId: string,
    amount: number,
    method: IncomeTransaction['method'],
    notes?: string
  ) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    const newAmountPaid = (invoice.amountPaid || 0) + amount;
    const isFull = newAmountPaid >= invoice.totalAmount;
    const newStatus: Invoice['status'] = isFull ? 'Lunas' : 'DP Diterima';

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              amountPaid: newAmountPaid,
              status: newStatus,
              paidAt: new Date().toISOString().split('T')[0],
              paymentNotes: notes || `Pembayaran ${isFull ? 'Pelunasan' : 'DP'} via ${method}`,
            }
          : inv
      )
    );

    // Auto-create Pemasukan record
    addIncome({
      date: new Date().toISOString().split('T')[0],
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      projectId: invoice.projectId,
      projectTitle: invoice.projectTitle,
      invoiceId: invoice.id,
      incomeType: isFull ? 'Pelunasan' : 'DP',
      amount,
      method,
      notes: notes || `Pembayaran Invoice ${invoice.invoiceNumber} (${isFull ? 'Lunas' : 'DP'})`,
    });

    // Update linked project if any
    if (invoice.projectId) {
      updateProject(invoice.projectId, {
        dpReceived: newAmountPaid,
        paymentStatus: isFull ? 'Lunas' : 'DP Diterima',
      });
    }

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: '💵 Pembayaran Masuk',
        message: `Pembayaran Rp ${amount.toLocaleString('id-ID')} diterima untuk ${invoice.invoiceNumber} (${invoice.clientName}). Otomatis tercatat di modul Keuangan.`,
        type: 'success',
        date: new Date().toLocaleString('id-ID'),
      },
      ...prev,
    ]);
  };

  const markInvoiceAsPaid = (invoiceId: string, method: IncomeTransaction['method'] = 'Transfer Bank') => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    const remaining = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
    recordInvoicePayment(invoiceId, remaining > 0 ? remaining : inv.totalAmount, method);
  };

  const recordProposalView = (token: string) => {
    markProposalViewed(token);
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const login = (identifier: string, pass: string): { success: boolean; message?: string } => {
    const trimmedId = identifier.trim().toLowerCase();
    const trimmedPass = pass.trim();

    const userList = settings.users || [];
    const matchedUser = userList.find((u) => {
      const emailMatch = u.email && u.email.toLowerCase() === trimmedId;
      const nameMatch = u.name && u.name.toLowerCase() === trimmedId;
      return emailMatch || nameMatch;
    });

    if (!matchedUser) {
      return { success: false, message: 'Email atau Nama Pengguna tidak ditemukan.' };
    }

    if (matchedUser.password !== trimmedPass) {
      return { success: false, message: 'Password salah. Silakan periksa kembali.' };
    }

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    localStorage.setItem('sugeng_auth', 'true');
    localStorage.setItem('sugeng_current_user', JSON.stringify(matchedUser));
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sugeng_auth');
  };

  const addUser = (user: Omit<UserAccount, 'id'>): UserAccount => {
    const newUser: UserAccount = {
      ...user,
      id: `usr-${Date.now()}`,
      password: user.password || 'Password123',
    };
    const updatedUsers = [...(settings.users || []), newUser];
    const newSettings: AppSettings = {
      ...settings,
      users: updatedUsers,
      teamMembers: updatedUsers,
    };
    setSettings(newSettings);
    localStorage.setItem('sugeng_settings', JSON.stringify(newSettings));
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<UserAccount>) => {
    const updatedUsers = (settings.users || []).map((u) => {
      if (u.id === userId) {
        return { ...u, ...updates };
      }
      return u;
    });
    const newSettings: AppSettings = {
      ...settings,
      users: updatedUsers,
      teamMembers: updatedUsers,
    };
    setSettings(newSettings);
    localStorage.setItem('sugeng_settings', JSON.stringify(newSettings));

    if (currentUser.id === userId) {
      const updatedCurrent = { ...currentUser, ...updates };
      setCurrentUser(updatedCurrent);
      localStorage.setItem('sugeng_current_user', JSON.stringify(updatedCurrent));
    }
  };

  const deleteUser = (userId: string): { success: boolean; message?: string } => {
    const users = settings.users || [];
    if (users.length <= 1) {
      return { success: false, message: 'Tidak dapat menghapus satu-satunya akun pengguna yang ada.' };
    }
    const target = users.find((u) => u.id === userId);
    if (target?.role === 'Owner/Admin' && users.filter((u) => u.role === 'Owner/Admin').length <= 1) {
      return { success: false, message: 'Tidak dapat menghapus admin utama satu-satunya.' };
    }

    const updatedUsers = users.filter((u) => u.id !== userId);
    const newSettings: AppSettings = {
      ...settings,
      users: updatedUsers,
      teamMembers: updatedUsers,
    };
    setSettings(newSettings);
    localStorage.setItem('sugeng_settings', JSON.stringify(newSettings));

    if (currentUser.id === userId) {
      setCurrentUser(updatedUsers[0]);
      localStorage.setItem('sugeng_current_user', JSON.stringify(updatedUsers[0]));
    }
    return { success: true };
  };

  const resetAllDataToSeed = () => {
    setClients(INITIAL_CLIENTS);
    setProjects(INITIAL_PROJECTS);
    setIncomes(INITIAL_INCOME);
    setExpenses(INITIAL_EXPENSES);
    setProposals(INITIAL_PROPOSALS);
    setInvoices(INITIAL_INVOICES);
    setSettings(DEFAULT_SETTINGS);
    setNotifications([]);
    setCurrentUser(DEFAULT_SETTINGS.users[0]);
    localStorage.clear();
    localStorage.setItem('spdigital_live_ready_v1', 'true');
    localStorage.setItem('sugeng_current_user', JSON.stringify(DEFAULT_SETTINGS.users[0]));
    localStorage.setItem('sugeng_settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedClientId,
        setSelectedClientId,
        publicShare,
        setPublicShare,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        globalSearch,
        setGlobalSearch,
        notifications,
        clearNotification,
        clients: enrichedClients,
        addClient,
        updateClient,
        deleteClient,
        projects: enrichedProjects,
        addProject,
        updateProject,
        deleteProject,
        incomes,
        addIncome,
        updateIncome,
        deleteIncome,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        proposals,
        addProposal,
        updateProposal,
        deleteProposal,
        acceptProposal,
        rejectProposal,
        markProposalViewed,
        recordProposalView,
        invoices: enrichedInvoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        recordInvoicePayment,
        markInvoiceAsPaid,
        settings,
        updateSettings,
        resetAllDataToSeed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
