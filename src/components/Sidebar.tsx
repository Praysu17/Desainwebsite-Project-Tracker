import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Wallet,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import { UserProfileModal } from './UserProfileModal';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  setMobileOpen = (_open: boolean) => {},
}) => {
  const { activeTab, setActiveTab, settings, proposals, invoices, currentUser } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Pending proposals or viewed proposals
  const pendingProposalsCount = proposals.filter(
    (p) => p.status === 'Dilihat' || p.status === 'Terkirim'
  ).length;

  // Unpaid or overdue invoices count
  const unpaidInvoicesCount = invoices.filter(
    (i) => i.status === 'Belum Bayar' || i.status === 'Jatuh Tempo'
  ).length;

  const menuItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    restrictedForStaff?: boolean;
  }> = [
    {
      id: 'dashboard',
      label: settings.sidebarLabels.dashboard || 'Ringkasan',
      icon: LayoutDashboard,
    },
    {
      id: 'clients',
      label: settings.sidebarLabels.clients || 'Klien',
      icon: Users,
    },
    {
      id: 'projects',
      label: settings.sidebarLabels.projects || 'Proyek',
      icon: FolderKanban,
    },
    {
      id: 'finance',
      label: settings.sidebarLabels.finance || 'Keuangan',
      icon: Wallet,
      restrictedForStaff: true,
    },
    {
      id: 'proposals',
      label: settings.sidebarLabels.proposals || 'Proposal',
      icon: FileText,
      badge: pendingProposalsCount,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'invoices',
      label: settings.sidebarLabels.invoices || 'Invoice',
      icon: Receipt,
      badge: unpaidInvoicesCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'reports',
      label: settings.sidebarLabels.reports || 'Laporan',
      icon: BarChart3,
      restrictedForStaff: true,
    },
    {
      id: 'settings',
      label: settings.sidebarLabels.settings || 'Pengaturan',
      icon: Settings,
      restrictedForStaff: true,
    },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0A192F] text-slate-100 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-11 h-11 rounded-2xl bg-slate-900 p-1 flex items-center justify-center border border-cyan-500/30 shadow-md shadow-cyan-950/40 shrink-0">
              <img
                src={settings.logoUrl || '/sugeng-logo.svg'}
                alt="SP Digital Logo"
                className="w-9 h-9 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0A192F] rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold tracking-tight text-white truncate">
                  {settings.agencyName}
                </h1>
              </div>
              <p className="text-xs text-cyan-400 font-medium truncate flex items-center gap-1">
                <span>{settings.agencyTagline || 'Digital Partner Solution'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen?.(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 lg:hidden shrink-0"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>

          {menuItems.map((item) => {
            const isRestricted = currentUser.role === 'Staff' && item.restrictedForStaff;
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            if (isRestricted) {
              return null; // Hide restricted modules from Staff
            }

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      item.badgeColor || 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Client Proposal Link Box */}
          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Portal Klien Publik</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
              <p className="text-xs text-slate-300 font-medium leading-snug mb-2">
                Proposal online aktif untuk testing approval klien:
              </p>
              <a
                href="/share/proposal/uplove-booking-2026"
                target="_blank"
                rel="noreferrer"
                id="link-demo-client-proposal"
                className="inline-flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 rounded-lg transition-colors"
              >
                <span>Buka Proposal UPLOVE</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom: Workspace Identity & Role Info */}
        <div className="p-3 border-t border-slate-800/80 bg-[#071322]">
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            id="sidebar-workspace-profile-btn"
            title="Klik untuk ubah nama, email, dan password akun"
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/90 transition-all text-left group cursor-pointer border border-transparent hover:border-slate-700/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SP'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                  {currentUser.name || 'Sugeng Prayitno'}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="truncate">{currentUser.role}</span>
                </p>
              </div>
            </div>

            <div className="p-1 text-slate-400 group-hover:text-cyan-300 rounded-lg group-hover:bg-slate-700/60 transition-colors shrink-0">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </aside>

      {/* User Profile & Password Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
};
