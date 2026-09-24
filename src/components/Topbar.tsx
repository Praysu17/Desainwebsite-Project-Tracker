import React, { useState } from 'react';
import {
  Search,
  Bell,
  LogOut,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  UserCheck,
  ChevronDown,
  KeyRound,
  Users,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfileModal } from './UserProfileModal';

interface TopbarProps {
  onToggleMobile?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobile = () => {} }) => {
  const {
    globalSearch,
    setGlobalSearch,
    currentUser,
    setCurrentUser,
    settings,
    logout,
    notifications,
    clearNotification,
    setActiveTab,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left: Mobile Menu Toggle & Search Bar */}
      <div className="flex items-center gap-3 md:gap-6 flex-1 max-w-xl">
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={onToggleMobile}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="topbar-global-search-input"
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Cari proyek, klien, invoice, atau proposal..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-cyan-500 rounded-xl outline-hidden transition-all text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500/20"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Notifications, User Profile & Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            id="btn-notifications-dropdown"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Modal */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm">Notifikasi & Alert</h3>
                    <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-medium">
                      {notifications.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Tidak ada notifikasi baru
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="pt-2 flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          {n.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                          {n.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                          {n.whatsappUrl && (
                            <a
                              href={n.whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                              title="Kirim Invoice ke WhatsApp Klien"
                            >
                              <MessageSquare className="w-3 h-3 fill-current text-emerald-600" />
                              <span>Kirim Invoice via WA</span>
                            </a>
                          )}
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.date}</span>
                        </div>
                        <button
                          onClick={() => clearNotification(n.id)}
                          className="text-slate-300 hover:text-slate-500 p-1"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            id="btn-user-profile-menu"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 pr-1.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover border border-cyan-500/40"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser.name}
              </p>
              <span className="inline-block px-1.5 py-0.2 text-[10px] font-medium bg-cyan-50 text-cyan-800 rounded border border-cyan-200">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-800">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                </div>

                <div className="space-y-1 mb-2 pb-2 border-b border-slate-100">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-700 rounded-xl transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Ubah Profil & Password</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setActiveTab('settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-700 rounded-xl transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Manajemen Pengguna</span>
                  </button>
                </div>

                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Beralih Akun:
                </div>

                {settings.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl transition-colors ${
                      currentUser.id === u.id
                        ? 'bg-cyan-50 text-cyan-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span className="truncate">{u.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{u.role}</span>
                  </button>
                ))}

                <div className="pt-2 mt-2 border-t border-slate-100">
                  <button
                    id="btn-logout"
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Profile & Password Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </header>
  );
};
