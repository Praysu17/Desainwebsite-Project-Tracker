import React, { useMemo, useState } from 'react';
import {
  FolderKanban,
  Table as TableIcon,
  Columns,
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  DollarSign,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentStatus, Project, ProjectStatus } from '../types';
import { formatDate, formatRupiah, getStatusBadgeClass } from '../utils/formatters';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    clients,
    settings,
    addProject,
    updateProject,
    deleteProject,
    globalSearch,
    setSelectedClientId,
  } = useApp();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [localSearch, setLocalSearch] = useState('');
  
  // Filters
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterClient, setFilterClient] = useState<string>('All');
  const [filterPic, setFilterPic] = useState<string>('All');

  // Modal State
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<Project>>({});

  // Unique PICs list (Includes team members from settings)
  const uniquePics = useMemo(() => {
    const set = new Set<string>();
    const team = settings.teamMembers || settings.users || [];
    team.forEach((member) => {
      if (member.name) set.add(member.name);
    });
    projects.forEach((p) => {
      if (p.pic) {
        p.pic.split(',').forEach((x) => set.add(x.trim()));
      }
    });
    return Array.from(set);
  }, [projects, settings]);

  // Months available
  const availableMonths = [
    { value: 'All', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const term = (localSearch || globalSearch).toLowerCase();
      const matchSearch =
        p.clientName.toLowerCase().includes(term) ||
        p.serviceType.toLowerCase().includes(term) ||
        p.pic.toLowerCase().includes(term) ||
        p.projectNo.toString().includes(term);

      const matchStatus = filterStatus === 'All' || p.status === filterStatus;
      const matchClient = filterClient === 'All' || p.clientName === filterClient;
      const matchPic = filterPic === 'All' || p.pic.toLowerCase().includes(filterPic.toLowerCase());

      let matchMonth = true;
      if (filterMonth !== 'All' && p.startDate) {
        const monthNum = p.startDate.split('-')[1];
        matchMonth = monthNum === filterMonth;
      }

      return matchSearch && matchStatus && matchClient && matchPic && matchMonth;
    });
  }, [projects, localSearch, globalSearch, filterStatus, filterClient, filterPic, filterMonth]);

  const handleOpenAddModal = () => {
    const defaultClient = clients[0] || { id: '', name: '' };
    setEditingProject({
      clientId: defaultClient.id,
      clientName: defaultClient.name,
      serviceType: '',
      pic: 'Sugeng Prayitno',
      startDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'Deal',
      progress: 0,
      projectValue: 0,
      paymentStatus: 'Belum DP',
      dpReceived: 0,
      notes: '',
    });
    setModalMode('add');
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject({ ...project });
    setModalMode('edit');
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject.clientName) return;

    const value = editingProject.projectValue || 0;
    const dp = editingProject.dpReceived || 0;
    let paymentStatus = editingProject.paymentStatus || 'Belum DP';
    if (dp >= value && value > 0) {
      paymentStatus = 'Lunas';
    } else if (dp > 0) {
      paymentStatus = 'DP Diterima';
    } else {
      paymentStatus = 'Belum DP';
    }

    if (modalMode === 'add') {
      addProject({
        clientId: editingProject.clientId || '',
        clientName: editingProject.clientName || '',
        serviceType: editingProject.serviceType || 'Jasa Digital',
        pic: editingProject.pic || 'Sugeng',
        startDate: editingProject.startDate || new Date().toISOString().split('T')[0],
        deadline: editingProject.deadline || '',
        status: (editingProject.status as ProjectStatus) || 'Deal',
        progress: editingProject.progress || 0,
        projectValue: value,
        paymentStatus,
        dpReceived: dp,
        notes: editingProject.notes || '',
      });
    } else if (modalMode === 'edit' && editingProject.id) {
      updateProject(editingProject.id, {
        ...editingProject,
        projectValue: value,
        dpReceived: dp,
        paymentStatus,
      });
    }

    setModalMode(null);
  };

  const handleDeleteProject = (id: string, name: string) => {
    if (confirm(`Hapus proyek "${name}"?`)) {
      deleteProject(id);
    }
  };

  // Drag & drop kanban simulation / fast move
  const kanbanStatuses: ProjectStatus[] = ['Deal', 'Proses', 'Revisi', 'Selesai'];

  const handleQuickStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    const updates: Partial<Project> = { status: newStatus };
    if (newStatus === 'Selesai') {
      updates.progress = 100;
    }
    updateProject(projectId, updates);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tracking Proyek Bulanan
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manajemen status pengerjaan, progress PIC, dan sisa pembayaran otomatis
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              id="btn-view-table"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              id="btn-view-kanban"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
          </div>

          <button
            id="btn-add-new-project"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Tambah Proyek</span>
          </button>
        </div>
      </div>

      {/* Multi-Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Month Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            Bulan Proyek
          </label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
          >
            <option value="All">Semua Status</option>
            <option value="Deal">Deal</option>
            <option value="Proses">Proses</option>
            <option value="Revisi">Revisi</option>
            <option value="Selesai">Selesai</option>
            <option value="Batal">Batal</option>
          </select>
        </div>

        {/* Client Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            Klien
          </label>
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
          >
            <option value="All">Semua Klien</option>
            {clients.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* PIC Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            PIC / Tim
          </label>
          <select
            value={filterPic}
            onChange={(e) => setFilterPic(e.target.value)}
            className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
          >
            <option value="All">Semua PIC</option>
            {uniquePics.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            Cari Proyek
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik kata kunci..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full text-xs py-1.5 pl-8 pr-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* View: Table Mode */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">No</th>
                  <th className="px-4 py-3.5">Klien & Jasa</th>
                  <th className="px-4 py-3.5">PIC</th>
                  <th className="px-4 py-3.5">Mulai / Deadline</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 w-32">Progress</th>
                  <th className="px-4 py-3.5 text-right">Nilai Proyek</th>
                  <th className="px-4 py-3.5 text-right">DP Diterima</th>
                  <th className="px-4 py-3.5 text-right">Sisa (Auto)</th>
                  <th className="px-4 py-3.5 text-center">Bayar</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                      {projects.length === 0
                        ? 'Belum ada proyek. Klik tombol "+ Tambah Proyek" untuk memulai proyek baru.'
                        : 'Tidak ada proyek yang cocok dengan filter yang dipilih'}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => {
                    const remaining = Math.max(0, p.projectValue - (p.dpReceived || 0));

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-4 text-center font-bold text-slate-400">
                          #{p.projectNo}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            onClick={() => setSelectedClientId(p.clientId)}
                            className="font-bold text-slate-900 hover:text-cyan-700 text-left block transition-colors"
                          >
                            {p.clientName}
                          </button>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {p.serviceType}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-700 font-medium">
                          {p.pic}
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-slate-800 font-medium">{formatDate(p.startDate)}</div>
                          <div className="text-[11px] text-slate-400">
                            s/d {formatDate(p.deadline)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getStatusBadgeClass(
                              p.status
                            )}`}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-slate-700">{p.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${p.progress}%` }}
                              className={`h-full rounded-full ${
                                p.progress === 100
                                  ? 'bg-emerald-500'
                                  : p.progress > 50
                                  ? 'bg-cyan-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-slate-900">
                          {formatRupiah(p.projectValue)}
                        </td>

                        <td className="px-4 py-4 text-right font-medium text-emerald-600">
                          {formatRupiah(p.dpReceived)}
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-rose-600">
                          {formatRupiah(remaining)}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadgeClass(
                              p.paymentStatus
                            )}`}
                          >
                            {p.paymentStatus}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                              title="Edit Proyek"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(p.id, p.serviceType)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Hapus Proyek"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      ) : (
        /* View: Kanban Board Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4.5">
          {kanbanStatuses.map((statusColumn) => {
            const columnProjects = filteredProjects.filter((p) => p.status === statusColumn);

            return (
              <div
                key={statusColumn}
                className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusBadgeClass(
                        statusColumn
                      )}`}
                    >
                      {statusColumn}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      ({columnProjects.length})
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                  {columnProjects.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Tidak ada proyek
                    </div>
                  ) : (
                    columnProjects.map((p) => {
                      const remaining = Math.max(0, p.projectValue - (p.dpReceived || 0));

                      return (
                        <div
                          key={p.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-400">
                              #{p.projectNo}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1 text-slate-400 hover:text-slate-700"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 mt-1">
                            {p.clientName}
                          </h4>
                          <p className="text-[11px] text-cyan-700 font-medium">
                            {p.serviceType}
                          </p>

                          {/* Progress */}
                          <div className="mt-3">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                              <span>Progress</span>
                              <span className="font-bold">{p.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${p.progress}%` }}
                                className="h-full bg-cyan-500 rounded-full"
                              />
                            </div>
                          </div>

                          {/* Financials */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900">
                              {formatRupiah(p.projectValue)}
                            </span>
                            <span className="text-rose-600 font-semibold">
                              Sisa: {formatRupiah(remaining)}
                            </span>
                          </div>

                          {/* Footer details & move select */}
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[100px]">PIC: {p.pic}</span>
                            <span>{formatDate(p.deadline)}</span>
                          </div>

                          {/* Quick move dropdown */}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Pindah ke:</span>
                            <select
                              value={p.status}
                              onChange={(e) =>
                                handleQuickStatusChange(p.id, e.target.value as ProjectStatus)
                              }
                              className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-0.5 px-1 outline-hidden"
                            >
                              {kanbanStatuses.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {modalMode === 'add' ? 'Tambah Proyek Baru' : 'Edit Data Proyek'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Client Selection (Enforces exact client match) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Klien <span className="text-rose-500">* (Relasi Database Klien)</span>
                </label>
                {clients.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                    <p className="font-bold">Belum ada klien terdaftar.</p>
                    <p className="text-[11px] mt-0.5 text-amber-700">
                      Silakan tambahkan data klien terlebih dahulu di menu Klien sebelum membuat proyek baru.
                    </p>
                  </div>
                ) : (
                  <select
                    required
                    value={editingProject.clientId || ''}
                    onChange={(e) => {
                      const selected = clients.find((c) => c.id === e.target.value);
                      if (selected) {
                        setEditingProject({
                          ...editingProject,
                          clientId: selected.id,
                          clientName: selected.name,
                        });
                      }
                    }}
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
                <p className="text-[10px] text-slate-400 mt-1">
                  Nama klien terkunci dari database agar konsisten tanpa resiko salah ejaan.
                </p>
              </div>

              {/* Service & PIC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Jasa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.serviceType || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, serviceType: e.target.value })
                    }
                    placeholder="Pembuatan Website, Ads, Desain..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PIC (Penanggung Jawab / Tim)
                  </label>
                  <input
                    type="text"
                    list="pic-list-options"
                    value={editingProject.pic || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, pic: e.target.value })
                    }
                    placeholder="Sugeng, Budi, Rian..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                  <datalist id="pic-list-options">
                    {uniquePics.map((picName) => (
                      <option key={picName} value={picName} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={editingProject.startDate || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, startDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={editingProject.deadline || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, deadline: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Status & Progress Slider */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Proyek
                  </label>
                  <select
                    value={editingProject.status || 'Deal'}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        status: e.target.value as ProjectStatus,
                        progress: e.target.value === 'Selesai' ? 100 : editingProject.progress,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white"
                  >
                    <option value="Deal">Deal</option>
                    <option value="Proses">Proses</option>
                    <option value="Revisi">Revisi</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Batal">Batal</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700">Progress Pengerjaan</label>
                    <span className="font-bold text-cyan-600">{editingProject.progress || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editingProject.progress || 0}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        progress: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-cyan-600"
                  />
                </div>
              </div>

              {/* Financials: Nilai Proyek, DP Diterima & Auto Sisa Pembayaran */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nilai Proyek (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      value={editingProject.projectValue || 0}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setEditingProject({
                          ...editingProject,
                          projectValue: raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0),
                        });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      DP Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      value={editingProject.dpReceived || 0}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setEditingProject({
                          ...editingProject,
                          dpReceived: raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0),
                        });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Sisa Pembayaran (Auto)
                    </label>
                    <div className="px-3 py-1.5 border border-rose-200 rounded-xl bg-rose-50/80 font-bold text-rose-700">
                      {formatRupiah(
                        Math.max(
                          0,
                          (editingProject.projectValue || 0) - (editingProject.dpReceived || 0)
                        )
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  * Sisa pembayaran dihitung otomatis: Nilai Proyek − DP Diterima (tidak dapat diisi manual).
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Proyek
                </label>
                <textarea
                  rows={2}
                  value={editingProject.notes || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, notes: e.target.value })}
                  placeholder="Detail brief, link drive materi, catatan revisi..."
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
                  Simpan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
