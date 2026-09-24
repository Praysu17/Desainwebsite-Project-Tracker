import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  PieChart,
  TrendingUp,
  TrendingDown,
  Coins,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const { incomes, expenses, settings } = useApp();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear, currentYear - 1]);
    incomes.forEach((i) => years.add(new Date(i.date).getFullYear()));
    expenses.forEach((e) => years.add(new Date(e.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [incomes, expenses, currentYear]);

  // Month names
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  // Monthly breakdown for selected year
  const monthlyData = useMemo(() => {
    return monthNames.map((name, monthIndex) => {
      // Incomes in this month
      const monthIncome = incomes
        .filter((i) => {
          const d = new Date(i.date);
          return d.getFullYear() === selectedYear && d.getMonth() === monthIndex;
        })
        .reduce((sum, item) => sum + item.amount, 0);

      // Expenses in this month
      const monthExpense = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === selectedYear && d.getMonth() === monthIndex;
        })
        .reduce((sum, item) => sum + item.amount, 0);

      const netProfit = monthIncome - monthExpense;

      // Partner split profit for positive profit
      const partnerSplits = settings.partnerSplits.map((partner) => {
        const splitAmount = netProfit > 0 ? Math.round(netProfit * (partner.percentage / 100)) : 0;
        return {
          partnerId: partner.id,
          name: partner.name,
          percentage: partner.percentage,
          amount: splitAmount,
        };
      });

      return {
        monthIndex,
        monthName: name,
        income: monthIncome,
        expense: monthExpense,
        netProfit,
        partnerSplits,
      };
    });
  }, [incomes, expenses, selectedYear, settings.partnerSplits]);

  // Annual Totals
  const annualIncome = useMemo(
    () => monthlyData.reduce((sum, m) => sum + m.income, 0),
    [monthlyData]
  );
  const annualExpense = useMemo(
    () => monthlyData.reduce((sum, m) => sum + m.expense, 0),
    [monthlyData]
  );
  const annualNetProfit = annualIncome - annualExpense;
  const profitMargin = annualIncome > 0 ? Math.round((annualNetProfit / annualIncome) * 100) : 0;

  // Previous year totals for YoY comparison
  const previousYearIncome = useMemo(() => {
    return incomes
      .filter((i) => new Date(i.date).getFullYear() === selectedYear - 1)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [incomes, selectedYear]);

  const previousYearExpense = useMemo(() => {
    return expenses
      .filter((e) => new Date(e.date).getFullYear() === selectedYear - 1)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [expenses, selectedYear]);

  const previousYearNet = previousYearIncome - previousYearExpense;

  // YoY Growth Rate
  const yoyIncomeGrowth =
    previousYearIncome > 0
      ? Math.round(((annualIncome - previousYearIncome) / previousYearIncome) * 100)
      : null;

  const yoyNetGrowth =
    previousYearNet > 0
      ? Math.round(((annualNetProfit - previousYearNet) / Math.abs(previousYearNet)) * 100)
      : null;

  // Max value for SVG chart scaling
  const maxMonthlyVal = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expense, Math.abs(m.netProfit), 1000000))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Laporan Rekap & Split Profit
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Analisis tren bulanan, laba bersih, dan pembagian profit antar partner otomatis
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Tahun:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="text-xs font-bold text-slate-900 bg-transparent outline-hidden cursor-pointer"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Annual Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Pemasukan Setahun ({selectedYear})
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatRupiah(annualIncome)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            {yoyIncomeGrowth !== null ? (
              <span
                className={`font-semibold ${
                  yoyIncomeGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {yoyIncomeGrowth >= 0 ? `+${yoyIncomeGrowth}%` : `${yoyIncomeGrowth}%`} YoY
              </span>
            ) : (
              <span>Basis data tahun pertama</span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Pengeluaran Setahun ({selectedYear})
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {formatRupiah(annualExpense)}
          </p>
          <div className="text-[11px] text-slate-400 mt-1">
            Biaya tools, server & operasional
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Laba Bersih Setahun
          </span>
          <p
            className={`text-2xl font-bold mt-1 ${
              annualNetProfit >= 0 ? 'text-cyan-700' : 'text-rose-600'
            }`}
          >
            {formatRupiah(annualNetProfit)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            {yoyNetGrowth !== null ? (
              <span
                className={`font-semibold ${
                  yoyNetGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {yoyNetGrowth >= 0 ? `+${yoyNetGrowth}%` : `${yoyNetGrowth}%`} YoY
              </span>
            ) : (
              <span>Siap dibagikan ke partner</span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Margin Profit Bersih
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{profitMargin}%</p>
          <div className="text-[11px] text-slate-400 mt-1">
            Rasio efisiensi operasional agensi
          </div>
        </div>
      </div>

      {/* Chart: Tren Pemasukan vs Pengeluaran vs Laba Bersih */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tren Keuangan Bulanan Tahun {selectedYear}
            </h3>
            <p className="text-xs text-slate-400">
              Pergerakan Pemasukan, Pengeluaran, dan Laba Bersih (Januari — Desember)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span className="text-slate-600">Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-400" />
              <span className="text-slate-600">Pengeluaran</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-cyan-500" />
              <span className="text-slate-600">Laba Bersih</span>
            </div>
          </div>
        </div>

        {/* SVG Chart visual */}
        <div className="h-64 flex items-end justify-between gap-2 pt-4 border-b border-slate-100">
          {monthlyData.map((m) => {
            const incHeight = Math.max(4, Math.round((m.income / maxMonthlyVal) * 190));
            const expHeight = Math.max(4, Math.round((m.expense / maxMonthlyVal) * 190));
            const netHeight = Math.max(
              2,
              Math.round((Math.max(0, m.netProfit) / maxMonthlyVal) * 190)
            );

            return (
              <div
                key={m.monthIndex}
                className="flex-1 flex flex-col items-center gap-1.5 group relative"
              >
                {/* Tooltip */}
                <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl z-20 whitespace-nowrap">
                  <p className="font-bold">{m.monthName}</p>
                  <p className="text-emerald-300">Masuk: {formatRupiah(m.income)}</p>
                  <p className="text-rose-300">Keluar: {formatRupiah(m.expense)}</p>
                  <p className="text-cyan-300 font-semibold">Laba: {formatRupiah(m.netProfit)}</p>
                </div>

                {/* 3 Bars */}
                <div className="w-full flex items-end justify-center gap-1 h-48">
                  <div
                    style={{ height: `${incHeight}px` }}
                    className="w-1/3 max-w-[12px] bg-emerald-500 rounded-t-sm"
                  />
                  <div
                    style={{ height: `${expHeight}px` }}
                    className="w-1/3 max-w-[12px] bg-rose-400 rounded-t-sm"
                  />
                  <div
                    style={{ height: `${netHeight}px` }}
                    className="w-1/3 max-w-[12px] bg-cyan-500 rounded-t-sm"
                  />
                </div>

                <span className="text-[11px] font-semibold text-slate-500 truncate w-full text-center">
                  {m.monthName.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Rekap Bulanan & Split Profit Otomatis */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              <span>Tabel Rekapitulasi & Pembagian Split Profit {selectedYear}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nilai split profit dihitung otomatis dari Laba Bersih berdasarkan persentase partner di Pengaturan.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="px-2.5 py-1 bg-cyan-50 text-cyan-800 rounded-lg border border-cyan-200">
              Konfigurasi: {settings.partnerSplits.map((p) => `${p.name} (${p.percentage}%)`).join(', ')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-100">
            <thead className="bg-slate-50/90 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Bulan</th>
                <th className="px-4 py-3.5 text-right">Pemasukan</th>
                <th className="px-4 py-3.5 text-right">Pengeluaran</th>
                <th className="px-4 py-3.5 text-right font-bold text-slate-900">Laba Bersih</th>
                {settings.partnerSplits.map((partner) => (
                  <th
                    key={partner.id}
                    className="px-4 py-3.5 text-right text-cyan-900 font-bold bg-cyan-50/40"
                  >
                    {partner.name} ({partner.percentage}%)
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {monthlyData.map((m) => (
                <tr key={m.monthIndex} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800">{m.monthName}</td>

                  <td className="px-4 py-3.5 text-right font-semibold text-emerald-600">
                    {formatRupiah(m.income)}
                  </td>

                  <td className="px-4 py-3.5 text-right font-semibold text-rose-600">
                    {formatRupiah(m.expense)}
                  </td>

                  <td
                    className={`px-4 py-3.5 text-right font-bold ${
                      m.netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {formatRupiah(m.netProfit)}
                  </td>

                  {m.partnerSplits.map((split) => (
                    <td
                      key={split.partnerId}
                      className="px-4 py-3.5 text-right font-bold text-cyan-800 bg-cyan-50/20"
                    >
                      {formatRupiah(split.amount)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

            {/* Total Footer */}
            <tfoot className="bg-slate-900 text-white font-bold text-xs">
              <tr>
                <td className="px-5 py-4 uppercase">Total Setahun ({selectedYear})</td>
                <td className="px-4 py-4 text-right text-emerald-400">{formatRupiah(annualIncome)}</td>
                <td className="px-4 py-4 text-right text-rose-300">{formatRupiah(annualExpense)}</td>
                <td className="px-4 py-4 text-right text-cyan-300">{formatRupiah(annualNetProfit)}</td>
                {settings.partnerSplits.map((partner) => {
                  const partnerTotal =
                    annualNetProfit > 0
                      ? Math.round(annualNetProfit * (partner.percentage / 100))
                      : 0;
                  return (
                    <td key={partner.id} className="px-4 py-4 text-right text-white">
                      {formatRupiah(partnerTotal)}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
