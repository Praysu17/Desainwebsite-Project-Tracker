import React, { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Building2,
  Trash2,
  Edit,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ExpenseTransaction,
  IncomeTransaction,
  IncomeType,
  PaymentMethod,
} from '../types';
import { formatDate, formatRupiah } from '../utils/formatters';

export const FinanceView: React.FC = () => {
  const {
    incomes,
    expenses,
    clients,
    projects,
    settings,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    globalSearch,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'income' | 'expense'>('income');
  const [localSearch, setLocalSearch] = useState('');
  
  // Modals
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Partial<IncomeTransaction> | null>(null);
  const [editingExpense, setEditingExpense] = useState<Partial<ExpenseTransaction> | null>(null);

  // Totals
  const totalIncome = useMemo(() => incomes.reduce((s, x) => s + x.amount, 0), [incomes]);
  const totalExpense = useMemo(() => expenses.reduce((s, x) => s + x.amount, 0), [expenses]);
  const netCashFlow = totalIncome - totalExpense;

  // Filtered Income
  const filteredIncome = useMemo(() => {
    const term = (localSearch || globalSearch).toLowerCase();
    return incomes.filter(
      (i) =>
        i.clientName.toLowerCase().includes(term) ||
        (i.projectTitle && i.projectTitle.toLowerCase().includes(term)) ||
        i.incomeType.toLowerCase().includes(term) ||
        i.method.toLowerCase().includes(term) ||
        (i.notes && i.notes.toLowerCase().includes(term))
    );
  }, [incomes, localSearch, globalSearch]);

  // Filtered Expense
  const filteredExpense = useMemo(() => {
    const term = (localSearch || globalSearch).toLowerCase();
    return expenses.filter(
      (e) =>
        e.category.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term) ||
        e.method.toLowerCase().includes(term) ||
        (e.notes && e.notes.toLowerCase().includes(term))
    );
  }, [expenses, localSearch, globalSearch]);

  // Handle Save Income
  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome || !editingIncome.clientName) return;

    if (editingIncome.id) {
      updateIncome(editingIncome.id, editingIncome);
    } else {
      addIncome({
        date: editingIncome.date || new Date().toISOString().split('T')[0],
        clientId: editingIncome.clientId,
        clientName: editingIncome.clientName,
        projectId: editingIncome.projectId,
        projectTitle: editingIncome.projectTitle,
        incomeType: (editingIncome.incomeType as IncomeType) || 'DP',
        amount: editingIncome.amount || 0,
        method: (editingIncome.method as PaymentMethod) || 'Transfer Bank',
        notes: editingIncome.notes || '',
      });
    }

    setIncomeModalOpen(false);
    setEditingIncome(null);
  };

  // Handle Save Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.category) return;

    if (editingExpense.id) {
      updateExpense(editingExpense.id, editingExpense);
    } else {
      addExpense({
        date: editingExpense.date || new Date().toISOString().split('T')[0],
        category: editingExpense.category || 'Operasional',
        description: editingExpense.description || '',
        amount: editingExpense.amount || 0,
        method: (editingExpense.method as PaymentMethod) || 'Transfer Bank',
        notes: editingExpense.notes || '',
      });
    }

    setExpenseModalOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Keuangan Agensi
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pencatatan kas masuk dari proyek & pengeluaran operasional agency
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-income"
            onClick={() => {
              const defClient = clients[0] || { id: '', name: '' };
              setEditingIncome({
                date: new Date().toISOString().split('T')[0],
                clientId: defClient.id,
                clientName: defClient.name,
                incomeType: 'DP',
                amount: 0,
                method: 'Transfer Bank',
                notes: '',
              });
              setIncomeModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pemasukan</span>
          </button>

          <button
            id="btn-add-expense"
            onClick={() => {
              setEditingExpense({
                date: new Date().toISOString().split('T')[0],
                category: settings.expenseCategories[0] || 'Domain & Hosting',
                description: '',
                amount: 0,
                method: 'Transfer Bank',
                notes: '',
              });
              setExpenseModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Total Pemasukan
            </span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatRupiah(totalIncome)}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {incomes.length} transaksi kas masuk
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Total Pengeluaran
            </span>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              {formatRupiah(totalExpense)}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {expenses.length} transaksi pengeluaran
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Arus Kas Bersih (Saldo)
            </span>
            <p
              className={`text-2xl font-bold mt-1 ${
                netCashFlow >= 0 ? 'text-cyan-700' : 'text-rose-600'
              }`}
            >
              {formatRupiah(netCashFlow)}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Akumulasi laba kas real
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Sub-tab selection */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            id="subtab-income"
            onClick={() => setActiveSubTab('income')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === 'income'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pemasukan ({incomes.length})</span>
          </button>

          <button
            id="subtab-expense"
            onClick={() => setActiveSubTab('expense')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === 'expense'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            <span>Pengeluaran ({expenses.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
          />
        </div>
      </div>

      {/* Table: Pemasukan */}
      {activeSubTab === 'income' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">Klien & Proyek</th>
                  <th className="px-4 py-3.5">Jenis Pemasukan</th>
                  <th className="px-4 py-3.5">Metode</th>
                  <th className="px-4 py-3.5 text-right">Jumlah (Rp)</th>
                  <th className="px-4 py-3.5">Catatan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredIncome.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      Tidak ada data pemasukan
                    </td>
                  </tr>
                ) : (
                  filteredIncome.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {formatDate(item.date)}
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900 block">{item.clientName}</span>
                        {item.projectTitle && (
                          <span className="text-[11px] text-slate-500">{item.projectTitle}</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.incomeType}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700">{item.method}</td>

                      <td className="px-4 py-4 text-right font-bold text-emerald-600 text-sm">
                        +{formatRupiah(item.amount)}
                      </td>

                      <td className="px-4 py-4 text-slate-500 max-w-xs truncate">
                        {item.notes || '-'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingIncome(item);
                              setIncomeModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Hapus entri pemasukan ini?')) {
                                deleteIncome(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Table: Pengeluaran */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Deskripsi</th>
                  <th className="px-4 py-3.5">Metode</th>
                  <th className="px-4 py-3.5 text-right">Jumlah (Rp)</th>
                  <th className="px-4 py-3.5">Catatan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredExpense.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      Tidak ada data pengeluaran
                    </td>
                  </tr>
                ) : (
                  filteredExpense.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {formatDate(item.date)}
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {item.category}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-900">{item.description}</td>

                      <td className="px-4 py-4 font-medium text-slate-700">{item.method}</td>

                      <td className="px-4 py-4 text-right font-bold text-rose-600 text-sm">
                        -{formatRupiah(item.amount)}
                      </td>

                      <td className="px-4 py-4 text-slate-500 max-w-xs truncate">
                        {item.notes || '-'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingExpense(item);
                              setExpenseModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Hapus entri pengeluaran ini?')) {
                                deleteExpense(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Catat Pemasukan */}
      {incomeModalOpen && editingIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingIncome.id ? 'Edit Transaksi Pemasukan' : 'Catat Pemasukan Baru'}
              </h3>
              <button
                onClick={() => setIncomeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editingIncome.date || ''}
                    onChange={(e) => setEditingIncome({ ...editingIncome, date: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Pemasukan
                  </label>
                  <select
                    value={editingIncome.incomeType || 'DP'}
                    onChange={(e) =>
                      setEditingIncome({
                        ...editingIncome,
                        incomeType: e.target.value as IncomeType,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white"
                  >
                    <option value="DP">DP (Uang Muka)</option>
                    <option value="Pelunasan">Pelunasan</option>
                    <option value="Retainer Bulanan">Retainer Bulanan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Klien Terkait <span className="text-rose-500">*</span>
                </label>
                {clients.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                    <p className="font-bold">Belum ada klien terdaftar.</p>
                    <p className="text-[11px] mt-0.5 text-amber-700">
                      Silakan daftarkan klien terlebih dahulu di menu Klien sebelum mencatat pemasukan.
                    </p>
                  </div>
                ) : (
                  <select
                    required
                    value={editingIncome.clientId || ''}
                    onChange={(e) => {
                      const c = clients.find((x) => x.id === e.target.value);
                      if (c) {
                        setEditingIncome({
                          ...editingIncome,
                          clientId: c.id,
                          clientName: c.name,
                        });
                      }
                    }}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="50000"
                    value={editingIncome.amount || ''}
                    onChange={(e) =>
                      setEditingIncome({
                        ...editingIncome,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={editingIncome.method || 'Transfer Bank'}
                    onChange={(e) =>
                      setEditingIncome({
                        ...editingIncome,
                        method: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="E-Wallet">E-Wallet</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editingIncome.notes || ''}
                  onChange={(e) => setEditingIncome({ ...editingIncome, notes: e.target.value })}
                  placeholder="Keterangan transfer, nomor invoice, dll..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIncomeModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Simpan Pemasukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Catat Pengeluaran */}
      {expenseModalOpen && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingExpense.id ? 'Edit Transaksi Pengeluaran' : 'Catat Pengeluaran Baru'}
              </h3>
              <button
                onClick={() => setExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editingExpense.date || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={editingExpense.category || settings.expenseCategories[0]}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white"
                  >
                    {settings.expenseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingExpense.description || ''}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, description: e.target.value })
                  }
                  placeholder="Contoh: Perpanjangan Cloud VPS, Biaya Iklan Meta..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="10000"
                    value={editingExpense.amount || ''}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={editingExpense.method || 'Transfer Bank'}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        method: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden bg-white"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="E-Wallet">E-Wallet</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editingExpense.notes || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  placeholder="Link invoice bukti bayar, catatan partner..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
