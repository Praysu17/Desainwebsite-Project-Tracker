import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Laptop,
  PowerOff,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DeviceSession } from '../types';

export const LoginPage: React.FC = () => {
  const {
    login,
    settings,
    isCloudSynced,
    deviceNotice,
    clearDeviceNotice,
    disconnectDeviceAndLogin,
  } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [kickingDeviceId, setKickingDeviceId] = useState<string | null>(null);

  // Device limit modal state
  const [deviceLimitData, setDeviceLimitData] = useState<{
    userId: string;
    userName: string;
    activeDevices: DeviceSession[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.deviceLimitReached) {
        setDeviceLimitData({
          userId: res.targetUserId || '',
          userName: res.targetUserName || identifier,
          activeDevices: res.activeDevices || [],
        });
        setLoading(false);
        return;
      }

      if (!res.success) {
        setErrorMsg(res.message || 'Login gagal. Silakan periksa kredensial Anda.');
        setLoading(false);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat memverifikasi login.');
      setLoading(false);
    }
  };

  const handleDisconnectAndLogin = async (deviceIdToKick: string) => {
    if (!deviceLimitData) return;
    setKickingDeviceId(deviceIdToKick);
    setErrorMsg(null);

    try {
      const res = await disconnectDeviceAndLogin(deviceLimitData.userId, deviceIdToKick);
      if (!res.success) {
        setErrorMsg(res.message || 'Gagal memutuskan sesi perangkat.');
        setKickingDeviceId(null);
      } else {
        setDeviceLimitData(null);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan sistem saat menyambungkan sesi baru.');
      setKickingDeviceId(null);
    }
  };

  const formatLastActive = (isoString?: string) => {
    if (!isoString) return 'Baru saja';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#071322] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {/* Logo and Brand Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/20 mb-4 border border-cyan-300/30">
            SP
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {settings.agencyName || 'SP Digital'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-cyan-400 font-medium">
            {settings.agencyTagline || 'Digital Partner Solution'}
          </p>

          {/* Cloud Database Connected Indicator */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudSynced ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
              }`}
            />
            <span>Firebase Cloud Database Aktif</span>
          </div>
        </div>

        {/* Remote Kick / Notice Alert */}
        {deviceNotice && (
          <div className="mt-5 p-4 bg-amber-950/70 border border-amber-600/80 rounded-2xl flex items-start gap-3 text-xs text-amber-200 animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold text-amber-300 text-sm mb-0.5">
                Pemberitahuan Sesi Perangkat
              </strong>
              <p className="leading-relaxed">{deviceNotice}</p>
            </div>
            <button
              onClick={clearDeviceNotice}
              className="text-amber-400 hover:text-amber-200 p-1 cursor-pointer"
              title="Tutup pesan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Login Box */}
        <div className="mt-6 bg-slate-900/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-cyan-400" />
              <span>Masuk ke Dashboard</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Silakan masukkan email atau nama pengguna beserta password Anda.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-start gap-3 text-xs text-rose-200 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username or Email */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Email atau Nama Pengguna
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  id="input-login-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="sugeng@agency.com atau nama tim"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-hidden transition-all text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  id="input-login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ketik password..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-hidden transition-all text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 1 User Maksimal 2 Perangkat Info Badge */}
            <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/20 rounded-xl flex items-center justify-between text-[11px] text-cyan-300 select-none cursor-default pointer-events-none">
              <span className="flex items-center gap-2 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>1 User Maksimal 2 Perangkat</span>
              </span>
              <span className="font-semibold text-cyan-400 bg-cyan-900/40 px-2 py-0.5 rounded-md border border-cyan-700/40 text-[10px]">
                Kebijakan Sesi
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-login"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer text-xs"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Sesi...</span>
                  </span>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {settings.agencyName || 'SP Digital'}. Cloud Firestore
          Multi-Device Protected.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2-DEVICE LIMIT REACHED POPUP MODAL                                        */}
      {/* ========================================================================= */}
      {deviceLimitData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl text-slate-100 relative">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  1 User Maksimal 2 Perangkat Tercapai
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Akun <strong className="text-cyan-300 font-semibold">{deviceLimitData.userName}</strong> saat
                  ini sudah login di <strong className="text-amber-400">2 perangkat aktif</strong> (1 User Maksimal 2 Perangkat).
                  Pilih salah satu sesi di bawah untuk diputus agar Anda dapat masuk di perangkat ini:
                </p>
              </div>
            </div>

            {/* List of the 2 currently active devices */}
            <div className="space-y-3 my-5">
              {deviceLimitData.activeDevices.map((device, idx) => {
                const isMobile =
                  device.os?.toLowerCase().includes('android') ||
                  device.os?.toLowerCase().includes('ios');
                const isKickingThis = kickingDeviceId === device.deviceId;

                return (
                  <div
                    key={device.deviceId || idx}
                    className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                        {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {device.deviceName || 'Perangkat Browser'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                            Slot {idx + 1}/2
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Aktif: {formatLastActive(device.lastActive || device.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={kickingDeviceId !== null}
                      onClick={() => handleDisconnectAndLogin(device.deviceId)}
                      className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {isKickingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Memutus...</span>
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-3.5 h-3.5" />
                          <span>Putuskan & Masuk</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={kickingDeviceId !== null}
                onClick={() => handleDisconnectAndLogin('oldest')}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {kickingDeviceId === 'oldest' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Putuskan Sesi Terlama & Masuk Langsung</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={kickingDeviceId !== null}
                onClick={() => setDeviceLimitData(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
