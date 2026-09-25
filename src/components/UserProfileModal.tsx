import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  LogOut,
  Save,
  Camera,
  Upload,
  Trash2,
  Loader2,
  Smartphone,
  Laptop,
  PowerOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compressImage } from '../utils/imageUtils';
import { cleanActiveDevices, getCurrentDeviceSession } from '../utils/deviceHelper';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, setActiveTab, logout, currentDeviceId, disconnectUserDevice } = useApp();

  // Active devices with guaranteed presence of current authenticated device session
  const activeDevicesList = React.useMemo(() => {
    const list = cleanActiveDevices(currentUser.activeDevices);
    const hasCurrent = list.some((d) => d.deviceId === currentDeviceId);
    if (!hasCurrent && list.length < 2) {
      return [...list, getCurrentDeviceSession()];
    }
    return list;
  }, [currentUser.activeDevices, currentDeviceId]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(currentUser.name || 'Sugeng Prayitno');
  const [email, setEmail] = useState(currentUser.email || 'sugeng@agency.com');
  const [password, setPassword] = useState(currentUser.password || 'Password01');
  const [confirmPassword, setConfirmPassword] = useState(currentUser.password || 'Password01');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize state when modal opens or currentUser updates in real-time
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPassword(currentUser.password || '');
      setConfirmPassword(currentUser.password || '');
      setAvatar(currentUser.avatar || '');
      setShowUrlInput(false);
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsSaving(false);
      setIsCompressing(false);
    }
  }, [isOpen, currentUser]);

  // Close modal when pressing Escape key
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('File yang dipilih harus berupa format gambar (JPG, PNG, WebP).');
      return;
    }

    // Limit original upload size to 10MB to prevent browser crash
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal 10MB.');
      return;
    }

    try {
      setIsCompressing(true);
      setErrorMsg(null);
      // Automatically scale and compress to max 256x256 (~15-30 KB)
      const compressed = await compressImage(file, 256, 0.85);
      setAvatar(compressed);
    } catch (err) {
      console.error('Error processing image:', err);
      setErrorMsg('Gagal memproses gambar. Silakan gunakan file gambar lain.');
    } finally {
      setIsCompressing(false);
      // Reset input value so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isCompressing) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Nama pengguna tidak boleh kosong.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Email tidak boleh kosong.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Password tidak boleh kosong.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    try {
      setIsSaving(true);

      // If avatar is a raw data URL larger than 100KB, ensure it is compressed
      let finalAvatar = avatar.trim();
      if (finalAvatar.startsWith('data:image/') && finalAvatar.length > 100000) {
        try {
          finalAvatar = await compressImage(finalAvatar, 256, 0.82);
        } catch {
          // keep original
        }
      }

      await updateUser(currentUser.id, {
        name: name.trim(),
        email: email.trim(),
        role: currentUser.role || 'Owner/Admin',
        password: password.trim(),
        avatar: finalAvatar,
      });

      setSuccessMsg('Profil dan password berhasil disimpan ke database real-time!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1300);
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMsg('Gagal menyimpan perubahan ke database. Silakan coba kembali.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToTeamManagement = () => {
    setActiveTab('settings');
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative my-auto bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                {name.slice(0, 2).toUpperCase() || 'SP'}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">Profil & Keamanan Akun</h3>
              <p className="text-xs text-slate-500 truncate">
                Ubah foto profil, nama, email, atau password akun Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0 ml-2"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Form */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Photo Profile Section */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                {isCompressing ? (
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 flex flex-col items-center justify-center text-slate-500 gap-1">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                    <span className="text-[9px] font-semibold">Proses...</span>
                  </div>
                ) : avatar ? (
                  <img
                    src={avatar}
                    alt="Pratinjau Foto Profil"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {name ? name.slice(0, 2).toUpperCase() : 'SP'}
                  </div>
                )}
                <button
                  type="button"
                  id="btn-upload-photo-icon"
                  disabled={isCompressing || isSaving}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md border border-white cursor-pointer transition-transform hover:scale-105 disabled:opacity-50"
                  title="Ganti Foto"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Foto Profil</span>
                  {avatar && (
                    <button
                      type="button"
                      id="btn-remove-photo"
                      onClick={() => setAvatar('')}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Format gambar JPG, PNG, atau WebP (otomatis dioptimalkan untuk database real-time).
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <button
                    type="button"
                    id="btn-choose-photo-file"
                    disabled={isCompressing || isSaving}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {isCompressing ? (
                      <Loader2 className="w-3 h-3 animate-spin text-cyan-600" />
                    ) : (
                      <Upload className="w-3 h-3 text-cyan-600" />
                    )}
                    <span>{isCompressing ? 'Mengompres Foto...' : 'Pilih Foto dari Perangkat'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-2 py-1 text-slate-500 hover:text-cyan-700 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {showUrlInput ? 'Tutup URL' : 'Atau gunakan URL foto'}
                  </button>
                </div>
                {showUrlInput && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="Masukkan link gambar: https://..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-cyan-500 outline-hidden font-mono text-slate-700"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Role badge */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Level Akses Akun:</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                {currentUser.role}
              </span>
            </div>

            {/* Name Field */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Pengguna..."
                  className="w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sugeng@agency.com"
                  className="w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden text-slate-800"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Password Baru</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium cursor-pointer"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Tampilkan</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ketik password baru..."
                  className="w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Konfirmasi Password Baru</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru..."
                  className="w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl focus:border-cyan-500 outline-hidden font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Active Devices Section (1 User Maksimal 2 Perangkat) */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5 select-none cursor-default">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span className="font-bold text-xs text-slate-800">Perangkat Aktif Anda</span>
                </div>
                <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                  {activeDevicesList.length}/2 Terhubung
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5 select-none cursor-default">
                Kebijakan keamanan akun: <strong className="text-slate-700 font-semibold">1 User Maksimal 2 Perangkat</strong> aktif secara bersamaan.
              </p>

              <div className="space-y-2 select-none cursor-default">
                {activeDevicesList.map((device, idx) => {
                  const isCurrent = device.deviceId === currentDeviceId;
                  const isMobile =
                    device.os?.toLowerCase().includes('android') ||
                    device.os?.toLowerCase().includes('ios');

                  return (
                    <div
                      key={device.deviceId || idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors select-none cursor-default ${
                        isCurrent
                          ? 'bg-cyan-50/50 border-cyan-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 select-none cursor-default">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-cyan-100 text-cyan-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isMobile ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 select-none cursor-default">
                          <div className="flex items-center gap-1.5 select-none cursor-default">
                            <span className="font-semibold text-slate-800 truncate select-none cursor-default">
                              {device.deviceName}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-600 text-white uppercase tracking-wider select-none">
                                Perangkat Ini
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 select-none cursor-default">
                            Aktif:{' '}
                            {device.lastActive
                              ? new Date(device.lastActive).toLocaleDateString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: 'numeric',
                                  month: 'short',
                                })
                              : 'Sekarang'}
                          </div>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => disconnectUserDevice(currentUser.id, device.deviceId)}
                          className="px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PowerOff className="w-3 h-3" />
                          <span>Putuskan</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Slot info if only 1 device is connected */}
                {activeDevicesList.length < 2 && (
                  <div className="p-2 border border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-400 bg-white">
                    + 1 slot perangkat cadangan tersedia
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="shrink-0 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoToTeamManagement}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Kelola Tim & PIC</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-cancel-profile-modal"
                disabled={isSaving}
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="submit"
                id="btn-save-profile-settings"
                disabled={isSaving || isCompressing}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Menyimpan ke Cloud...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
