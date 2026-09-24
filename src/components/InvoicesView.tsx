import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Send,
  Trash2,
  Printer,
  DollarSign,
  AlertCircle,
  X,
  CreditCard,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod } from '../types';
import { formatDate, formatRupiah, getStatusBadgeClass, isAdminRole } from '../utils/formatters';
import { SendInvoiceWAModal } from './SendInvoiceWAModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const InvoicesView: React.FC = () => {
  const {
    invoices,
    clients,
    projects,
    settings,
    currentUser,
    addInvoice,
    markInvoiceAsPaid,
    deleteInvoice,
    globalSearch,
  } = useApp();

  const isAdmin = isAdminRole(currentUser?.role);

  const [localSearch, setLocalSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | InvoiceStatus>('All');
  const [waModalInvoice, setWaModalInvoice] = useState<Invoice | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Invoice | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto dismiss notice after 4 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Form State for manual invoice
  const [formClientId, setFormClientId] = useState('');
  const [formProjectTitle, setFormProjectTitle] = useState('');
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [formInvoiceType, setFormInvoiceType] = useState<'DP' | 'Pelunasan' | 'Full'>('DP');
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    {
      id: 'inv-item-1',
      description: 'Pembayaran Uang Muka (DP 50%) Proyek Website',
      quantity: 1,
      unitPrice: 3500000,
      total: 3500000,
    },
  ]);

  // Payment method modal for marking as paid
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PaymentMethod>('Transfer Bank');

  const filteredInvoices = invoices.filter((inv) => {
    const term = (localSearch || globalSearch).toLowerCase();
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(term) ||
      inv.clientName.toLowerCase().includes(term) ||
      inv.projectTitle.toLowerCase().includes(term);

    const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCopyLink = (shareToken: string) => {
    const origin = window.location.origin;
    const url = `${origin}/share/invoice/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleOpenWhatsAppSend = (inv: Invoice) => {
    setWaModalInvoice(inv);
  };

  const handleCreateManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === formClientId) || clients[0];
    if (!client || !formProjectTitle.trim()) return;

    const totalAmount = formItems.reduce((s, i) => s + i.total, 0);

    addInvoice({
      clientId: client.id,
      clientName: client.name,
      clientContact: client.contact,
      projectTitle: formProjectTitle,
      dueDate: formDueDate,
      items: formItems,
      totalAmount,
      status: 'Belum Dibayar',
    });

    setModalOpen(false);
  };

  const handleConfirmPaid = () => {
    if (payModalInvoice) {
      markInvoiceAsPaid(payModalInvoice.id, selectedPayMethod);
      setPayModalInvoice(null);
    }
  };

  const handleConfirmDeleteInvoice = () => {
    if (!deleteCandidate) return;
    if (!isAdmin) {
      setNotice({
        type: 'error',
        message: 'Akses ditolak: Hanya pengguna dengan peran Admin atau Owner yang dapat menghapus invoice.',
      });
      setDeleteCandidate(null);
      return;
    }

    const success = deleteInvoice(deleteCandidate.id);
    if (success) {
      setNotice({
        type: 'success',
        message: `Invoice "${deleteCandidate.invoiceNumber}" berhasil dihapus.`,
      });
    } else {
      setNotice({
        type: 'error',
        message: 'Gagal menghapus invoice. Pastikan akun Anda memiliki hak akses Admin.',
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
              Modul Tagihan & Invoice
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
            Kirim tagihan profesional online, otomatis catat kas masuk saat ditandai lunas
          </p>
        </div>

        <button
          id="btn-create-manual-invoice"
          onClick={() => {
            const defClient = clients[0] || { id: '', name: '', contact: '' };
            setFormClientId(defClient.id);
            setFormProjectTitle('');
            setFormDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>+ Buat Invoice Manual</span>
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

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {(['All', 'Belum Dibayar', 'Lunas', 'Jatuh Tempo'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'All' ? 'Semua Tagihan' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor invoice, klien..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">No. Invoice</th>
                <th className="px-4 py-3.5">Klien & Proyek</th>
                <th className="px-4 py-3.5">Tanggal Terbit</th>
                <th className="px-4 py-3.5">Jatuh Tempo</th>
                <th className="px-4 py-3.5 text-right">Total Tagihan</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi & Integrasi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    {invoices.length === 0
                      ? 'Belum ada invoice. Klik tombol "+ Buat Invoice Manual" atau konversi dari proposal yang disetujui.'
                      : 'Tidak ada invoice yang sesuai'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'Lunas';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block">{inv.invoiceNumber}</span>
                        {inv.paidAt && (
                          <span className="text-[10px] text-emerald-600">
                            Dibayar: {formatDate(inv.paidAt)}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900 block">{inv.clientName}</span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                          {inv.projectTitle}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600 font-medium">
                        {formatDate(inv.createdAt)}
                      </td>

                      <td className="px-4 py-4 text-slate-800 font-medium">
                        {formatDate(inv.dueDate)}
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-slate-900 text-sm">
                        {formatRupiah(inv.totalAmount)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getStatusBadgeClass(
                            inv.status
                          )}`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Mark Paid button (Only for unpaid) */}
                          {!isPaid ? (
                            <button
                              onClick={() => {
                                setPayModalInvoice(inv);
                                setSelectedPayMethod('Transfer Bank');
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1 transition-colors"
                              title="Tandai Lunas & Masuk ke Keuangan"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tandai Lunas</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold px-2">
                              ✓ Kas Tercatat
                            </span>
                          )}

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(inv.shareToken)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                            title="Salin Link Invoice Publik"
                          >
                            {copiedToken === inv.shareToken ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Open Public Page */}
                          <a
                            href={`/share/invoice/${inv.shareToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-cyan-600 hover:text-cyan-800 rounded-lg hover:bg-cyan-50"
                            title="Buka Lembar Invoice Publik"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* WhatsApp */}
                          <button
                            onClick={() => handleOpenWhatsAppSend(inv)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50"
                            title="Kirim ke Klien via WA"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            id={`btn-delete-invoice-${inv.id}`}
                            onClick={() => setDeleteCandidate(inv)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isAdmin
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title={
                              isAdmin
                                ? `Hapus invoice "${inv.invoiceNumber}"`
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

      {/* Modal: Confirm Payment & Auto Add to Income */}
      {payModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Pelunasan Tagihan</h3>
              </div>
              <button
                onClick={() => setPayModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">
                  Invoice #{payModalInvoice.invoiceNumber}
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {payModalInvoice.clientName} — {payModalInvoice.projectTitle}
                </div>
                <div className="text-xl font-bold text-emerald-600 mt-2">
                  {formatRupiah(payModalInvoice.totalAmount)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Metode Pembayaran yang Diterima
                </label>
                <select
                  value={selectedPayMethod}
                  onChange={(e) => setSelectedPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white text-xs font-medium"
                >
                  <option value="Transfer Bank">Transfer Bank (BCA/Mandiri)</option>
                  <option value="QRIS">QRIS Agensi</option>
                  <option value="E-Wallet">E-Wallet (GoPay / OVO / Dana)</option>
                  <option value="Cash">Cash / Tunai</option>
                </select>
              </div>

              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-cyan-900 text-[11px] leading-relaxed">
                ✨ <strong>Otomatisasi Kas:</strong> Saat Anda klik konfirmasi, sistem akan langsung
                memperbarui status invoice menjadi <strong>Lunas</strong> dan secara otomatis
                mencatatkan transaksi kas masuk di modul <strong>Keuangan (Pemasukan)</strong> tanpa
                perlu entri manual ganda.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayModalInvoice(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Ya, Tandai Lunas Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Buat Invoice Manual */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Buat Tagihan (Invoice) Manual</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualInvoice} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Klien <span className="text-rose-500">*</span>
                </label>
                {clients.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                    <p className="font-bold">Belum ada klien terdaftar.</p>
                    <p className="text-[11px] mt-0.5 text-amber-700">
                      Silakan daftarkan klien terlebih dahulu di menu Klien.
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
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Proyek / Keterangan Tagihan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formProjectTitle}
                  onChange={(e) => setFormProjectTitle(e.target.value)}
                  placeholder="Contoh: Pembayaran Termin 1 Website"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal Tagihan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="10000"
                    step="50000"
                    value={formItems[0].unitPrice || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormItems([
                        {
                          ...formItems[0],
                          unitPrice: val,
                          total: val,
                        },
                      ]);
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jatuh Tempo Pembayaran
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>
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
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Terbitkan Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Invoice WhatsApp Modal */}
      {waModalInvoice && (
        <SendInvoiceWAModal
          isOpen={!!waModalInvoice}
          onClose={() => setWaModalInvoice(null)}
          invoice={waModalInvoice}
          autoTrigger={false}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <DeleteConfirmModal
          isOpen={!!deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDeleteInvoice}
          title="Hapus Lembar Invoice"
          itemType="Invoice"
          itemName={deleteCandidate.projectTitle}
          itemCode={deleteCandidate.invoiceNumber}
          clientName={deleteCandidate.clientName}
          amount={formatRupiah(deleteCandidate.totalAmount)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
