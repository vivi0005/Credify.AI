import React from 'react';
import type { User } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const navTabs = [
    { id: 'evaluator', label: 'Underwrite & Evaluate' },
    { id: 'decision-plane', label: '2D Decision Plane' },
    { id: 'audit-ledger', label: 'Audit History' },
    { id: 'ai-governance', label: 'AI Responsibilities' },
    { id: 'architecture', label: 'Flask Architecture' },
    { id: 'viva-guide', label: 'Viva Voce Defense' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('evaluator')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-lg">
              C
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">Credify AI</span>
              <span className="text-[11px] text-slate-400 font-normal tracking-wide block">
                Loan Underwriting &amp; Governance
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean single-line text tabs) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 rounded-md transition-all ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 overflow-hidden">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-slate-200 leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono tracking-tight leading-tight">
                  {currentUser.role}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Switch User / Sign Out"
                className="ml-1 text-[11px] text-slate-400 hover:text-rose-400 px-1.5 py-0.5 rounded hover:bg-slate-800/80 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-emerald-500/20"
            >
              Sign In
            </button>
          )}

          {/* Mobile Tab Select Dropdown */}
          <div className="lg:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              {navTabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
