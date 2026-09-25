import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import {
  db,
  auth,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
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
  DeviceSession,
  ExpenseTransaction,
  IncomeTransaction,
  Invoice,
  Project,
  Proposal,
  UserAccount,
} from '../types';
import {
  createWhatsAppInvoiceMessage,
  createWhatsAppUrl,
  isAdminRole,
} from '../utils/formatters';
import {
  getDeviceId,
  getCurrentDeviceSession,
  cleanActiveDevices,
} from '../utils/deviceHelper';

interface AppContextType {
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;

  // Cloud Status
  isCloudSynced: boolean;

  // Public Sharing Links & Mode
  publicShare: {
    type: 'proposal' | 'invoice';
    token: string;
  } | null;
  setPublicShare: (share: { type: 'proposal' | 'invoice'; token: string } | null) => void;

  // Auth & Multi-Device Control (Max 2 devices)
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  currentDeviceId: string;
  deviceNotice: string | null;
  clearDeviceNotice: () => void;
  login: (
    identifier: string,
    pass: string
  ) => Promise<{
    success: boolean;
    message?: string;
    deviceLimitReached?: boolean;
    activeDevices?: DeviceSession[];
    targetUserId?: string;
    targetUserName?: string;
  }>;
  loginWithGoogle: () => Promise<{
    success: boolean;
    message?: string;
    deviceLimitReached?: boolean;
    activeDevices?: DeviceSession[];
    targetUserId?: string;
    targetUserName?: string;
  }>;
  disconnectDeviceAndLogin: (
    userId: string,
    kickDeviceId: string
  ) => Promise<{ success: boolean; message?: string }>;
  disconnectUserDevice: (userId: string, targetDeviceId: string) => Promise<void>;
  resetUserDevices: (userId: string) => Promise<void>;
  logout: () => void;
  addUser: (user: Omit<UserAccount, 'id'>) => Promise<UserAccount>;
  updateUser: (userId: string, updates: Partial<UserAccount>) => Promise<void>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;

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
  addClient: (client: Omit<Client, 'id' | 'completedOrdersCount' | 'lifetimeValue' | 'avgOrderValue'>) => Promise<string>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'projectNo' | 'remainingPayment'>) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  incomes: IncomeTransaction[];
  addIncome: (income: Omit<IncomeTransaction, 'id'>) => Promise<string>;
  updateIncome: (id: string, updates: Partial<IncomeTransaction>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  expenses: ExpenseTransaction[];
  addExpense: (expense: Omit<ExpenseTransaction, 'id'>) => Promise<string>;
  updateExpense: (id: string, updates: Partial<ExpenseTransaction>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  proposals: Proposal[];
  addProposal: (proposal: Omit<Proposal, 'id' | 'proposalNumber' | 'shareToken' | 'createdAt'>) => Promise<Proposal>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<boolean>;
  acceptProposal: (token: string) => Promise<{
    proposal: Proposal;
    invoice: Invoice;
    invoiceToken: string;
    invoiceNumber: string;
    whatsappUrl: string;
  } | null>;
  rejectProposal: (token: string, reason?: string) => Promise<Proposal | null>;
  markProposalViewed: (token: string) => Promise<void>;
  recordProposalView: (token: string) => Promise<void>;

  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'shareToken' | 'createdAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<boolean>;
  recordInvoicePayment: (invoiceId: string, amount: number, method: IncomeTransaction['method'], notes?: string) => Promise<void>;
  markInvoiceAsPaid: (invoiceId: string, method?: IncomeTransaction['method']) => Promise<void>;

  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetAllDataToSeed: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Ensure URL does not stay on a broken share token
if (typeof window !== 'undefined') {
  if (window.location.pathname.startsWith('/share/') && !window.location.pathname.split('/')[3]) {
    try {
      window.history.replaceState({}, '', '/');
    } catch {
      // ignore
    }
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Local state initialized from localStorage for fast initial render
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

    if (!loadedSettings.agencyName) loadedSettings.agencyName = 'SP Digital';
    if (!loadedSettings.agencyTagline) loadedSettings.agencyTagline = 'Digital Partner Solution';
    if (!loadedSettings.users || loadedSettings.users.length === 0) {
      loadedSettings.users = [...DEFAULT_SETTINGS.users];
    }
    loadedSettings.teamMembers = loadedSettings.users;
    return loadedSettings;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const savedUser = localStorage.getItem('sugeng_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id && parsed.name) return parsed;
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      type: 'info' | 'warning' | 'alert' | 'success';
      date: string;
      invoiceToken?: string;
      invoiceNumber?: string;
      clientContact?: string;
      whatsappUrl?: string;
    }>
  >([]);

  // Public share URL detection
  const [publicShare, setPublicShare] = useState<{ type: 'proposal' | 'invoice'; token: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    const tokenParam = params.get('token');
    if (shareParam && tokenParam && (shareParam === 'proposal' || shareParam === 'invoice')) {
      return { type: shareParam as 'proposal' | 'invoice', token: tokenParam };
    }
    const path = window.location.pathname;
    const match = path.match(/^\/share\/(proposal|invoice)\/([^/]+)/);
    if (match && match[2]) {
      return { type: match[1] as 'proposal' | 'invoice', token: match[2] };
    }
    return null;
  });

  // Multi-Device Limit State (Max 2 devices)
  const [currentDeviceId] = useState<string>(() => getDeviceId());
  const [deviceNotice, setDeviceNotice] = useState<string | null>(null);
  const clearDeviceNotice = () => setDeviceNotice(null);

  // Periodic heartbeat to refresh device activity
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    const myDevId = getDeviceId();

    const updateHeartbeat = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data() as UserAccount;
          let devices = cleanActiveDevices(uData.activeDevices);
          let found = false;
          devices = devices.map((d) => {
            if (d.deviceId === myDevId) {
              found = true;
              return { ...d, lastActive: new Date().toISOString() };
            }
            return d;
          });
          if (found) {
            await setDoc(userRef, { activeDevices: devices }, { merge: true });
          }
        }
      } catch {
        // ignore network error
      }
    };

    const timer = setInterval(updateHeartbeat, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated, currentUser?.id]);

  // LocalStorage backups
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

  useEffect(() => {
    localStorage.setItem('sugeng_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Real-time Firebase Firestore Sync Listeners
  useEffect(() => {
    // 1. Sync Clients
    const unsubClients = onSnapshot(
      collection(db, 'clients'),
      (snapshot) => {
        setIsCloudSynced(true);
        const remoteClients: Client[] = [];
        snapshot.forEach((docSnap) => {
          remoteClients.push(docSnap.data() as Client);
        });
        setClients(remoteClients);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'clients');
      }
    );

    // 2. Sync Projects
    const unsubProjects = onSnapshot(
      collection(db, 'projects'),
      (snapshot) => {
        const remoteProjects: Project[] = [];
        snapshot.forEach((docSnap) => {
          remoteProjects.push(docSnap.data() as Project);
        });
        setProjects(remoteProjects);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'projects');
      }
    );

    // 3. Sync Incomes
    const unsubIncomes = onSnapshot(
      collection(db, 'incomes'),
      (snapshot) => {
        const remoteIncomes: IncomeTransaction[] = [];
        snapshot.forEach((docSnap) => {
          remoteIncomes.push(docSnap.data() as IncomeTransaction);
        });
        setIncomes(remoteIncomes);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'incomes');
      }
    );

    // 4. Sync Expenses
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const remoteExpenses: ExpenseTransaction[] = [];
        snapshot.forEach((docSnap) => {
          remoteExpenses.push(docSnap.data() as ExpenseTransaction);
        });
        setExpenses(remoteExpenses);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'expenses');
      }
    );

    // 5. Sync Proposals
    const unsubProposals = onSnapshot(
      collection(db, 'proposals'),
      (snapshot) => {
        const remoteProposals: Proposal[] = [];
        snapshot.forEach((docSnap) => {
          remoteProposals.push(docSnap.data() as Proposal);
        });
        setProposals(remoteProposals);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'proposals');
      }
    );

    // 6. Sync Invoices
    const unsubInvoices = onSnapshot(
      collection(db, 'invoices'),
      (snapshot) => {
        const remoteInvoices: Invoice[] = [];
        snapshot.forEach((docSnap) => {
          remoteInvoices.push(docSnap.data() as Invoice);
        });
        setInvoices(remoteInvoices);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'invoices');
      }
    );

    // 7. Sync Users collection (Real-time synchronization for all users, roles, passwords, and profiles)
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore users collection is completely empty on first launch, seed default users
          DEFAULT_SETTINGS.users.forEach((defaultUser) => {
            setDoc(doc(db, 'users', defaultUser.id), defaultUser).catch(() => {});
          });
          return;
        }

        const remoteUsers: UserAccount[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserAccount;
          remoteUsers.push({
            ...data,
            id: docSnap.id || data.id,
            name: data.name || 'User',
            email: data.email || '',
            role: data.role || 'Staff',
            password: data.password || 'Password01',
            avatar: data.avatar || '',
            activeDevices: cleanActiveDevices(data.activeDevices),
          });
        });

        // Deduplicate users strictly by id
        const usersById = new Map<string, UserAccount>();
        remoteUsers.forEach((u) => {
          usersById.set(u.id, u);
        });
        const cleanUsers = Array.from(usersById.values());

        setSettings((prev) => ({
          ...prev,
          users: cleanUsers,
          teamMembers: cleanUsers,
        }));

        // Real-time synchronization for currentUser state & localStorage
        setCurrentUser((prev) => {
          if (!prev) return cleanUsers[0];

          // Match by id first, then email (case-insensitive), then name (case-insensitive)
          const updatedCurrent = cleanUsers.find((u) => {
            if (u.id === prev.id) return true;
            if (u.email && prev.email && u.email.trim().toLowerCase() === prev.email.trim().toLowerCase()) return true;
            if (u.name && prev.name && u.name.trim().toLowerCase() === prev.name.trim().toLowerCase()) return true;
            return false;
          });

          if (updatedCurrent) {
            try {
              localStorage.setItem('sugeng_current_user', JSON.stringify(updatedCurrent));
            } catch {}

            // Real-time check: If current device was kicked out or disconnected
            const myDevId = getDeviceId();
            const activeDevs = cleanActiveDevices(updatedCurrent.activeDevices);
            const isSavedAuth = typeof window !== 'undefined' && localStorage.getItem('sugeng_auth') === 'true';

            if (
              isSavedAuth &&
              activeDevs.length > 0 &&
              !activeDevs.some((d) => d.deviceId === myDevId)
            ) {
              console.warn('Sesi perangkat diputus karena login di perangkat lain.');
              setIsAuthenticated(false);
              setActiveTab('dashboard');
              try {
                localStorage.removeItem('sugeng_auth');
              } catch {}
              setDeviceNotice(
                'Sesi akun Anda telah diputus karena akun ini telah login di perangkat lain (batas maksimal 2 perangkat).'
              );
            }

            return updatedCurrent;
          }
          return prev;
        });
      },
      (error) => {
        console.warn('Users collection sync notice:', error);
      }
    );

    // 8. Sync Settings document
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'agency'),
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as Partial<AppSettings>;
          setSettings((prev) => {
            const currentUsers =
              prev.users && prev.users.length > 0
                ? prev.users
                : remoteData.users && remoteData.users.length > 0
                ? remoteData.users
                : DEFAULT_SETTINGS.users;
            return {
              ...prev,
              ...remoteData,
              users: currentUsers,
              teamMembers: currentUsers,
            };
          });
        } else {
          // Initialize settings doc in Firestore
          setDoc(doc(db, 'settings', 'agency'), DEFAULT_SETTINGS).catch(() => {});
        }
      },
      (error) => {
        console.warn('Settings agency sync notice:', error);
      }
    );

    return () => {
      unsubClients();
      unsubProjects();
      unsubIncomes();
      unsubExpenses();
      unsubProposals();
      unsubInvoices();
      unsubUsers();
      unsubSettings();
    };
  }, []);

  // Enriched derived data
  const enrichedClients = useMemo(() => {
    return clients.map((c) => {
      const clientProjects = projects.filter(
        (p) => p.clientId === c.id || p.clientName.toLowerCase() === c.name.toLowerCase()
      );
      const completedOrdersCount = clientProjects.filter((p) => p.status === 'Selesai').length;
      const lifetimeValue = clientProjects.reduce((sum, p) => sum + (p.projectValue || 0), 0);
      const avgOrderValue =
        completedOrdersCount > 0 ? Math.round(lifetimeValue / completedOrdersCount) : 0;

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

  const enrichedProjects = useMemo(() => {
    return projects.map((p) => ({
      ...p,
      remainingPayment: Math.max(0, (p.projectValue || 0) - (p.dpReceived || 0)),
    }));
  }, [projects]);

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
  const addClient = async (
    data: Omit<Client, 'id' | 'completedOrdersCount' | 'lifetimeValue' | 'avgOrderValue'>
  ): Promise<string> => {
    const newId = `cli-${Date.now().toString().slice(-4)}`;
    const newClient: Client = {
      ...data,
      id: newId,
    };
    setClients((prev) => [newClient, ...prev]);
    try {
      await setDoc(doc(db, 'clients', newId), newClient);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `clients/${newId}`);
    }
    return newId;
  };

  const updateClient = async (id: string, updates: Partial<Client>): Promise<void> => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
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
    try {
      await setDoc(doc(db, 'clients', id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `clients/${id}`);
    }
  };

  // Project actions
  const addProject = async (
    data: Omit<Project, 'id' | 'projectNo' | 'remainingPayment'>
  ): Promise<string> => {
    const maxNo = projects.reduce((max, p) => Math.max(max, p.projectNo || 0), 0);
    const newId = `prj-${Date.now().toString().slice(-4)}`;
    const remainingPayment = Math.max(0, data.projectValue - (data.dpReceived || 0));

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

    try {
      await setDoc(doc(db, 'projects', newId), newProject);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${newId}`);
    }

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

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
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

    try {
      await setDoc(doc(db, 'projects', id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
    }
  };

  // Income actions
  const addIncome = async (data: Omit<IncomeTransaction, 'id'>): Promise<string> => {
    const newId = `inc-${Date.now().toString().slice(-4)}`;
    const newTx: IncomeTransaction = { ...data, id: newId };
    setIncomes((prev) => [newTx, ...prev]);
    try {
      await setDoc(doc(db, 'incomes', newId), newTx);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `incomes/${newId}`);
    }
    return newId;
  };

  const updateIncome = async (id: string, updates: Partial<IncomeTransaction>): Promise<void> => {
    setIncomes((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    try {
      await setDoc(doc(db, 'incomes', id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `incomes/${id}`);
    }
  };

  const deleteIncome = async (id: string): Promise<void> => {
    setIncomes((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, 'incomes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `incomes/${id}`);
    }
  };

  // Expense actions
  const addExpense = async (data: Omit<ExpenseTransaction, 'id'>): Promise<string> => {
    const newId = `exp-${Date.now().toString().slice(-4)}`;
    const newTx: ExpenseTransaction = { ...data, id: newId };
    setExpenses((prev) => [newTx, ...prev]);
    try {
      await setDoc(doc(db, 'expenses', newId), newTx);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `expenses/${newId}`);
    }
    return newId;
  };

  const updateExpense = async (id: string, updates: Partial<ExpenseTransaction>): Promise<void> => {
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    try {
      await setDoc(doc(db, 'expenses', id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `expenses/${id}`);
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
    }
  };

  // Proposal actions
  const addProposal = async (
    data: Omit<Proposal, 'id' | 'proposalNumber' | 'shareToken' | 'createdAt'>
  ): Promise<Proposal> => {
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
    try {
      await setDoc(doc(db, 'proposals', newId), newProposal);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `proposals/${newId}`);
    }
    return newProposal;
  };

  const updateProposal = async (id: string, updates: Partial<Proposal>): Promise<void> => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    try {
      await setDoc(doc(db, 'proposals', id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `proposals/${id}`);
    }
  };

  const deleteProposal = async (id: string): Promise<boolean> => {
    if (!isAdminRole(currentUser?.role)) {
      console.warn('Izin ditolak: Hanya Admin/Owner yang dapat menghapus proposal.');
      return false;
    }
    setProposals((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, 'proposals', id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `proposals/${id}`);
    }
  };

  const markProposalViewed = async (token: string): Promise<void> => {
    const target = proposals.find((p) => p.shareToken === token);
    if (!target) return;
    if (target.status === 'Draft' || target.status === 'Terkirim') {
      const updates = {
        status: 'Dilihat' as const,
        viewedAt: new Date().toLocaleString('id-ID'),
      };
      setProposals((prev) => prev.map((p) => (p.id === target.id ? { ...p, ...updates } : p)));
      try {
        await setDoc(doc(db, 'proposals', target.id), updates, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `proposals/${target.id}`);
      }
    }
  };

  const recordProposalView = async (token: string): Promise<void> => {
    await markProposalViewed(token);
  };

  const acceptProposal = async (token: string) => {
    const proposal = proposals.find((p) => p.shareToken === token);
    if (!proposal) return null;

    const year = new Date().getFullYear();
    const invCount = invoices.length + 1;
    const invoiceNumber = `INV-${year}-${invCount.toString().padStart(6, '0')}`;
    const invToken = `inv-${Math.random().toString(36).substring(2, 10)}`;
    const newInvId = `inv-${Date.now().toString().slice(-4)}`;

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

    try {
      await setDoc(doc(db, 'proposals', proposal.id), updatedProposal, { merge: true });
      await setDoc(doc(db, 'invoices', newInvId), newInvoice);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `proposals/${proposal.id}`);
    }

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

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const invoiceUrl = `${origin}/share/invoice/${invToken}`;
    const primaryBank = settings.bankAccounts?.[0] || {
      bankName: settings.bankName || 'BCA',
      accountNumber: settings.bankAccount || '829-019-8273',
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

  const rejectProposal = async (token: string, reason: string = 'Klien menolak proposal') => {
    const proposal = proposals.find((p) => p.shareToken === token);
    if (!proposal) return null;

    const updated: Proposal = {
      ...proposal,
      status: 'Ditolak',
      respondedAt: new Date().toLocaleString('id-ID'),
      rejectionReason: reason,
    };

    setProposals((prev) => prev.map((p) => (p.id === proposal.id ? updated : p)));
    try {
      await setDoc(doc(db, 'proposals', proposal.id), updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `proposals/${proposal.id}`);
    }

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
  const addInvoice = async (
    data: Omit<Invoice, 'id' | 'invoiceNumber' | 'shareToken' | 'createdAt'>
  ): Promise<Invoice> => {
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
    try {
      await setDoc(doc(db, 'invoices', newId), newInvoice);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `invoices/${newId}`);
    }
    return newInvoice;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<void> => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)));
    try {
      await setDoc(doc(db, 'invoices', id), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${id}`);
    }
  };

  const deleteInvoice = async (id: string): Promise<boolean> => {
    if (!isAdminRole(currentUser?.role)) {
      console.warn('Izin ditolak: Hanya Admin/Owner yang dapat menghapus invoice.');
      return false;
    }
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    try {
      await deleteDoc(doc(db, 'invoices', id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `invoices/${id}`);
    }
  };

  const recordInvoicePayment = async (
    invoiceId: string,
    amount: number,
    method: IncomeTransaction['method'],
    notes?: string
  ): Promise<void> => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    const newAmountPaid = (invoice.amountPaid || 0) + amount;
    const isFull = newAmountPaid >= invoice.totalAmount;
    const newStatus: Invoice['status'] = isFull ? 'Lunas' : 'DP Diterima';

    const invUpdates: Partial<Invoice> = {
      amountPaid: newAmountPaid,
      status: newStatus,
      paidAt: new Date().toISOString().split('T')[0],
      paymentNotes: notes || `Pembayaran ${isFull ? 'Pelunasan' : 'DP'} via ${method}`,
    };

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, ...invUpdates } : inv))
    );

    try {
      await setDoc(doc(db, 'invoices', invoiceId), invUpdates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${invoiceId}`);
    }

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

  const markInvoiceAsPaid = async (
    invoiceId: string,
    method: IncomeTransaction['method'] = 'Transfer Bank'
  ): Promise<void> => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    const remaining = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
    await recordInvoicePayment(invoiceId, remaining > 0 ? remaining : inv.totalAmount, method);
  };

  const updateSettings = async (updates: Partial<AppSettings>): Promise<void> => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('sugeng_settings', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    try {
      await setDoc(doc(db, 'settings', 'agency'), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/agency');
    }
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Login handler with 2-device limit enforcement
  const login = async (
    identifier: string,
    pass: string
  ): Promise<{
    success: boolean;
    message?: string;
    deviceLimitReached?: boolean;
    activeDevices?: DeviceSession[];
    targetUserId?: string;
    targetUserName?: string;
  }> => {
    const trimmedId = identifier.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // Query Firestore directly for the freshest real-time users list
    let freshUsers: UserAccount[] = [];
    try {
      const userSnaps = await getDocs(collection(db, 'users'));
      userSnaps.forEach((d) => {
        const u = { ...d.data(), id: d.id } as UserAccount;
        if (u.name) freshUsers.push(u);
      });
    } catch {
      // fallback to settings/memory if offline
      freshUsers = settings.users || [];
    }

    if (freshUsers.length === 0) {
      freshUsers = settings.users || DEFAULT_SETTINGS.users;
    }

    // Match order:
    // 1. Exact email match
    // 2. Exact name match
    // 3. Name contains trimmedId
    const matchedUser =
      freshUsers.find((u) => u.email && u.email.trim().toLowerCase() === trimmedId) ||
      freshUsers.find((u) => u.name && u.name.trim().toLowerCase() === trimmedId) ||
      freshUsers.find((u) => u.name && u.name.trim().toLowerCase().includes(trimmedId));

    if (!matchedUser) {
      return { success: false, message: 'Email atau Nama Pengguna tidak ditemukan.' };
    }

    const savedPass = (matchedUser.password || '').trim();
    if (savedPass !== trimmedPass) {
      return { success: false, message: 'Password salah. Silakan periksa kembali.' };
    }

    // MULTI-DEVICE LIMIT ENFORCEMENT (Maksimal 2 device aktif)
    const myDevId = getDeviceId();
    const mySession = getCurrentDeviceSession();
    const existingDevices = cleanActiveDevices(matchedUser.activeDevices);
    const isCurrentAlreadyRegistered = existingDevices.some((d) => d.deviceId === myDevId);

    let updatedDevices: DeviceSession[];

    if (isCurrentAlreadyRegistered) {
      // Re-login from same device: update last active timestamp
      updatedDevices = existingDevices.map((d) =>
        d.deviceId === myDevId ? { ...d, lastActive: new Date().toISOString() } : d
      );
    } else if (existingDevices.length < 2) {
      // Slot available: 1st or 2nd active device
      updatedDevices = [...existingDevices, mySession];
    } else {
      // Already 2 active devices!
      return {
        success: false,
        deviceLimitReached: true,
        activeDevices: existingDevices,
        targetUserId: matchedUser.id,
        targetUserName: matchedUser.name,
        message: `Batas maksimal 2 perangkat tercapai. Akun "${matchedUser.name}" sedang aktif di 2 perangkat lain.`,
      };
    }

    // Persist updated devices list in Firestore
    try {
      await setDoc(doc(db, 'users', matchedUser.id), { activeDevices: updatedDevices }, { merge: true });
    } catch (e) {
      console.warn('Gagal menyimpan sesi perangkat di Firestore:', e);
    }

    const updatedUserWithDevices: UserAccount = {
      ...matchedUser,
      activeDevices: updatedDevices,
    };

    setCurrentUser(updatedUserWithDevices);
    setIsAuthenticated(true);
    // CRITICAL: Always reset activeTab to 'dashboard' on login so a user isn't stuck on restricted views!
    setActiveTab('dashboard');

    try {
      localStorage.setItem('sugeng_auth', 'true');
      localStorage.setItem('sugeng_current_user', JSON.stringify(updatedUserWithDevices));
    } catch {
      // ignore
    }
    return { success: true };
  };

  // Google Login with Firebase Auth and 2-device limit
  const loginWithGoogle = async (): Promise<{
    success: boolean;
    message?: string;
    deviceLimitReached?: boolean;
    activeDevices?: DeviceSession[];
    targetUserId?: string;
    targetUserName?: string;
  }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const email = firebaseUser.email?.toLowerCase() || '';

      let userList = settings.users || [];
      let matched = userList.find((u) => u.email.toLowerCase() === email);

      if (!matched) {
        const isOwnerEmail = email === 'pray.sugeng17@gmail.com' || email.includes('sugeng');
        const newUser: UserAccount = {
          id: `usr-${Date.now()}`,
          name: firebaseUser.displayName || 'Sugeng Prayitno',
          email,
          role: isOwnerEmail ? 'Owner/Admin' : 'Staff',
          avatar: firebaseUser.photoURL || '',
          activeDevices: [],
        };
        matched = await addUser(newUser);
      }

      // Check device limit (Max 2 devices)
      const myDevId = getDeviceId();
      const mySession = getCurrentDeviceSession();
      const existingDevices = cleanActiveDevices(matched.activeDevices);
      const isCurrentAlreadyRegistered = existingDevices.some((d) => d.deviceId === myDevId);

      let updatedDevices: DeviceSession[];
      if (isCurrentAlreadyRegistered) {
        updatedDevices = existingDevices.map((d) =>
          d.deviceId === myDevId ? { ...d, lastActive: new Date().toISOString() } : d
        );
      } else if (existingDevices.length < 2) {
        updatedDevices = [...existingDevices, mySession];
      } else {
        return {
          success: false,
          deviceLimitReached: true,
          activeDevices: existingDevices,
          targetUserId: matched.id,
          targetUserName: matched.name,
          message: `Batas maksimal 2 perangkat tercapai. Akun Google ini sedang aktif di 2 perangkat lain.`,
        };
      }

      try {
        await setDoc(doc(db, 'users', matched.id), { activeDevices: updatedDevices }, { merge: true });
      } catch {}

      const updatedUser: UserAccount = { ...matched, activeDevices: updatedDevices };
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      setActiveTab('dashboard');
      try {
        localStorage.setItem('sugeng_auth', 'true');
        localStorage.setItem('sugeng_current_user', JSON.stringify(updatedUser));
      } catch {}
      return { success: true };
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      if (
        errObj?.code === 'auth/unauthorized-domain' ||
        (errObj?.message && errObj.message.includes('unauthorized-domain'))
      ) {
        return {
          success: false,
          message:
            'Domain deployment ini belum didaftarkan di Firebase Authorized Domains. Silakan login menggunakan Email/Nama Pengguna & Password di atas, atau daftarkan domain di Firebase Console > Authentication > Settings > Authorized Domains.',
        };
      }
      const msg = err instanceof Error ? err.message : 'Login Google dibatalkan atau gagal.';
      return { success: false, message: msg };
    }
  };

  // Disconnect a specific or oldest device and complete login on this device
  const disconnectDeviceAndLogin = async (
    userId: string,
    kickDeviceId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      let targetUser = settings.users?.find((u) => u.id === userId);
      if (!targetUser) {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) {
          targetUser = { ...snap.data(), id: snap.id } as UserAccount;
        }
      }
      if (!targetUser) {
        return { success: false, message: 'Data pengguna tidak ditemukan.' };
      }

      const currentSession = getCurrentDeviceSession();
      const existingDevices = cleanActiveDevices(targetUser.activeDevices);

      let remainingDevices: DeviceSession[];
      if (kickDeviceId === 'oldest') {
        const sorted = [...existingDevices].sort(
          (a, b) =>
            new Date(a.lastActive || a.createdAt || 0).getTime() -
            new Date(b.lastActive || b.createdAt || 0).getTime()
        );
        const oldestId = sorted[0]?.deviceId;
        remainingDevices = existingDevices.filter((d) => d.deviceId !== oldestId);
      } else {
        remainingDevices = existingDevices.filter((d) => d.deviceId !== kickDeviceId);
      }

      // Ensure at most 1 remaining device, then append current device -> total 2 devices
      const updatedDevices = [...remainingDevices.slice(0, 1), currentSession];
      const fullUpdatedUser: UserAccount = {
        ...targetUser,
        activeDevices: updatedDevices,
      };

      await setDoc(doc(db, 'users', userId), { activeDevices: updatedDevices }, { merge: true });

      setCurrentUser(fullUpdatedUser);
      setIsAuthenticated(true);
      setActiveTab('dashboard');
      try {
        localStorage.setItem('sugeng_auth', 'true');
        localStorage.setItem('sugeng_current_user', JSON.stringify(fullUpdatedUser));
      } catch {}

      return { success: true };
    } catch {
      return { success: false, message: 'Gagal memutuskan perangkat dan masuk. Silakan coba lagi.' };
    }
  };

  // Disconnect a specific device for a user (can be called by user or admin)
  const disconnectUserDevice = async (userId: string, targetDeviceId: string): Promise<void> => {
    const user =
      settings.users?.find((u) => u.id === userId) ||
      (currentUser.id === userId ? currentUser : undefined);
    if (!user) return;
    const remaining = cleanActiveDevices(user.activeDevices).filter((d) => d.deviceId !== targetDeviceId);
    await updateUser(userId, { activeDevices: remaining });
  };

  // Reset all active devices for a user (admin emergency reset)
  const resetUserDevices = async (userId: string): Promise<void> => {
    await updateUser(userId, { activeDevices: [] });
  };

  const logout = () => {
    const myDevId = getDeviceId();
    if (currentUser && currentUser.id) {
      const remaining = cleanActiveDevices(currentUser.activeDevices).filter((d) => d.deviceId !== myDevId);
      setDoc(doc(db, 'users', currentUser.id), { activeDevices: remaining }, { merge: true }).catch(() => {});
    }
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    try {
      localStorage.removeItem('sugeng_auth');
    } catch {}
  };

  // User management
  const addUser = async (user: Omit<UserAccount, 'id'>): Promise<UserAccount> => {
    const newUser: UserAccount = {
      ...user,
      id: `usr-${Date.now()}`,
      password: user.password || 'Password01',
      avatar: user.avatar || '',
    };
    const updatedUsers = [...(settings.users || []), newUser];
    const newSettings: AppSettings = {
      ...settings,
      users: updatedUsers,
      teamMembers: updatedUsers,
    };
    setSettings(newSettings);
    try {
      localStorage.setItem('sugeng_settings', JSON.stringify(newSettings));
    } catch {}

    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
      await setDoc(
        doc(db, 'settings', 'agency'),
        { users: updatedUsers, teamMembers: updatedUsers },
        { merge: true }
      ).catch(() => {});
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${newUser.id}`);
    }

    return newUser;
  };

  const updateUser = async (userId: string, updates: Partial<UserAccount>): Promise<void> => {
    const existing =
      settings.users?.find((u) => u.id === userId) ||
      (currentUser.id === userId ? currentUser : undefined) ||
      DEFAULT_SETTINGS.users.find((u) => u.id === userId);

    const fullUpdatedUser: UserAccount = {
      id: userId,
      name: updates.name !== undefined ? updates.name : (existing?.name ?? 'User'),
      email: updates.email !== undefined ? updates.email : (existing?.email ?? ''),
      role: updates.role !== undefined ? updates.role : (existing?.role ?? 'Staff'),
      password: updates.password !== undefined ? updates.password : (existing?.password ?? 'Password01'),
      avatar: updates.avatar !== undefined ? updates.avatar : (existing?.avatar ?? ''),
      activeDevices:
        updates.activeDevices !== undefined
          ? updates.activeDevices
          : (existing?.activeDevices ?? []),
    };

    const updatedUsers = (settings.users || []).map((u) => (u.id === userId ? fullUpdatedUser : u));
    if (!updatedUsers.some((u) => u.id === userId)) {
      updatedUsers.push(fullUpdatedUser);
    }

    const newSettings: AppSettings = {
      ...settings,
      users: updatedUsers,
      teamMembers: updatedUsers,
    };
    setSettings(newSettings);
    try {
      localStorage.setItem('sugeng_settings', JSON.stringify(newSettings));
    } catch {}

    if (
      currentUser.id === userId ||
      (currentUser.email && fullUpdatedUser.email && currentUser.email.toLowerCase() === fullUpdatedUser.email.toLowerCase()) ||
      (currentUser.name && fullUpdatedUser.name && currentUser.name.toLowerCase() === fullUpdatedUser.name.toLowerCase())
    ) {
      setCurrentUser(fullUpdatedUser);
      try {
        localStorage.setItem('sugeng_current_user', JSON.stringify(fullUpdatedUser));
      } catch {}
    }

    try {
      // 1. Direct update to target user document
      await setDoc(doc(db, 'users', userId), fullUpdatedUser, { merge: true });

      // 2. Also keep 'settings/agency' in sync
      await setDoc(
        doc(db, 'settings', 'agency'),
        { users: updatedUsers, teamMembers: updatedUsers },
        { merge: true }
      ).catch(() => {});

      // 3. Check for any duplicate document with the same email or name in Firestore and sync it
      const snaps = await getDocs(collection(db, 'users'));
      snaps.forEach((d) => {
        if (d.id !== userId) {
          const dData = d.data() as UserAccount;
          const sameEmail = Boolean(fullUpdatedUser.email && dData.email && dData.email.trim().toLowerCase() === fullUpdatedUser.email.trim().toLowerCase());
          const sameName = Boolean(fullUpdatedUser.name && dData.name && dData.name.trim().toLowerCase() === fullUpdatedUser.name.trim().toLowerCase());
          if (sameEmail || sameName) {
            setDoc(doc(db, 'users', d.id), { ...fullUpdatedUser, id: d.id }, { merge: true }).catch(() => {});
          }
        }
      });
    } catch (err) {
      console.error('Update user Firestore error:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; message?: string }> => {
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
    try {
      localStorage.setItem('sugeng_settings', JSON.stringify(newSettings));
    } catch {}

    if (currentUser.id === userId) {
      setCurrentUser(updatedUsers[0]);
      try {
        localStorage.setItem('sugeng_current_user', JSON.stringify(updatedUsers[0]));
      } catch {}
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      await setDoc(
        doc(db, 'settings', 'agency'),
        { users: updatedUsers, teamMembers: updatedUsers },
        { merge: true }
      ).catch(() => {});
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
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
        isCloudSynced,
        publicShare,
        setPublicShare,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        setIsAuthenticated,
        currentDeviceId,
        deviceNotice,
        clearDeviceNotice,
        login,
        loginWithGoogle,
        disconnectDeviceAndLogin,
        disconnectUserDevice,
        resetUserDevices,
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
