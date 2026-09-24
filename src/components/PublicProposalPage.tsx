import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Phone,
  Mail,
  Clock,
  Printer,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, formatRupiah, getStatusBadgeClass } from '../utils/formatters';

interface PublicProposalPageProps {
  token: string;
}

export const PublicProposalPage: React.FC<PublicProposalPageProps> = ({ token }) => {
  const {
    proposals,
    invoices,
    settings,
    recordProposalView,
    acceptProposal,
    rejectProposal,
    setPublicShare,
  } = useApp();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    invoiceToken?: string;
    invoiceNumber?: string;
    whatsappUrl?: string;
  } | null>(null);

  // Find proposal by token
  const proposal = proposals.find((p) => p.shareToken === token);

  // Record view on mount
  useEffect(() => {
    if (proposal && (proposal.status === 'Terkirim' || !proposal.viewedAt)) {
      recordProposalView(token);
    }
  }, [token, proposal]);

  if (!proposal) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Proposal Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-2">
            Dokumen proposal dengan tautan ini tidak tersedia atau masa berlakunya telah berakhir.
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

  // Linked invoice if already accepted
  const relatedInvoice = proposal.invoiceId
    ? invoices.find((inv) => inv.id === proposal.invoiceId)
    : null;

  const isExpired = new Date(proposal.expiryDate).getTime() < new Date().setHours(0, 0, 0, 0);

  const handleAccept = () => {
    if (confirm('Konfirmasi penerimaan proposal penawaran ini?')) {
      setIsProcessing(true);
      const res = acceptProposal(proposal.shareToken);
      setIsProcessing(false);
      if (res && res.invoiceToken) {
        setSuccessInfo({
          invoiceToken: res.invoiceToken,
          invoiceNumber: res.invoiceNumber,
          whatsappUrl: res.whatsappUrl,
        });
      }
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rejectProposal(proposal.shareToken, rejectReason);
    setRejectModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      {/* Top Floating Notification if Proposal is already decided */}
      {proposal.status === 'Disetujui' && (
        <div className="max-w-4xl mx-auto mb-6 bg-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              Proposal ini telah <strong>Disetujui</strong>. Invoice uang muka pengerjaan telah diterbitkan.
            </span>
          </div>
          {relatedInvoice && (
            <button
              onClick={() => setPublicShare({ type: 'invoice', token: relatedInvoice.shareToken })}
              className="px-3.5 py-1.5 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors shrink-0 ml-3"
            >
              Buka Invoice #{relatedInvoice.invoiceNumber}
            </button>
          )}
        </div>
      )}

      {proposal.status === 'Ditolak' && (
        <div className="max-w-4xl mx-auto mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-5 py-3.5 rounded-2xl shadow-xs flex items-center gap-3">
          <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div className="text-xs">
            <span className="font-bold">Proposal Ditolak.</span> Alasan:{' '}
            {proposal.rejectionReason || 'Tidak ada alasan khusus.'}
          </div>
        </div>
      )}

      {/* Main Document Paper Container */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-[#0A192F] p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <img
                src="/sugeng-logo.svg"
                alt="Sugeng Logo"
                className="w-14 h-14 rounded-2xl shadow-md"
              />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  {settings.agencyName}
                </h1>
                <p className="text-xs text-cyan-300 font-medium tracking-wide">
                  {settings.agencyTagline}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 block">
                Dokumen Penawaran
              </span>
              <span className="text-lg font-mono font-bold text-cyan-400">
                {proposal.proposalNumber}
              </span>
              <div className="mt-1">
                <span
                  className={`inline-block px-3 py-0.5 text-xs font-bold rounded-full ${
                    proposal.status === 'Disetujui'
                      ? 'bg-emerald-500 text-white'
                      : proposal.status === 'Ditolak'
                      ? 'bg-rose-500 text-white'
                      : 'bg-cyan-500 text-slate-950'
                  }`}
                >
                  Status: {proposal.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 sm:p-10 space-y-8">
          {/* Title & Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Ditujukan Kepada Klien
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{proposal.clientName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{proposal.clientContact}</p>
            </div>

            <div className="md:text-right space-y-1">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">
                  Tanggal Terbit:{' '}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {formatDate(proposal.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">
                  Masa Berlaku:{' '}
                </span>
                <span
                  className={`text-xs font-bold ${
                    isExpired ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  {formatDate(proposal.expiryDate)} {isExpired ? '(Kadaluarsa)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Project Title Banner */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-widest block mb-1">
              Judul Pekerjaan & Ruang Lingkup
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {proposal.projectTitle}
            </h2>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Rincian Spesifikasi & Biaya
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-bold text-slate-700 uppercase text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Deskripsi Ruang Lingkup</th>
                    <th className="px-4 py-3.5 text-center w-20">Qty</th>
                    <th className="px-5 py-3.5 text-right w-44">Investasi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {proposal.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block text-sm">
                          {item.name}
                        </span>
                        {item.description && (
                          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-slate-700">
                        {item.quantity || 1}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900 text-sm">
                        {formatRupiah((item.quantity || 1) * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-slate-900 text-white">
                  <tr>
                    <td colSpan={2} className="px-5 py-4 font-bold text-sm uppercase">
                      Total Nilai Investasi
                    </td>
                    <td className="px-5 py-4 text-right font-black text-lg text-cyan-300">
                      {formatRupiah(proposal.totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Terms and Conditions */}
          {proposal.terms && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Syarat & Ketentuan Kerjasama</span>
              </h4>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-line">
                {proposal.terms}
              </div>
            </div>
          )}

          {/* Agency Signature Box */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-900">{settings.agencyName}</p>
              <p>{settings.agencyAddress}</p>
              <p>
                WhatsApp: {settings.agencyPhone} • Email: {settings.agencyEmail}
              </p>
            </div>

            <div className="text-right">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Proposal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer Bar (Accept / Reject) */}
        {proposal.status !== 'Disetujui' && proposal.status !== 'Ditolak' && !isExpired && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 text-center sm:text-left">
              Dengan mengklik <strong>"Terima Proposal"</strong>, Anda menyetujui ruang lingkup dan syarat pengerjaan.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setRejectModalOpen(true)}
                className="flex-1 sm:flex-none px-5 py-3 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl transition-colors"
              >
                Tolak Proposal
              </button>

              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-8 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isProcessing ? 'Memproses...' : 'Terima Proposal Ini'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal upon acceptance */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">
              Proposal Berhasil Disetujui!
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Terima kasih atas kepercayaan Anda. Proyek telah resmi terdaftar dan Invoice Down Payment (DP) telah diterbitkan secara otomatis.
            </p>

            {successInfo.invoiceToken && (
              <div className="pt-2 space-y-2.5">
                <button
                  onClick={() =>
                    setPublicShare({ type: 'invoice', token: successInfo.invoiceToken! })
                  }
                  className="w-full py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Buka Invoice Pembayaran DP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {successInfo.whatsappUrl && (
                  <a
                    href={successInfo.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 fill-current text-emerald-600" />
                    <span>Kirim / Simpan Salinan ke WhatsApp Klien</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tolak Proposal Penawaran</h3>
            <p className="text-xs text-slate-500">
              Mohon berikan masukan atau alasan singkat mengapa proposal belum sesuai agar kami dapat memperbaiki penawaran:
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Budget belum mencukupi / scope perlu disesuaikan..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-hidden focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  Kirim Penolakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
