import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2,
  AlertTriangle,
  X,
  ShieldAlert,
  Lock,
  UserCheck,
} from 'lucide-react';
import { UserAccount } from '../types';
import { isAdminRole } from '../utils/formatters';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemType: 'Proposal' | 'Invoice';
  itemName: string;
  itemCode?: string;
  clientName?: string;
  amount?: string | number;
  currentUser: UserAccount;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemType,
  itemName,
  itemCode,
  clientName,
  amount,
  currentUser,
}) => {
  const isAdmin = isAdminRole(currentUser?.role);

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

  if (!isOpen) return null;

  return createPortal(
    <div
      id="delete-confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="delete-confirm-modal"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isAdmin ? title : 'Akses Dibatasi (Khusus Admin)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? `Penghapusan permanen dokumen ${itemType.toLowerCase()}`
                  : `Hanya Admin/Owner yang berhak menghapus data`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-3 space-y-4">
          {isAdmin ? (
            <>
              {/* Item Details Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                {itemCode && (
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Nomor {itemType}:</span>
                    <span className="font-mono font-bold text-slate-800">{itemCode}</span>
                  </div>
                )}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Judul / Proyek:</span>
                  <span className="font-semibold text-slate-800 text-right">{itemName}</span>
                </div>
                {clientName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Klien:</span>
                    <span className="font-medium text-slate-700">{clientName}</span>
                  </div>
                )}
                {amount !== undefined && (
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Nilai Total:</span>
                    <span className="font-bold text-cyan-700">{amount}</span>
                  </div>
                )}
              </div>

              {/* Warning notice */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Peringatan:</span> Tindakan ini bersifat permanen.
                  Dokumen dan tautan publik yang terkait dengan {itemType.toLowerCase()} ini tidak
                  dapat diakses kembali setelah dihapus.
                </div>
              </div>
            </>
          ) : (
            /* Non-admin warning */
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2 text-amber-900">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <Lock className="w-4 h-4" />
                  <span>Izin Penghapusan Ditolak</span>
                </div>
                <p className="leading-relaxed text-amber-800">
                  Hanya pengguna dengan peran <strong className="font-semibold">Admin</strong> atau{' '}
                  <strong className="font-semibold">Owner/Admin</strong> yang memiliki izin untuk
                  menghapus {itemType.toLowerCase()}.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="font-semibold text-slate-800">{currentUser?.name || 'User'}</div>
                    <div className="text-[11px] text-slate-500">{currentUser?.email}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  Peran: {currentUser?.role || 'Staff'}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed italic">
                Hubungi Owner atau ganti ke akun Admin melalui menu profil di pojok kanan atas untuk
                menghapus dokumen ini.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            {isAdmin ? 'Batal' : 'Tutup'}
          </button>

          {isAdmin && (
            <button
              id="btn-confirm-delete"
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Ya, Hapus Sekarang</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
