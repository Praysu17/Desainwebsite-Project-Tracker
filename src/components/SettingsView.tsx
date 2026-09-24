import React, { useEffect, useState } from 'react';
import {
  Settings,
  Building2,
  FileText,
  Tag,
  Users,
  Percent,
  Plus,
  Trash2,
  Save,
  Check,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Pencil,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AgencySettings, PartnerSplit, TeamMember, UserAccount } from '../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, currentUser, addUser, updateUser, deleteUser } = useApp();

  const [activeTab, setActiveTab] = useState<
    'agency' | 'templates' | 'categories' | 'team' | 'split'
  >('agency');

  // Local copy of settings for easy editing with safe fallbacks
  const [formData, setFormData] = useState<AgencySettings>(() => {
    const current = { ...settings };
    const members = (current.teamMembers && current.teamMembers.length > 0)
      ? current.teamMembers
      : (current.users && current.users.length > 0 ? current.users : []);
    return {
      ...current,
      teamMembers: members,
      users: members,
      expenseCategories: current.expenseCategories || [],
      partnerSplits: current.partnerSplits || [],
    };
  });
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync formData when settings context changes
  useEffect(() => {
    if (settings) {
      const members = (settings.teamMembers && settings.teamMembers.length > 0)
        ? settings.teamMembers
        : (settings.users && settings.users.length > 0 ? settings.users : []);
      setFormData((prev) => ({
        ...prev,
        ...settings,
        teamMembers: members,
        users: members,
        expenseCategories: settings.expenseCategories || prev.expenseCategories || [],
        partnerSplits: settings.partnerSplits || prev.partnerSplits || [],
      }));
    }
  }, [settings]);

  // New Category Input
  const [newCategoryName, setNewCategoryName] = useState('');

  // New Team Member Input with Password
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserAccount['role']>('Project Manager');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('Password01');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: UserAccount['role'];
    password: string;
  }>({
    name: '',
    email: '',
    role: 'Staff',
    password: '',
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Delete User Confirmation State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserAccount | null>(null);
  const [userNotice, setUserNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // New Partner Split Input
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerPercent, setNewPartnerPercent] = useState<number>(50);

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings(formData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Categories helper
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const currentCats = formData.expenseCategories || [];
    if (currentCats.includes(newCategoryName.trim())) return;

    const updated = [...currentCats, newCategoryName.trim()];
    const newSettings = { ...formData, expenseCategories: updated };
    setFormData(newSettings);
    updateSettings(newSettings);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (cat: string) => {
    const currentCats = formData.expenseCategories || [];
    const updated = currentCats.filter((c) => c !== cat);
    const newSettings = { ...formData, expenseCategories: updated };
    setFormData(newSettings);
    updateSettings(newSettings);
  };

  // Team / User Management helpers
  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      setUserNotice({ type: 'error', message: 'Nama pengguna tidak boleh kosong.' });
      setTimeout(() => setUserNotice(null), 3000);
      return;
    }
    const newMemberData: Omit<UserAccount, 'id'> = {
      name: newMemberName.trim(),
      role: newMemberRole,
      email:
        newMemberEmail.trim() ||
        `${newMemberName.toLowerCase().replace(/\s+/g, '')}@agency.com`,
      password: newMemberPassword.trim() || 'Password01',
    };

    const createdUser = await addUser(newMemberData);

    const currentList = formData.teamMembers || formData.users || [];
    const updated = [...currentList, createdUser];
    const newSettings = { ...formData, teamMembers: updated, users: updated };
    setFormData(newSettings);

    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPassword('Password01');
    setUserNotice({
      type: 'success',
      message: `Pengguna "${createdUser.name}" dengan role ${createdUser.role} berhasil ditambahkan!`,
    });
    setTimeout(() => setUserNotice(null), 3000);
  };

  const handleStartEdit = (user: UserAccount) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email || '',
      role: user.role || 'Staff',
      password: user.password || 'Password01',
    });
    setShowEditPassword(false);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editForm.name.trim()) {
      setUserNotice({ type: 'error', message: 'Nama tidak boleh kosong.' });
      setTimeout(() => setUserNotice(null), 3000);
      return;
    }

    const updates = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      password: editForm.password.trim(),
    };

    await updateUser(editingUser.id, updates);

    const currentList = formData.teamMembers || formData.users || [];
    const updated = currentList.map((m) => {
      if (m.id === editingUser.id) {
        return {
          ...m,
          ...updates,
        };
      }
      return m;
    });

    const newSettings = { ...formData, teamMembers: updated, users: updated };
    setFormData(newSettings);

    setEditingUser(null);
    setUserNotice({
      type: 'success',
      message: `Akun "${editForm.name}" berhasil diperbarui!`,
    });
    setTimeout(() => setUserNotice(null), 3000);
  };

  const handleDeleteMember = async (member: TeamMember) => {
    const currentList = formData.teamMembers || formData.users || [];
    if (currentList.length <= 1) {
      setUserNotice({
        type: 'error',
        message: 'Gagal: Tidak dapat menghapus satu-satunya akun pengguna yang ada.',
      });
      setTimeout(() => setUserNotice(null), 3500);
      setDeleteConfirmUser(null);
      return;
    }
    if (
      member.role === 'Owner/Admin' &&
      currentList.filter((m) => m.role === 'Owner/Admin').length <= 1
    ) {
      setUserNotice({
        type: 'error',
        message: 'Gagal: Tidak dapat menghapus admin utama satu-satunya.',
      });
      setTimeout(() => setUserNotice(null), 3500);
      setDeleteConfirmUser(null);
      return;
    }

    const res = await deleteUser(member.id);
    if (!res.success) {
      setUserNotice({ type: 'error', message: res.message || 'Gagal menghapus pengguna.' });
      setTimeout(() => setUserNotice(null), 3500);
      setDeleteConfirmUser(null);
      return;
    }

    const updated = currentList.filter((m) => m.id !== member.id);
    const newSettings = { ...formData, teamMembers: updated, users: updated };
    setFormData(newSettings);
    setDeleteConfirmUser(null);
    setUserNotice({
      type: 'success',
      message: `Pengguna "${member.name}" berhasil dihapus.`,
    });
    setTimeout(() => setUserNotice(null), 3000);
  };

  // Partner Split helper
  const handleAddPartner = () => {
    if (!newPartnerName.trim()) return;
    const currentSplits = formData.partnerSplits || [];
    const newPartner: PartnerSplit = {
      id: `prt-${Date.now()}`,
      name: newPartnerName.trim(),
      percentage: Number(newPartnerPercent) || 0,
    };
    const updated = [...currentSplits, newPartner];
    const newSettings = { ...formData, partnerSplits: updated };
    setFormData(newSettings);
    updateSettings(newSettings);
    setNewPartnerName('');
  };

  const handleRemovePartner = (id: string) => {
    const currentSplits = formData.partnerSplits || [];
    const updated = currentSplits.filter((p) => p.id !== id);
    const newSettings = { ...formData, partnerSplits: updated };
    setFormData(newSettings);
    updateSettings(newSettings);
  };

  const totalSplitPercentage = (formData.partnerSplits || []).reduce((sum, p) => sum + p.percentage, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Panel Pengaturan Agensi
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Identitas bisnis, nomor rekening, template proposal/invoice, kategori, dan split profit
          </p>
        </div>

        <button
          onClick={() => handleSaveAll()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          {savedNotice ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Pengaturan Tersimpan!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-cyan-400" />
              <span>Simpan Perubahan</span>
            </>
          )}
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('agency')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'agency'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Identitas Bisnis & Rekening</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Template Proposal & Invoice</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kategori Pengeluaran</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'team'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Tim & PIC</span>
        </button>

        <button
          onClick={() => setActiveTab('split')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'split'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Pengaturan Split Profit</span>
        </button>
      </div>

      {/* Tab Content: 1. Identitas Bisnis & Rekening Bank */}
      {activeTab === 'agency' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Identitas Bisnis & Informasi Perusahaan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data ini secara otomatis dicantumkan pada header, informasi tagihan, dan surat penawaran publik
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Agensi / Bisnis</label>
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={formData.agencyTagline}
                onChange={(e) => setFormData({ ...formData, agencyTagline: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Agensi</label>
              <input
                type="text"
                value={formData.agencyPhone}
                onChange={(e) => setFormData({ ...formData, agencyPhone: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Agensi</label>
              <input
                type="email"
                value={formData.agencyEmail}
                onChange={(e) => setFormData({ ...formData, agencyEmail: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor / Studio</label>
              <input
                type="text"
                value={formData.agencyAddress}
                onChange={(e) => setFormData({ ...formData, agencyAddress: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-600" />
              <span>Instruksi Rekening Bank untuk Invoice</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="BCA / Mandiri / BRI"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  placeholder="8735-0982-12"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Atas Nama (A/N)</label>
                <input
                  type="text"
                  value={formData.bankHolder}
                  onChange={(e) => setFormData({ ...formData, bankHolder: e.target.value })}
                  placeholder="Sugeng Pratama"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: 2. Template Proposal & Invoice */}
      {activeTab === 'templates' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Template & Konfigurasi Dokumen Publik
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur klausul syarat & ketentuan default serta otomatisasi persentase DP tagihan
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Persentase Tagihan Invoice Awal Saat Proposal Disetujui
              </label>
              <select
                value={formData.autoInvoicePercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoInvoicePercentage: parseInt(e.target.value, 10),
                  })
                }
                className="w-full sm:w-72 px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white font-bold"
              >
                <option value={50}>DP 50% (Rekomendasi)</option>
                <option value={30}>DP 30%</option>
                <option value={100}>Full 100% (Pelunasan di Depan)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Ketika klien menekan tombol "Terima Proposal", sistem otomatis menerbitkan invoice pertama sesuai persentase ini.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Syarat & Ketentuan Proposal
              </label>
              <textarea
                rows={4}
                value={formData.proposalDefaultTerms}
                onChange={(e) =>
                  setFormData({ ...formData, proposalDefaultTerms: e.target.value })
                }
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Kaki & Instruksi Default Invoice
              </label>
              <textarea
                rows={3}
                value={formData.invoiceDefaultNotes}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceDefaultNotes: e.target.value })
                }
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: 3. Kategori Pengeluaran */}
      {activeTab === 'categories' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Manajemen Kategori Pengeluaran</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola pos kategori biaya operasional agency yang digunakan di modul Keuangan
            </p>
          </div>

          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ketik nama kategori baru..."
              className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
            {(formData.expenseCategories || []).map((cat) => (
              <div
                key={cat}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-800">{cat}</span>
                <button
                  onClick={() => handleRemoveCategory(cat)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: 4. Manajemen Tim, Pengguna & PIC */}
      {activeTab === 'team' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                <span>Manajemen Pengguna & Tim (User Management)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola akun pengguna, hak akses login, dan password tim internal agensi
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 w-fit">
              Total: {(formData.teamMembers || formData.users || []).length} Pengguna
            </span>
          </div>

          {/* User Notice Toast / Alert */}
          {userNotice && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-150 ${
                userNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {userNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{userNotice.message}</span>
            </div>
          )}

          {/* Add Team Member / User Form */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-600" />
                <span>Tambah Pengguna Baru</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Pengguna baru akan dapat langsung login ke aplikasi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  id="input-new-user-name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Pengguna</label>
                <input
                  type="email"
                  id="input-new-user-email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="budi@agency.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Peran</label>
                <select
                  id="select-new-user-role"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-semibold text-slate-800"
                >
                  <option value="Admin">Admin</option>
                  <option value="Owner/Admin">Owner/Admin</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="input-new-user-password"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="Ketik password..."
                    className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-mono text-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                id="btn-add-user-submit"
                onClick={handleAddMember}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Simpan & Tambah Pengguna</span>
              </button>
            </div>
          </div>

          {/* Team / Users Table List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role Akses</th>
                    <th className="py-3 px-4">Kolom Password</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(formData.teamMembers || formData.users || []).map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-8 h-8 rounded-xl object-cover border border-cyan-500/40 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-300 shadow-xs shrink-0">
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{member.name}</span>
                            {currentUser.id === member.id && (
                              <span className="text-[10px] text-cyan-600 font-bold">
                                (Akun Anda Saat Ini)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {member.email || '-'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            member.role === 'Owner/Admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : member.role === 'Admin'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              : member.role === 'Project Manager'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{member.role}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700">
                          <span className="text-xs">
                            {revealedPasswords[member.id]
                              ? member.password || 'Password01'
                              : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRevealPassword(member.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                            title={revealedPasswords[member.id] ? 'Sembunyikan' : 'Tampilkan password'}
                          >
                            {revealedPasswords[member.id] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(member)}
                            id={`btn-edit-user-${member.id}`}
                            className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                            title="Edit Akun Pengguna"
                          >
                            <Pencil className="w-3.5 h-3.5 text-cyan-600" />
                            <span className="text-[11px] hidden sm:inline">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmUser(member)}
                            id={`btn-delete-user-${member.id}`}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-[11px] hidden sm:inline text-rose-500">Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(formData.teamMembers || formData.users || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic text-xs">
                        Belum ada pengguna terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-cyan-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Edit Akun Pengguna: {editingUser.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditUser} className="p-5 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Pengguna</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Peran</label>
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-semibold text-slate-800"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Owner/Admin">Owner/Admin</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">
                        Password Baru / Ubah Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="text-[11px] text-cyan-600 hover:text-cyan-700 font-medium"
                      >
                        {showEditPassword ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        required
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-mono text-slate-800 text-xs"
                      />
                      <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      id="btn-confirm-save-edit-user"
                      className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete User Confirmation Dialog */}
          {deleteConfirmUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Pengguna</h4>
                </div>

                <p className="text-xs text-slate-600">
                  Apakah Anda yakin ingin menghapus akun pengguna{' '}
                  <span className="font-bold text-slate-900">"{deleteConfirmUser.name}"</span>?
                  Pengguna ini tidak akan dapat login lagi ke sistem.
                </p>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmUser(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-delete-user"
                    onClick={() => handleDeleteMember(deleteConfirmUser)}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Ya, Hapus Pengguna
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: 5. Pengaturan Split Profit */}
      {activeTab === 'split' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Pengaturan Persentase Split Profit Partner
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan porsi bagi hasil laba bersih agensi. Angka ini secara real-time diterapkan pada laporan rekapitulasi bulanan dan tahunan.
            </p>
          </div>

          {/* Add Partner Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block font-semibold text-slate-700 mb-1">Nama Partner</label>
              <input
                type="text"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                placeholder="Nama Partner..."
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div className="w-full sm:w-40">
              <label className="block font-semibold text-slate-700 mb-1">Porsi Bagi Hasil (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={newPartnerPercent}
                onChange={(e) => setNewPartnerPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div className="self-end w-full sm:w-auto">
              <button
                type="button"
                onClick={handleAddPartner}
                className="w-full px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Partner</span>
              </button>
            </div>
          </div>

          {/* Current Partner Splits List */}
          <div className="space-y-3 pt-2">
            {(formData.partnerSplits || []).map((partner) => (
              <div
                key={partner.id}
                className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 font-bold flex items-center justify-center text-sm">
                    {partner.percentage}%
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{partner.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      Mendapatkan {partner.percentage}% dari Laba Bersih Agensi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRemovePartner(partner.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Hapus Partner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Total Akumulasi Persentase:</span>
            <span
              className={`font-extrabold text-sm ${
                totalSplitPercentage === 100
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`}
            >
              {totalSplitPercentage}% {totalSplitPercentage === 100 ? '(Ideal: Pas 100%)' : '(Perhatian: Total bukan 100%)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
