import React, { useState, useEffect } from 'react';
import type { EvaluationResult, SystemStats, User } from './types';
import { Navbar } from './components/Navbar';
import { EvaluationForm } from './components/EvaluationForm';
import { ResultDisplay } from './components/ResultDisplay';
import { DecisionBoundaryChart } from './components/DecisionBoundaryChart';
import { AuditHistory } from './components/AuditHistory';
import { AiResponsibilities } from './components/AiResponsibilities';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { VivaGuide } from './components/VivaGuide';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('evaluator');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<EvaluationResult[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Live coordinates from evaluation form for 2D plane preview
  const [liveCoords, setLiveCoords] = useState<{ creditScore: number; dti: number }>({
    creditScore: 720,
    dti: 28,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Data Fetching
  const fetchHistoryAndStats = async () => {
    try {
      const [histRes, statsRes, meRes] = await Promise.all([
        fetch('/api/history'),
        fetch('/api/stats'),
        fetch('/api/auth/me'),
      ]);

      if (histRes.ok) {
        const histData: EvaluationResult[] = await histRes.json();
        setHistory(histData);
        if (!currentResult && histData.length > 0) {
          setCurrentResult(histData[0]);
          setLiveCoords({
            creditScore: histData[0].creditScore,
            dti: histData[0].dti,
          });
        }
      }

      if (statsRes.ok) {
        const statsData: SystemStats = await statsRes.json();
        setStats(statsData);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user) {
          setCurrentUser(meData.user);
        }
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  useEffect(() => {
    fetchHistoryAndStats();
  }, []);

  const handleEvaluated = (result: EvaluationResult) => {
    setCurrentResult(result);
    setLiveCoords({
      creditScore: result.creditScore,
      dti: result.dti,
    });
    setHistory((prev) => [result, ...prev]);
    fetchHistoryAndStats();
    showToast(`Application for ${result.applicantName} processed: ${result.status.toUpperCase()}`);
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((r) => r.id !== id));
        fetchHistoryAndStats();
        showToast('Evaluation record removed from audit ledger.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-medium shadow-2xl shadow-emerald-950/40 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Signed out of Credify AI.');
        }}
      />

      {/* Hero Sub-header / Status Line */}
      <section className="border-b border-slate-800/60 bg-gradient-to-b from-slate-900/50 to-transparent py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Deterministic Matrix v2.4</span>
            <span aria-hidden="true">·</span>
            <span>ECOA &amp; Regulation B Compliant</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">Fair Lending Verified</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>
              Portfolio Approval:{' '}
              <strong className="text-emerald-400 font-semibold">{stats?.approvalRate ?? 0}%</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Mean DTI: <strong className="text-slate-200 font-semibold">{stats?.averageDti ?? 0}%</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Evaluations: <strong className="text-white font-semibold">{stats?.totalEvaluations ?? 0}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Main Workspace Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Underwrite & Evaluate */}
        {activeTab === 'evaluator' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form Column */}
              <div className="lg:col-span-6">
                <EvaluationForm
                  onEvaluated={handleEvaluated}
                  isLoading={isLoading}
                  onLiveValuesChange={(vals) =>
                    setLiveCoords({ creditScore: vals.creditScore, dti: vals.dti })
                  }
                />
              </div>

              {/* Result Column */}
              <div className="lg:col-span-6 space-y-6">
                <ResultDisplay
                  result={currentResult}
                  onViewAiAudit={() => setActiveTab('ai-governance')}
                  onInspectPlane={() => setActiveTab('decision-plane')}
                />
              </div>
            </div>

            {/* Inlined Decision Boundary Plane preview */}
            <div className="pt-2">
              <DecisionBoundaryChart
                currentResult={currentResult}
                history={history}
                liveCoordinates={liveCoords}
                onSelectRecord={(rec) => {
                  setCurrentResult(rec);
                  setLiveCoords({ creditScore: rec.creditScore, dti: rec.dti });
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: 2D Decision Plane */}
        {activeTab === 'decision-plane' && (
          <div className="space-y-6">
            <DecisionBoundaryChart
              currentResult={currentResult}
              history={history}
              liveCoordinates={liveCoords}
              onSelectRecord={(rec) => {
                setCurrentResult(rec);
                showToast(`Loaded ${rec.applicantName} into active evaluation inspect.`);
              }}
            />

            {/* Supporting Explanation Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <h3 className="font-semibold text-white">Prime Approval Coordinate Space</h3>
                <p className="text-slate-400 leading-relaxed">
                  Applicants with Bureau scores $\ge 700$ possess prime repayment history, allowing debt-to-income tolerance to stretch up to 45% post-obligation.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <h3 className="font-semibold text-white">Near-Prime Exception Domain</h3>
                <p className="text-slate-400 leading-relaxed">
                  Scores between 620 and 699 are restricted to a 36% DTI cap to prevent default clustering, with a 36%-40% buffer zone reserved for senior Human-in-the-Loop review.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <h3 className="font-semibold text-white">Live Applicant Beacon</h3>
                <p className="text-slate-400 leading-relaxed">
                  The green pulsating marker updates in real time ($X: {liveCoords.creditScore}$, $Y: {liveCoords.dti}\%$) as inputs change in the evaluation form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Audit History */}
        {activeTab === 'audit-ledger' && (
          <AuditHistory
            history={history}
            stats={stats}
            onSelectRecord={(rec) => {
              setCurrentResult(rec);
              setLiveCoords({ creditScore: rec.creditScore, dti: rec.dti });
              setActiveTab('evaluator');
              showToast(`Loaded ${rec.applicantName} into evaluator.`);
            }}
            onAuditRecord={(rec) => {
              setCurrentResult(rec);
              setActiveTab('ai-governance');
            }}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {/* Tab 4: AI Responsibilities & Governance */}
        {activeTab === 'ai-governance' && (
          <AiResponsibilities
            currentLoan={currentResult}
            history={history}
            onSelectLoan={(loan) => {
              setCurrentResult(loan);
              setLiveCoords({ creditScore: loan.creditScore, dti: loan.dti });
            }}
          />
        )}

        {/* Tab 5: Flask Architecture */}
        {activeTab === 'architecture' && <ArchitectureViewer />}

        {/* Tab 6: Viva Voce Defense Hub */}
        {activeTab === 'viva-guide' && <VivaGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Credify AI</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic Underwriting &amp; Fair Lending Platform</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setActiveTab('evaluator')} className="hover:text-white transition-colors">
              Underwrite
            </button>
            <button onClick={() => setActiveTab('decision-plane')} className="hover:text-white transition-colors">
              2D Plane
            </button>
            <button onClick={() => setActiveTab('ai-governance')} className="hover:text-white transition-colors">
              AI Governance
            </button>
            <button onClick={() => setActiveTab('viva-guide')} className="hover:text-white transition-colors">
              Viva Defense
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Logged in as ${user.name} (${user.role})`);
        }}
      />
    </div>
  );
}
