export const formatRupiah = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
};

export const getStatusBadgeClass = (status: string): string => {
  const s = status.toLowerCase();
  
  // Green
  if (['lunas', 'disetujui', 'selesai', 'aktif'].includes(s)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  }
  
  // Blue
  if (['proses', 'diproses', 'dilihat', 'terkirim'].includes(s)) {
    return 'bg-blue-50 text-blue-700 border-blue-200/80';
  }
  
  // Yellow / Orange
  if (['dp diterima', 'draft', 'menunggu', 'revisi', 'deal', 'perlu follow-up'].includes(s)) {
    return 'bg-amber-50 text-amber-800 border-amber-200/80';
  }
  
  // Red
  if (['jatuh tempo', 'ditolak', 'belum bayar', 'batal', 'tidak aktif'].includes(s)) {
    return 'bg-rose-50 text-rose-700 border-rose-200/80';
  }
  
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

/**
 * Normalizes phone numbers to standard WhatsApp format (e.g. 628123456789)
 */
export const cleanPhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  // Default Indonesian country code prefix if starting with 8
  if (digits.startsWith('8')) {
    return '62' + digits;
  }
  return digits;
};

/**
 * Generates formatted WhatsApp message for invoice
 */
export const createWhatsAppInvoiceMessage = (params: {
  clientName: string;
  projectTitle: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  invoiceUrl: string;
  agencyName: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
}): string => {
  const {
    clientName,
    projectTitle,
    invoiceNumber,
    totalAmount,
    dueDate,
    invoiceUrl,
    agencyName,
    bankName,
    bankAccount,
    bankHolder,
  } = params;

  let bankLine = '';
  if (bankName && bankAccount) {
    bankLine = `\n💳 Rekening Pembayaran:\nBank: ${bankName}\nNo. Rek: ${bankAccount}\nA/N: ${bankHolder || agencyName}\n`;
  }

  return `Halo ${clientName},

Terima kasih atas persetujuan Anda pada proposal kami.

Berikut kami kirimkan Invoice resmi untuk proyek:
📌 *Proyek:* ${projectTitle}
📄 *No. Invoice:* ${invoiceNumber}
💰 *Total Tagihan:* ${formatRupiah(totalAmount)}
📅 *Jatuh Tempo:* ${formatDate(dueDate)}
${bankLine}
🔗 *Link Lembar Invoice & Rincian Pembayaran:*
${invoiceUrl}

Mohon konfirmasi jika pembayaran telah dilakukan. Terima kasih atas kerja sama dan kepercayaan Anda!

Salam hormat,
*${agencyName}*`;
};

/**
 * Creates wa.me URL with pre-filled message
 */
export const createWhatsAppUrl = (phone: string, text: string): string => {
  const cleanNum = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (cleanNum && cleanNum.length >= 8) {
    return `https://wa.me/${cleanNum}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
};

/**
 * Checks if a given role has Admin privileges
 */
export const isAdminRole = (role?: string): boolean => {
  return role === 'Owner/Admin' || role === 'Admin';
};

