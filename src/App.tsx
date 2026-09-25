import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ProjectsView } from './components/ProjectsView';
import { FinanceView } from './components/FinanceView';
import { ProposalsView } from './components/ProposalsView';
import { InvoicesView } from './components/InvoicesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PublicProposalPage } from './components/PublicProposalPage';
import { PublicInvoicePage } from './components/PublicInvoicePage';
import { LoginPage } from './components/LoginPage';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, publicShare, setPublicShare, isAuthenticated, currentUser } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isStaff = currentUser?.role === 'Staff';
  const isRestrictedForStaff = isStaff && (activeTab === 'settings' || activeTab === 'finance' || activeTab === 'reports');

  // Automatically redirect Staff away from restricted tabs immediately
  useEffect(() => {
    if (isRestrictedForStaff) {
      setActiveTab('dashboard');
    }
  }, [isRestrictedForStaff, setActiveTab]);

  // Listen to browser path for direct link opening (e.g. /share/proposal/token or /share/invoice/token)
  useEffect(() => {
    const checkPath = () => {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/share/proposal/')) {
        const token = pathname.replace('/share/proposal/', '').trim();
        if (token) {
          setPublicShare({ type: 'proposal', token });
          return;
        }
      } else if (pathname.startsWith('/share/invoice/')) {
        const token = pathname.replace('/share/invoice/', '').trim();
        if (token) {
          setPublicShare({ type: 'invoice', token });
          return;
        }
      }
      setPublicShare(null);
    };

    checkPath();
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, [setPublicShare]);

  // If viewing a public client share link
  if (publicShare && publicShare.type && publicShare.token) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Floating return to Admin Dashboard preview bar */}
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-md z-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-300">
              Mode Preview Publik Klien:{' '}
              <strong className="text-white uppercase font-mono">
                {publicShare.type === 'proposal' ? 'Proposal Online' : 'Invoice Resmi'}
              </strong>
            </span>
          </div>

          <button
            onClick={() => {
              setPublicShare(null);
              window.history.pushState({}, '', '/');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold rounded-lg border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isAuthenticated ? 'Kembali ke Dashboard Agensi' : 'Ke Halaman Login'}</span>
          </button>
        </div>

        <div className="flex-1">
          {publicShare.type === 'proposal' ? (
            <PublicProposalPage token={publicShare.token} />
          ) : (
            <PublicInvoicePage token={publicShare.token} />
          )}
        </div>
      </div>
    );
  }

  // Tampilan awal: Halaman login jika belum authenticated, atau dashboard jika sudah login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
      {/* Dark Sidebar */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Topbar */}
        <Topbar onToggleMobile={() => setMobileSidebarOpen((prev) => !prev)} />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'clients' && <ClientsView />}
          {activeTab === 'projects' && <ProjectsView />}
          {activeTab === 'finance' && (!isStaff ? <FinanceView /> : <DashboardView />)}
          {activeTab === 'proposals' && <ProposalsView />}
          {activeTab === 'invoices' && <InvoicesView />}
          {activeTab === 'reports' && (!isStaff ? <ReportsView /> : <DashboardView />)}
          {activeTab === 'settings' && (!isStaff ? <SettingsView /> : <DashboardView />)}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
