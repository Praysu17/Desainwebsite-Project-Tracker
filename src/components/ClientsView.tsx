import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  DollarSign,
  Briefcase,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  X,
  Clock,
  MessageSquare,
  FileText,
  Receipt,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client, ClientStatus } from '../types';
import { formatDate, formatRupiah, getStatusBadgeClass } from '../utils/formatters';

export const ClientsView: React.FC = () => {
  const {
    clients,
    projects,
    invoices,
    addClient,
    updateClient,
    deleteClient,
    selectedClientId,
    setSelectedClientId,
    globalSearch,
    setActiveTab,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'All' | ClientStatus>('All');
  const [localSearch, setLocalSearch] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingClient, setEditingClient] = useState<Partial<Client>>({});

  // Active detail modal client
  const detailClient = clients.find((c) => c.id === selectedClientId);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const term = (localSearch || globalSearch).toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(term) ||
      c.contact.toLowerCase().includes(term) ||
      c.firstService.toLowerCase().includes(term);

    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAddModal = () => {
    setEditingClient({
      name: '',
      contact: '',
      firstService: 'Pembuatan Website',
      status: 'Aktif',
      firstOrderDate: new Date().toISOString().split('T')[0],
      lastOrderDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      notes: '',
    });
    setModalMode('add');
  };

  const handleOpenEditModal = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient({ ...client });
    setModalMode('edit');
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient.name?.trim()) return;

    if (modalMode === 'add') {
      addClient({
        name: editingClient.name || '',
        contact: editingClient.contact || '',
        firstService: editingClient.firstService || 'Pembuatan Website',
        firstOrderDate: editingClient.firstOrderDate || new Date().toISOString().split('T')[0],
        lastOrderDate: editingClient.lastOrderDate || new Date().toISOString().split('T')[0],
        status: (editingClient.status as ClientStatus) || 'Aktif',
        nextFollowUpDate: editingClient.nextFollowUpDate || '',
        notes: editingClient.notes || '',
      });
    } else if (modalMode === 'edit' && editingClient.id) {
      updateClient(editingClient.id, editingClient);
    }
    setModalMode(null);
  };

  const handleDeleteClient = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Apakah Anda yakin ingin menghapus klien "${name}"?`)) {
      deleteClient(id);
      if (selectedClientId === id) setSelectedClientId(null);
    }
  };

  // WhatsApp quick trigger
  const getWhatsAppLink = (contact: string) => {
    const cleanNumber = contact.replace(/[^0-9]/g, '');
    let waNumber = cleanNumber;
    if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.slice(1);
    }
    return `https://wa.me/${waNumber}`;
  };

  // Projects & invoices for detail modal
  const clientProjects = detailClient
    ? projects.filter(
        (p) => p.clientId === detailClient.id || p.clientName.toLowerCase() === detailClient.name.toLowerCase()
      )
    : [];

  const clientInvoices = detailClient
    ? invoices.filter(
        (i) => i.clientId === detailClient.id || i.clientName.toLowerCase() === detailClient.name.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Database Klien (CRM)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola data klien, riwayat pesanan, follow-up, dan total Lifetime Value (LTV)
          </p>
        </div>

        <button
          id="btn-add-new-client"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Tambah Klien Baru</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['All', 'Aktif', 'Perlu Follow-up', 'Tidak Aktif'] as const).map((status) => (
            <button
              key={status}
              id={`filter-client-${status.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'All' ? 'Semua Klien' : status}
            </button>
          ))}
        </div>

        {/* Local Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau kontak klien..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-500 rounded-xl outline-hidden"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama Klien</th>
                <th className="px-4 py-3.5">Kontak</th>
                <th className="px-4 py-3.5">Jasa Pertama</th>
                <th className="px-4 py-3.5 text-center">Order Selesai</th>
                <th className="px-4 py-3.5 text-right">Lifetime Value</th>
                <th className="px-4 py-3.5 text-right">Rata-rata Order</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Next Follow-up</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    {clients.length === 0
                      ? 'Belum ada data klien. Klik tombol "+ Tambah Klien Baru" untuk mendaftarkan klien pertama Anda.'
                      : 'Tidak ada data klien yang cocok dengan pencarian'}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                        {client.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                        Order pertama: {formatDate(client.firstOrderDate)}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-medium">{client.contact}</div>
                      {client.contact.includes('WA') || client.contact.includes('+62') || client.contact.includes('08') ? (
                        <a
                          href={getWhatsAppLink(client.contact)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Chat WA</span>
                        </a>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-700">
                      {client.firstService}
                    </td>

                    <td className="px-4 py-4 text-center font-bold text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                        {client.completedOrdersCount || 0}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-slate-900">
                      {formatRupiah(client.lifetimeValue)}
                    </td>

                    <td className="px-4 py-4 text-right font-medium text-slate-600">
                      {formatRupiah(client.avgOrderValue)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getStatusBadgeClass(
                          client.status
                        )}`}
                      >
                        {client.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600 font-medium">
                      {formatDate(client.nextFollowUpDate)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleOpenEditModal(client, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Klien"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClient(client.id, client.name, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Hapus Klien"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Modal / Drawer */}
      {detailClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center font-bold text-lg">
                  {detailClient.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{detailClient.name}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusBadgeClass(
                        detailClient.status
                      )}`}
                    >
                      {detailClient.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>{detailClient.contact}</span>
                    <span>•</span>
                    <span>Next Follow-up: {formatDate(detailClient.nextFollowUpDate)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleOpenEditModal(detailClient, e)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Edit Data
                </button>
                <button
                  onClick={() => setSelectedClientId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Financial & Order Stats Banner */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Lifetime Value (LTV)
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {formatRupiah(detailClient.lifetimeValue)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Order Selesai
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {detailClient.completedOrdersCount || 0} Proyek
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Rata-rata Order
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {formatRupiah(detailClient.avgOrderValue)}
                  </p>
                </div>
              </div>

              {/* Notes & Client Preference */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Catatan & Preferensi Klien
                </h4>
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                  {detailClient.notes || 'Belum ada catatan khusus untuk klien ini.'}
                </div>
              </div>

              {/* Linked Projects Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-600" />
                    <span>Riwayat Proyek ({clientProjects.length})</span>
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedClientId(null);
                      setActiveTab('projects');
                    }}
                    className="text-xs font-semibold text-cyan-600 hover:text-cyan-700"
                  >
                    Buka Project Tracker
                  </button>
                </div>

                {clientProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Belum ada proyek tercatat.</p>
                ) : (
                  <div className="space-y-2">
                    {clientProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            #{p.projectNo} — {p.serviceType}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            PIC: {p.pic} • Deadline: {formatDate(p.deadline)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">
                            {formatRupiah(p.projectValue)}
                          </div>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(
                              p.status
                            )}`}
                          >
                            {p.status} ({p.progress}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Invoices Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Riwayat Invoice ({clientInvoices.length})</span>
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedClientId(null);
                      setActiveTab('invoices');
                    }}
                    className="text-xs font-semibold text-cyan-600 hover:text-cyan-700"
                  >
                    Buka Modul Invoice
                  </button>
                </div>

                {clientInvoices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Belum ada invoice untuk klien ini.</p>
                ) : (
                  <div className="space-y-2">
                    {clientInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                          <span className="text-slate-400 ml-2">• {inv.projectTitle}</span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Jatuh tempo: {formatDate(inv.dueDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{formatRupiah(inv.totalAmount)}</div>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(
                              inv.status
                            )}`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {modalMode === 'add' ? 'Tambah Klien Baru' : 'Edit Data Klien'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Klien / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingClient.name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  placeholder="Contoh: PT Surya Kencana Digital"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kontak (WhatsApp / Email) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingClient.contact || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, contact: e.target.value })}
                  placeholder="+62 812-xxxx-xxxx / email@klien.com"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jasa Pertama Diambil
                  </label>
                  <input
                    type="text"
                    value={editingClient.firstService || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, firstService: e.target.value })}
                    placeholder="Pembuatan Website, Ads, dll"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Klien
                  </label>
                  <select
                    value={editingClient.status || 'Aktif'}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, status: e.target.value as ClientStatus })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Perlu Follow-up">Perlu Follow-up</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Order Pertama
                  </label>
                  <input
                    type="date"
                    value={editingClient.firstOrderDate || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, firstOrderDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Follow-up
                  </label>
                  <input
                    type="date"
                    value={editingClient.nextFollowUpDate || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, nextFollowUpDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Preferensi Klien
                </label>
                <textarea
                  rows={3}
                  value={editingClient.notes || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  placeholder="Informasi preferensi desain, kebiasaan approval, jadwal meeting..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Simpan Klien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
