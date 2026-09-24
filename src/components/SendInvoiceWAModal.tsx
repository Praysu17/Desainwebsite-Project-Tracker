import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Calendar,
  FileText,
  CreditCard,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Invoice, Proposal } from '../types';
import { useApp } from '../context/AppContext';
import {
  formatRupiah,
  formatDate,
  cleanPhoneNumber,
  createWhatsAppInvoiceMessage,
  createWhatsAppUrl,
} from '../utils/formatters';

interface SendInvoiceWAModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  proposal?: Proposal;
  autoTrigger?: boolean;
}

export const SendInvoiceWAModal: React.FC<SendInvoiceWAModalProps> = ({
  isOpen,
  onClose,
  invoice,
  proposal,
  autoTrigger = false,
}) => {
  const { settings } = useApp();

  const [phone, setPhone] = useState(
    invoice.clientContact || proposal?.clientContact || ''
  );
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [autoOpenPreference, setAutoOpenPreference] = useState<boolean>(() => {
    return localStorage.getItem('sugeng_wa_auto_open') === 'true';
  });

  const invoiceUrl = `${window.location.origin}/share/invoice/${invoice.shareToken}`;

  // Get primary bank info
  const primaryBank = settings.bankAccounts?.[0] || {
    bankName: settings.bankName || 'BCA',
    accountNumber: settings.bankAccount || '8830-1928-11',
    accountHolder: settings.bankHolder || settings.agencyName,
  };

  const messageText = createWhatsAppInvoiceMessage({
    clientName: invoice.clientName,
    projectTitle: invoice.projectTitle,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount,
    dueDate: invoice.dueDate,
    invoiceUrl,
    agencyName: settings.agencyName,
    bankName: primaryBank.bankName,
    bankAccount: primaryBank.accountNumber,
    bankHolder: primaryBank.accountHolder,
  });

  const cleanedPhone = cleanPhoneNumber(phone);
  const waUrl = createWhatsAppUrl(cleanedPhone, messageText);

  // Auto trigger WhatsApp tab if requested or user has preference
  useEffect(() => {
    if (isOpen && autoTrigger && autoOpenPreference && cleanedPhone) {
      const timer = setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoTrigger, autoOpenPreference, cleanedPhone, waUrl]);

  const handleToggleAutoOpen = (checked: boolean) => {
    setAutoOpenPreference(checked);
    localStorage.setItem('sugeng_wa_auto_open', checked ? 'true' : 'false');
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invoiceUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    window.open(waUrl, '_blank');
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative my-auto bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Kirim Invoice ke WhatsApp Klien
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Otomatis
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pesan telah disusun otomatis dengan data proyek dan link tagihan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Invoice Summary Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-600" />
                No. Invoice
              </span>
              <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                Klien & Proyek
              </span>
              <span className="font-bold text-slate-900 text-right truncate max-w-[200px]">
                {invoice.clientName} ({invoice.projectTitle})
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                Total Tagihan
              </span>
              <span className="font-bold text-emerald-700 text-sm">
                {formatRupiah(invoice.totalAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Jatuh Tempo
              </span>
              <span className="font-medium text-slate-700">{formatDate(invoice.dueDate)}</span>
            </div>
          </div>

          {/* Client WhatsApp Number Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Nomor WhatsApp Tujuan Klien:
              </label>
              {cleanedPhone && cleanedPhone.length >= 8 ? (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Siap Dikirim (+{cleanedPhone})
                </span>
              ) : (
                <span className="text-[10px] text-rose-500 font-medium">
                  Masukkan nomor WhatsApp valid
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789 atau 628123456789"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden font-mono text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pratinjau Pesan yang Akan Dikirim:
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Pesan Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Salin Teks</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl text-slate-700 font-sans text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line select-text">
              {messageText}
            </div>
          </div>

          {/* Auto-Open Preference Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <label
              htmlFor="toggle-auto-open-wa"
              className="text-slate-700 cursor-pointer font-medium select-none pr-2"
            >
              Buka otomatis tab WhatsApp setiap kali proposal disetujui
            </label>
            <input
              type="checkbox"
              id="toggle-auto-open-wa"
              checked={autoOpenPreference}
              onChange={(e) => handleToggleAutoOpen(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Salin Link Invoice</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Tutup
            </button>

            <button
              type="button"
              id="btn-confirm-send-wa"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Buka WhatsApp & Kirim Pesan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
