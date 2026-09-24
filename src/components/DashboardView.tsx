import React, { useMemo } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Coins,
  Wallet,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Calendar,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, formatRupiah, getStatusBadgeClass } from '../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    projects,
    incomes,
    expenses,
    proposals,
    invoices,
    setActiveTab,
    setSelectedClientId,
  } = useApp();

  // Current year & month metrics
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // 1. Proyek Aktif: status not Selesai/Batal
  const activeProjects = useMemo(() => {
    return projects.filter((p) => p.status !== 'Selesai' && p.status !== 'Batal');
  }, [projects]);

  // 2. Proyek Selesai bulan ini
  const completedProjectsThisMonth = useMemo(() => {
    return projects.filter((p) => {
      if (p.status !== 'Selesai') return false;
      const d = new Date(p.deadline || p.startDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [projects, currentYear, currentMonth]);

  // 3. Proyek Deadline 7 hari ke depan
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);
    in7Days.setHours(23, 59, 59, 999);

    return projects.filter((p) => {
      if (p.status === 'Selesai' || p.status === 'Batal') return false;
      if (!p.deadline) return false;
      const deadlineDate = new Date(p.deadline);
      return deadlineDate >= today && deadlineDate <= in7Days;
    });
  }, [projects]);

  // 4. Total Piutang Belum Lunas (SUM Sisa Pembayaran)
  const totalPiutang = useMemo(() => {
    return projects.reduce((sum, p) => sum + (p.remainingPayment || 0), 0);
  }, [projects]);

  // 5. Pemasukan bulan ini
  const incomeThisMonth = useMemo(() => {
    return incomes.reduce((sum, item) => {
      const d = new Date(item.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        return sum + item.amount;
      }
      return sum;
    }, 0);
  }, [incomes, currentYear, currentMonth]);

  // 6. Pengeluaran bulan ini
  const expenseThisMonth = useMemo(() => {
    return expenses.reduce((sum, item) => {
      const d = new Date(item.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        return sum + item.amount;
      }
      return sum;
    }, 0);
  }, [expenses, currentYear, currentMonth]);

  // 7. Laba Bersih bulan ini
  const netProfitThisMonth = incomeThisMonth - expenseThisMonth;

  // 8. Kas Diterima (Total seluruh pemasukan real yang tercatat)
  const totalRealCash = useMemo(() => {
    return incomes.reduce((sum, item) => sum + item.amount, 0);
  }, [incomes]);

  // 9. Omset (Total Nilai Proyek berjalan & tercatat)
  const totalOmset = useMemo(() => {
    return projects.reduce((sum, p) => sum + (p.projectValue || 0), 0);
  }, [projects]);

  // Priority Attention Items ("Perlu Perhatian")
  const priorityAttentionItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      client: string;
      dueDate: string;
      type: 'project_deadline' | 'invoice_overdue' | 'invoice_near';
      amount?: number;
      severity: 'red' | 'yellow';
      linkTab: 'projects' | 'invoices';
    }> = [];

    const todayStr = now.toISOString().split('T')[0];
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split('T')[0];

    // Check overdue invoices
    invoices.forEach((inv) => {
      if (inv.status !== 'Lunas') {
        if (inv.dueDate && inv.dueDate < todayStr) {
          items.push({
            id: `att-inv-${inv.id}`,
            title: `Invoice ${inv.invoiceNumber} Jatuh Tempo`,
            client: inv.clientName,
            dueDate: inv.dueDate,
            type: 'invoice_overdue',
            amount: inv.totalAmount - (inv.amountPaid || 0),
            severity: 'red',
            linkTab: 'invoices',
          });
        } else if (inv.dueDate && inv.dueDate <= in7DaysStr) {
          items.push({
            id: `att-inv-near-${inv.id}`,
            title: `Invoice ${inv.invoiceNumber} Jatuh Tempo ${formatDate(inv.dueDate)}`,
            client: inv.clientName,
            dueDate: inv.dueDate,
            type: 'invoice_near',
            amount: inv.totalAmount - (inv.amountPaid || 0),
            severity: 'yellow',
            linkTab: 'invoices',
          });
        }
      }
    });

    // Check approaching project deadlines
    projects.forEach((proj) => {
      if (proj.status !== 'Selesai' && proj.status !== 'Batal' && proj.deadline) {
        if (proj.deadline < todayStr) {
          items.push({
            id: `att-proj-over-${proj.id}`,
            title: `Proyek Melewati Deadline (${proj.serviceType})`,
            client: proj.clientName,
            dueDate: proj.deadline,
            type: 'project_deadline',
            amount: proj.projectValue,
            severity: 'red',
            linkTab: 'projects',
          });
        } else if (proj.deadline <= in7DaysStr) {
          items.push({
            id: `att-proj-near-${proj.id}`,
            title: `Deadline Proyek Segera (${proj.serviceType})`,
            client: proj.clientName,
            dueDate: proj.deadline,
            type: 'project_deadline',
            amount: proj.projectValue,
            severity: 'yellow',
            linkTab: 'projects',
          });
        }
      }
    });

    return items;
  }, [invoices, projects, now]);

  // Last 6 months mini chart data
  const sixMonthsData = useMemo(() => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();

      // Inflow
      const mIncome = incomes
        .filter((inc) => {
          const incDate = new Date(inc.date);
          return incDate.getMonth() === mIdx && incDate.getFullYear() === y;
        })
        .reduce((sum, x) => sum + x.amount, 0);

      // Outflow
      const mExpense = expenses
        .filter((exp) => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === mIdx && expDate.getFullYear() === y;
        })
        .reduce((sum, x) => sum + x.amount, 0);

      // Project Omset created/active in this month
      const mOmset = projects
        .filter((prj) => {
          const pDate = new Date(prj.startDate);
          return pDate.getMonth() === mIdx && pDate.getFullYear() === y;
        })
        .reduce((sum, x) => sum + x.projectValue, 0);

      const mNet = mIncome - mExpense;

      months.push({
        label: `${monthNames[mIdx]}`,
        omset: mOmset || mIncome,
        income: mIncome,
        expense: mExpense,
        net: mNet,
      });
    }
    return months;
  }, [currentYear, currentMonth, incomes, expenses, projects]);

  const maxChartValue = Math.max(...sixMonthsData.map((d) => Math.max(d.omset, d.income, 1000000)));

  return (
    <div className="space-y-7 pb-12">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Agensi
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Ikhtisar performa proyek, piutang, dan arus kas SP Digital
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('projects')}
            id="btn-quick-new-project"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl shadow-xs transition-colors"
          >
            <FolderKanban className="w-4 h-4 text-cyan-600" />
            <span>Kelola Proyek</span>
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            id="btn-quick-create-proposal"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>+ Buat Proposal Baru</span>
          </button>
        </div>
      </div>

      {/* 9 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {/* 1. Proyek Aktif */}
        <div
          id="kpi-active-projects"
          onClick={() => setActiveTab('projects')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Proyek Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeProjects.length} Proyek
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Sedang dalam tahap pengerjaan / revisi</span>
            </div>
          </div>
        </div>

        {/* 2. Proyek Selesai Bulan Ini */}
        <div
          id="kpi-completed-projects"
          onClick={() => setActiveTab('projects')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Selesai Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              {completedProjectsThisMonth.length} Proyek
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Telah serah terima ke klien
            </div>
          </div>
        </div>

        {/* 3. Deadline 7 Hari Ke Depan */}
        <div
          id="kpi-upcoming-deadlines"
          onClick={() => setActiveTab('projects')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Deadline ≤ 7 Hari
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600 tracking-tight">
              {upcomingDeadlines.length} Proyek
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Perlu prioritas monitoring tim
            </div>
          </div>
        </div>

        {/* 4. Total Piutang Belum Lunas */}
        <div
          id="kpi-unpaid-receivables"
          onClick={() => setActiveTab('projects')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Piutang
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 tracking-tight">
              {formatRupiah(totalPiutang)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Total sisa pembayaran belum tertagih
            </div>
          </div>
        </div>

        {/* 5. Pemasukan Bulan Ini */}
        <div
          id="kpi-income-month"
          onClick={() => setActiveTab('finance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pemasukan Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(incomeThisMonth)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Total DP & pelunasan masuk
            </div>
          </div>
        </div>

        {/* 6. Pengeluaran Bulan Ini */}
        <div
          id="kpi-expense-month"
          onClick={() => setActiveTab('finance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pengeluaran Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(expenseThisMonth)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Hosting, ads, tools & operasional
            </div>
          </div>
        </div>

        {/* 7. Laba Bersih Bulan Ini */}
        <div
          id="kpi-net-profit-month"
          onClick={() => setActiveTab('reports')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Laba Bersih Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold tracking-tight ${
                netProfitThisMonth >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatRupiah(netProfitThisMonth)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Pemasukan dikurangi pengeluaran
            </div>
          </div>
        </div>

        {/* 8. Kas Diterima (Real Inflow) */}
        <div
          id="kpi-real-cash"
          onClick={() => setActiveTab('finance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Kas Masuk (Real)
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-cyan-700 tracking-tight">
              {formatRupiah(totalRealCash)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Akumulasi pembayaran yang telah cair
            </div>
          </div>
        </div>

        {/* 9. Omset (Total Nilai Proyek) */}
        <div
          id="kpi-total-omset"
          onClick={() => setActiveTab('projects')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Omset Proyek
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(totalOmset)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Nilai kontrak seluruh proyek tercatat
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & "Perlu Perhatian" Alert List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Mini Omset & Net Profit Chart (6 Bulan Terakhir) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tren Omset & Laba Bersih (6 Bulan)
              </h3>
              <p className="text-xs text-slate-400">
                Grafik perbandingan inflow pendapatan vs laba operasional
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-cyan-500 inline-block" />
                <span className="text-slate-600">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                <span className="text-slate-600">Laba Bersih</span>
              </div>
            </div>
          </div>

          {/* SVG Bar / Chart Visual */}
          <div className="h-56 flex items-end justify-between gap-3 pt-4 border-b border-slate-100">
            {sixMonthsData.map((d, idx) => {
              const incomeHeight = Math.max(8, Math.round((d.income / maxChartValue) * 160));
              const netHeight = Math.max(4, Math.round((Math.max(0, d.net) / maxChartValue) * 160));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg shadow-lg z-20 whitespace-nowrap">
                    <p className="font-semibold">{d.label}</p>
                    <p>Masuk: {formatRupiah(d.income)}</p>
                    <p>Laba: {formatRupiah(d.net)}</p>
                  </div>

                  {/* Bars side by side */}
                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    <div
                      style={{ height: `${incomeHeight}px` }}
                      className="w-1/2 max-w-[22px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                    />
                    <div
                      style={{ height: `${netHeight}px` }}
                      className="w-1/2 max-w-[22px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                    />
                  </div>

                  <span className="text-xs font-semibold text-slate-600">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: "Perlu Perhatian" Alert List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-base font-bold text-slate-900">Perlu Perhatian</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {priorityAttentionItems.length} Hal
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-72 pr-1">
            {priorityAttentionItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-xs">Semua deadline & invoice terpantau aman!</p>
              </div>
            ) : (
              priorityAttentionItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.linkTab)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs flex items-start gap-3 ${
                    item.severity === 'red'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <AlertCircle
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      item.severity === 'red' ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{item.title}</p>
                    <p className="text-xs opacity-85 mt-0.5 truncate">
                      Klien: {item.client}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] font-medium opacity-90">
                      <span>Jatuh tempo: {formatDate(item.dueDate)}</span>
                      {item.amount !== undefined && <span>{formatRupiah(item.amount)}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50 self-center" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: 5 Recent Proposals & 5 Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5 Proposal Terbaru */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Proposal Terbaru</h3>
            <button
              onClick={() => setActiveTab('proposals')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {proposals.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada proposal yang dibuat.
              </div>
            ) : (
              proposals.slice(0, 5).map((prop) => (
                <div
                  key={prop.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {prop.projectTitle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Klien: <span className="font-medium text-slate-700">{prop.clientName}</span> • {prop.proposalNumber}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900">
                      {formatRupiah(prop.totalValue)}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(
                        prop.status
                      )}`}
                    >
                      {prop.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5 Invoice Terbaru */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Invoice Terbaru</h3>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada invoice yang diterbitkan.
              </div>
            ) : (
              invoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {inv.invoiceNumber} — {inv.clientName}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {inv.projectTitle} • Tempo: {formatDate(inv.dueDate)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900">
                      {formatRupiah(inv.totalAmount)}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(
                        inv.status
                      )}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
