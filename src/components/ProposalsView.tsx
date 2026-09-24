import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Send,
  Trash2,
  Edit,
  Eye,
  X,
  Phone,
  Calendar,
  Sparkles,
  DollarSign,
  Layers,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Invoice, Proposal, ProposalLineItem, ProposalStatus } from '../types';
import { formatDate, formatRupiah, getStatusBadgeClass, isAdminRole } from '../utils/formatters';
import { SendInvoiceWAModal } from './SendInvoiceWAModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const ProposalsView: React.FC = () => {
  const {
    proposals,
    invoices,
    clients,
    settings,
    currentUser,
    addProposal,
    updateProposal,
    deleteProposal,
    acceptProposal,
    globalSearch,
    setPublicShare,
  } = useApp();

  const isAdmin = isAdminRole(currentUser?.role);

  const [localSearch, setLocalSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Proposal | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [waModalData, setWaModalData] = useState<{
    invoice: Invoice;
    proposal?: Proposal;
    autoTrigger?: boolean;
  } | null>(null);

  // Auto dismiss notice after 4 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Form State for creating new proposal
  const [formProjectTitle, setFormProjectTitle] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formTerms, setFormTerms] = useState(settings.proposalDefaultTerms);
  const [formExpiryDate, setFormExpiryDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [formStatus, setFormStatus] = useState<ProposalStatus>('Terkirim');
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>([
    {
      id: 'item-1',
      name: 'Scope Pengerjaan Utama',
      description: 'Pengembangan sistem & modul fitur sesuai spesifikasi',
      quantity: 1,
      price: 5000000,
    },
  ]);

  // Filter proposals
  const filteredProposals = proposals.filter((p) => {
    const term = (localSearch || globalSearch).toLowerCase();
    return (
      p.proposalNumber.toLowerCase().includes(term) ||
      p.clientName.toLowerCase().includes(term) ||
      p.projectTitle.toLowerCase().includes(term) ||
      p.status.toLowerCase().includes(term)
    );
  });

  const calculateTotal = (items: ProposalLineItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity || 1) * (item.price || 0), 0);
  };

  const handleOpenCreateModal = () => {
    const defClient = clients[0] || { id: '', name: '', contact: '' };
    setFormClientId(defClient.id);
    setFormProjectTitle('');
    setFormTerms(settings.proposalDefaultTerms);
    setFormExpiryDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setFormStatus('Terkirim');
    setLineItems([
      {
        id: `item-${Date.now()}-1`,
        name: '',
        description: '',
        quantity: 1,
        price: 0,
      },
    ]);
    setModalOpen(true);
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        name: '',
        description: '',
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLineItemChange = (id: string, field: keyof ProposalLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleCreateProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === formClientId) || clients[0];
    if (!client || !formProjectTitle.trim()) return;

    const totalValue = calculateTotal(lineItems);

    addProposal({
      clientId: client.id,
      clientName: client.name,
      clientContact: client.contact,
      projectTitle: formProjectTitle,
      items: lineItems,
      totalValue,
      terms: formTerms,
      expiryDate: formExpiryDate,
      status: formStatus,
    });

    setModalOpen(false);
  };

  const handleCopyLink = (shareToken: string) => {
    const origin = window.location.origin;
    const url = `${origin}/share/proposal/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleOpenWhatsAppShare = (proposal: Proposal) => {
    const origin = window.location.origin;
    const url = `${origin}/share/proposal/${proposal.shareToken}`;
    const text = encodeURIComponent(
      `Halo ${proposal.clientName},\n\nTerima kasih atas diskusinya. Berikut kami kirimkan tautan dokumen Proposal Penawaran Kerjasama resmi untuk proyek "${proposal.projectTitle}":\n\n🔗 ${url}\n\nSilakan review detail ruang lingkup & biaya, serta Anda dapat langsung menyetujui atau menolak proposal melalui tombol di halaman tersebut.\n\nSalam hormat,\n${settings.agencyName}`
    );

    // Clean phone number if available
    const cleanNum = proposal.clientContact.replace(/[^0-9]/g, '');
    let waUrl = `https://wa.me/?text=${text}`;
    if (cleanNum.length >= 8) {
      let intlNum = cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum;
      waUrl = `https://wa.me/${intlNum}?text=${text}`;
    }

    window.open(waUrl, '_blank');
  };

  const handleApproveAndInvoice = (proposal: Proposal) => {
    const res = acceptProposal(proposal.shareToken);
    if (res) {
      setWaModalData({
        invoice: res.invoice,
        proposal: res.proposal,
        autoTrigger: true,
      });
      setNotice({
        type: 'success',
        message: `Proposal "${proposal.projectTitle}" berhasil disetujui & dibuatkan invoice!`,
      });
    }
  };

  const handleConfirmDeleteProposal = () => {
    if (!deleteCandidate) return;
    if (!isAdmin) {
      setNotice({
        type: 'error',
        message: 'Akses ditolak: Hanya pengguna dengan peran Admin atau Owner yang dapat menghapus proposal.',
      });
      setDeleteCandidate(null);
      return;
    }

    const success = deleteProposal(deleteCandidate.id);
    if (success) {
      setNotice({
        type: 'success',
        message: `Proposal "${deleteCandidate.projectTitle}" (${deleteCandidate.proposalNumber}) berhasil dihapus.`,
      });
    } else {
      setNotice({
        type: 'error',
        message: 'Gagal menghapus proposal. Pastikan akun Anda memiliki hak akses Admin.',
      });
    }
    setDeleteCandidate(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Manajemen Proposal Klien
            </h2>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isAdmin
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Peran: {currentUser?.role || 'Staff'} {isAdmin && '• Akses Penuh'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Buat proposal online interaktif, lacak status dilihat, dan dapatkan persetujuan klien instan
          </p>
        </div>

        <button
          id="btn-create-new-proposal"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>+ Buat Proposal Baru</span>
        </button>
      </div>

      {/* Feedback Notice Alert */}
      {notice && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-150 ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Info Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>
            Link proposal publik dapat dibuka klien <strong>tanpa login</strong>, dilengkapi tombol Terima/Tolak.
          </span>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor, klien, proyek..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
          />
        </div>
      </div>

      {/* Proposals List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">No. Proposal</th>
                <th className="px-4 py-3.5">Klien & Kontak</th>
                <th className="px-4 py-3.5">Judul Proyek</th>
                <th className="px-4 py-3.5 text-right">Nilai Total</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Berlaku Sampai</th>
                <th className="px-5 py-3.5 text-right">Link & Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    {proposals.length === 0
                      ? 'Belum ada proposal. Klik tombol "+ Buat Proposal Baru" untuk membuat penawaran profesional pertama Anda.'
                      : 'Tidak ada proposal yang cocok dengan pencarian Anda'}
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => {
                  const relatedInvoice = invoices.find(
                    (inv) =>
                      inv.id === proposal.invoiceId ||
                      inv.id === proposal.generatedInvoiceId ||
                      inv.proposalId === proposal.id
                  );

                  return (
                    <tr key={proposal.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block">
                          {proposal.proposalNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Dibuat: {formatDate(proposal.createdAt)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900 block">{proposal.clientName}</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-xs block">
                          {proposal.clientContact}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {proposal.projectTitle}
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-slate-900 text-sm">
                        {formatRupiah(proposal.totalValue)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getStatusBadgeClass(
                            proposal.status
                          )}`}
                        >
                          {proposal.status}
                        </span>
                        {proposal.viewedAt && (
                          <span className="block text-[10px] text-blue-600 mt-0.5">
                            Dilihat: {proposal.viewedAt}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-600 font-medium">
                        {formatDate(proposal.expiryDate)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* If not approved yet: button to Approve & Auto-create Invoice & open WA */}
                          {proposal.status !== 'Disetujui' && (
                            <button
                              onClick={() => handleApproveAndInvoice(proposal)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg inline-flex items-center gap-1 transition-colors"
                              title="Setujui Proposal & Buat Invoice Otomatis"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden xl:inline">Setujui & Buat Invoice</span>
                              <span className="xl:hidden">Setujui</span>
                            </button>
                          )}

                          {/* If already approved and has invoice: direct WhatsApp Invoice trigger */}
                          {proposal.status === 'Disetujui' && relatedInvoice && (
                            <button
                              onClick={() =>
                                setWaModalData({
                                  invoice: relatedInvoice,
                                  proposal,
                                  autoTrigger: false,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200 border border-emerald-300 rounded-lg inline-flex items-center gap-1 transition-colors shadow-2xs"
                              title={`Kirim Tagihan Invoice #${relatedInvoice.invoiceNumber} via WhatsApp Klien`}
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                              <span>Kirim Tagihan WA</span>
                            </button>
                          )}

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(proposal.shareToken)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors"
                            title="Salin Link Publik Proposal"
                          >
                            {copiedToken === proposal.shareToken ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>

                          {/* Open Public Link */}
                          <a
                            href={`/share/proposal/${proposal.shareToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-cyan-600 hover:text-cyan-800 rounded-lg hover:bg-cyan-50 transition-colors"
                            title="Buka Halaman Proposal Klien"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Share Proposal via WhatsApp */}
                          <button
                            onClick={() => handleOpenWhatsAppShare(proposal)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Kirim Dokumen Proposal via WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            id={`btn-delete-proposal-${proposal.id}`}
                            onClick={() => setDeleteCandidate(proposal)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isAdmin
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title={
                              isAdmin
                                ? `Hapus proposal "${proposal.projectTitle}"`
                                : 'Akses Dibatasi: Hanya Admin/Owner yang dapat menghapus'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Buat Proposal Baru */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900">Buat Dokumen Proposal Baru</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateProposalSubmit}
              className="p-6 space-y-4 text-xs overflow-y-auto flex-1"
            >
              {/* Client & Project Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Klien <span className="text-rose-500">*</span>
                  </label>
                  {clients.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                      <p className="font-bold">Belum ada klien terdaftar.</p>
                      <p className="text-[11px] mt-0.5 text-amber-700">
                        Tambahkan data klien di menu Klien terlebih dahulu.
                      </p>
                    </div>
                  ) : (
                    <select
                      required
                      value={formClientId}
                      onChange={(e) => setFormClientId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white"
                    >
                      <option value="" disabled>-- Pilih Klien --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.contact})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Judul Proyek / Proposal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formProjectTitle}
                    onChange={(e) => setFormProjectTitle(e.target.value)}
                    placeholder="Contoh: Redesign & Pengembangan Web App E-Commerce"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Status & Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Awal</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProposalStatus)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white"
                  >
                    <option value="Terkirim">Terkirim (Siap Dibagikan)</option>
                    <option value="Draft">Draft (Konsep Internal)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Masa Berlaku (Expiry Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Line Items (Item bertahap / scope & harga) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Rincian Ruang Lingkup & Harga (Line Items)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Item</span>
                  </button>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-500 text-[11px]">
                          Item #{index + 1}
                        </span>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.id)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Nama Item / Modul (contoh: Desain UI/UX)"
                            value={item.name}
                            onChange={(e) => handleLineItemChange(item.id, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            required
                            min="0"
                            step="50000"
                            placeholder="Harga (Rp)"
                            value={item.price || ''}
                            onChange={(e) =>
                              handleLineItemChange(
                                item.id,
                                'price',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-right"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Deskripsi detail pengerjaan modul ini..."
                          value={item.description}
                          onChange={(e) =>
                            handleLineItemChange(item.id, 'description', e.target.value)
                          }
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Subtotal preview */}
                  <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-slate-200">
                    <span className="text-slate-700">Total Nilai Proposal:</span>
                    <span className="text-slate-900 text-base">
                      {formatRupiah(calculateTotal(lineItems))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Syarat & Ketentuan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Syarat & Ketentuan Pengerjaan
                </label>
                <textarea
                  rows={3}
                  value={formTerms}
                  onChange={(e) => setFormTerms(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  Buat & Generate Link Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Invoice WhatsApp Modal */}
      {waModalData && (
        <SendInvoiceWAModal
          isOpen={!!waModalData}
          onClose={() => setWaModalData(null)}
          invoice={waModalData.invoice}
          proposal={waModalData.proposal}
          autoTrigger={waModalData.autoTrigger}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <DeleteConfirmModal
          isOpen={!!deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDeleteProposal}
          title="Hapus Proposal Klien"
          itemType="Proposal"
          itemName={deleteCandidate.projectTitle}
          itemCode={deleteCandidate.proposalNumber}
          clientName={deleteCandidate.clientName}
          amount={formatRupiah(deleteCandidate.totalValue)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
