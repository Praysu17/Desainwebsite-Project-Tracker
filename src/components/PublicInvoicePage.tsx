import React, { useState } from 'react';
import {
  Receipt,
  Printer,
  MessageSquare,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  Mail,
  CreditCard,
  QrCode,
  ArrowLeft,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, formatRupiah, getStatusBadgeClass } from '../utils/formatters';

interface PublicInvoicePageProps {
  token: string;
}

export const PublicInvoicePage: React.FC<PublicInvoicePageProps> = ({ token }) => {
  const { invoices, settings, setPublicShare } = useApp();

  const [copiedBank, setCopiedBank] = useState(false);

  const invoice = invoices.find((inv) => inv.shareToken === token);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Invoice Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-2">
            Dokumen tagihan ini tidak ditemukan atau tautan telah kadaluarsa.
          </p>
          <button
            onClick={() => {
              setPublicShare(null);
              window.history.pushState({}, '', '/');
            }}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ke Halaman Utama / Login</span>
          </button>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'Lunas';

  const handleCopyBankAccount = () => {
    navigator.clipboard.writeText(settings.bankAccount);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleWhatsAppConfirmation = () => {
    const text = encodeURIComponent(
      `Halo ${settings.agencyName},\n\nSaya telah melakukan pembayaran untuk tagihan:\n- Invoice: #${invoice.invoiceNumber}\n- Proyek: ${invoice.projectTitle}\n- Klien: ${invoice.clientName}\n- Nominal: ${formatRupiah(invoice.totalAmount)}\n\nMohon dicek dan diverifikasi. Terima kasih!`
    );

    const cleanNum = settings.agencyPhone.replace(/[^0-9]/g, '');
    let waUrl = `https://wa.me/?text=${text}`;
    if (cleanNum.length >= 8) {
      const intlNum = cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum;
      waUrl = `https://wa.me/${intlNum}?text=${text}`;
    }
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100/90 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800 print:bg-white print:p-0">
      {/* Top action bar (hidden in print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Download PDF</span>
          </button>
        </div>

        {!isPaid && (
          <button
            onClick={handleWhatsAppConfirmation}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 rounded-xl transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Konfirmasi Pembayaran via WhatsApp</span>
          </button>
        )}
      </div>

      {/* Printable Invoice Container */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Header Bar */}
        <div className="p-8 sm:p-10 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/sugeng-logo.svg"
              alt="Logo"
              className="w-14 h-14 rounded-2xl shadow-xs border border-slate-100"
            />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{settings.agencyName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{settings.agencyTagline}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {settings.agencyAddress} • WA: {settings.agencyPhone}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block">
              INVOICE RESMI
            </span>
            <span className="text-xl font-black font-mono text-slate-900">
              #{invoice.invoiceNumber}
            </span>

            <div className="mt-2">
              <span
                className={`inline-block px-3 py-1 text-xs font-black uppercase rounded-full border ${getStatusBadgeClass(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To & Dates */}
        <div className="p-8 sm:p-10 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ditagihkan Kepada:
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{invoice.clientName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{invoice.clientContact}</p>
            <p className="text-xs font-semibold text-cyan-800 mt-1">{invoice.projectTitle}</p>
          </div>

          <div className="sm:text-right space-y-1.5 text-xs">
            <div>
              <span className="text-slate-400">Tanggal Terbit: </span>
              <span className="font-bold text-slate-800">{formatDate(invoice.createdAt)}</span>
            </div>
            <div>
              <span className="text-slate-400">Jatuh Tempo: </span>
              <span className="font-bold text-rose-600">{formatDate(invoice.dueDate)}</span>
            </div>
            {invoice.paidAt && (
              <div>
                <span className="text-slate-400">Tanggal Lunas: </span>
                <span className="font-bold text-emerald-600">{formatDate(invoice.paidAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="p-8 sm:p-10">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="text-[11px] font-bold text-slate-700 uppercase">
              <tr>
                <th className="pb-3">Deskripsi Tagihan</th>
                <th className="pb-3 text-center w-16">Qty</th>
                <th className="pb-3 text-right w-32">Harga Satuan</th>
                <th className="pb-3 text-right w-36">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, i) => (
                <tr key={item.id || i}>
                  <td className="py-4 font-semibold text-slate-900">{item.description}</td>
                  <td className="py-4 text-center text-slate-600">{item.quantity || 1}</td>
                  <td className="py-4 text-right text-slate-600">
                    {formatRupiah(item.unitPrice)}
                  </td>
                  <td className="py-4 text-right font-bold text-slate-900">
                    {formatRupiah(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t-2 border-slate-900">
                <td colSpan={3} className="pt-4 font-extrabold text-sm uppercase text-slate-900">
                  Total Tagihan
                </td>
                <td className="pt-4 text-right font-black text-xl text-slate-900">
                  {formatRupiah(invoice.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Instructions Box */}
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="space-y-2 flex-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-cyan-600" />
                <span>Instruksi Transfer Bank</span>
              </h4>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bank:</span>
                  <span className="font-bold text-slate-900">{settings.bankName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">No. Rekening:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-800 text-sm">
                      {settings.bankAccount}
                    </span>
                    <button
                      onClick={handleCopyBankAccount}
                      className="p-1 text-slate-400 hover:text-slate-700 print:hidden"
                      title="Salin No Rekening"
                    >
                      {copiedBank ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Atas Nama:</span>
                  <span className="font-bold text-slate-900">{settings.bankHolder}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {settings.invoiceDefaultNotes}
              </p>
            </div>

            {/* Paid Stamp or Action Box */}
            <div className="sm:w-64 text-center sm:text-right flex flex-col items-center sm:items-end justify-center">
              {isPaid ? (
                <div className="p-4 border-2 border-emerald-500 rounded-2xl bg-emerald-50/60 text-center w-full">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <span className="text-sm font-black uppercase text-emerald-700 tracking-wider">
                    LUNAS
                  </span>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    Pembayaran telah diverifikasi
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-2 print:hidden">
                  <button
                    onClick={handleWhatsAppConfirmation}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Konfirmasi Transfer</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Kirim bukti bayar langsung ke WA Admin
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
