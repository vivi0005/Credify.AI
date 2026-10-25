import React, { useState } from 'react';
import type { EvaluationResult, SystemStats } from '../types';

interface AuditHistoryProps {
  history: EvaluationResult[];
  stats: SystemStats | null;
  onSelectRecord: (record: EvaluationResult) => void;
  onAuditRecord: (record: EvaluationResult) => void;
  onDeleteRecord: (id: string) => void;
}

export const AuditHistory: React.FC<AuditHistoryProps> = ({
  history,
  stats,
  onSelectRecord,
  onAuditRecord,
  onDeleteRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Rejected' | 'Borderline Review'>('All');
  const [activeModalRecord, setActiveModalRecord] = useState<EvaluationResult | null>(null);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' ? true : item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    if (history.length === 0) return;

    const headers = [
      'Evaluation ID',
      'Timestamp',
      'Applicant Name',
      'Email',
      'Employment Status',
      'Loan Purpose',
      'Annual Income',
      'Requested Capital',
      'Loan Term (Months)',
      'Credit Score',
      'Risk Tier',
      'Existing Monthly Debt',
      'Monthly Payment',
      'Interest Rate APR',
      'DTI Percentage',
      'Max Allowed DTI',
      'Status',
      'Composite Confidence Score',
    ];

    const rows = history.map((r) => [
      `"${r.id}"`,
      `"${r.timestamp}"`,
      `"${r.applicantName.replace(/"/g, '""')}"`,
      `"${r.email}"`,
      `"${r.employmentStatus}"`,
      `"${r.loanPurpose}"`,
      r.annualIncome,
      r.requestedAmount,
      r.loanTermMonths,
      r.creditScore,
      `"${r.riskTier}"`,
      r.existingMonthlyDebt,
      r.monthlyPayment,
      r.interestRate,
      r.dti,
      r.maxAllowedDti,
      `"${r.status}"`,
      r.compositeConfidenceScore,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `credify_ai_audit_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Strip */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-medium">Total Evaluations</div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
              {stats.totalEvaluations}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Audited in-ledger
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-medium">Portfolio Approval Rate</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
              {stats.approvalRate}%
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {stats.approvedCount} Approved · {stats.rejectedCount} Rejected
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-medium">Mean Portfolio DTI</div>
            <div className="text-2xl font-bold font-mono text-slate-200 tabular-nums mt-1">
              {stats.averageDti}%
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Prudent target &lt; 36%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-medium">Total Requested Capital</div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
              ${stats.totalRequestedCapital.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Avg Score: {stats.averageCreditScore} FICO
            </div>
          </div>
        </div>
      )}

      {/* Main Ledger Table Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Underwriting Decision Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable audit log tracking algorithmic inputs, DTI ratios, and adverse action reasons
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Export CSV</span>
              <span className="font-mono text-[10px] text-slate-400">RFC4180</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search applicant name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
            {(['All', 'Approved', 'Rejected', 'Borderline Review'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  statusFilter === filter
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono">
                <th className="py-2.5 px-3 font-medium">Timestamp</th>
                <th className="py-2.5 px-3 font-medium">Applicant</th>
                <th className="py-2.5 px-3 font-medium text-right">Income</th>
                <th className="py-2.5 px-3 font-medium text-right">Requested</th>
                <th className="py-2.5 px-3 font-medium text-center">FICO</th>
                <th className="py-2.5 px-3 font-medium text-right">DTI %</th>
                <th className="py-2.5 px-3 font-medium text-center">Status</th>
                <th className="py-2.5 px-3 font-medium text-right">Confidence</th>
                <th className="py-2.5 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-sans">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No evaluation records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => {
                  const isApp = rec.status === 'Approved';
                  const isBorder = rec.status === 'Borderline Review';
                  const statusBadgeColor = isApp
                    ? 'text-emerald-400'
                    : isBorder
                    ? 'text-amber-400'
                    : 'text-rose-400';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setActiveModalRecord(rec)}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(rec.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(rec.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-200 whitespace-nowrap">
                        <div>{rec.applicantName}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                          {rec.email}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-300">
                        ${rec.annualIncome.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-200 font-semibold">
                        ${rec.requestedAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-center">
                        <span
                          className={`font-semibold ${
                            rec.creditScore >= 700
                              ? 'text-emerald-400'
                              : rec.creditScore >= 620
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {rec.creditScore}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                        <span className={rec.dti <= rec.maxAllowedDti ? 'text-slate-300' : 'text-rose-400 font-semibold'}>
                          {rec.dti}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`font-semibold font-mono text-xs ${statusBadgeColor}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-emerald-400 font-semibold">
                        {rec.compositeConfidenceScore}%
                      </td>
                      <td
                        className="py-2.5 px-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onAuditRecord(rec)}
                            title="Run Gemini AI Regulatory Audit"
                            className="px-2 py-1 text-[11px] font-medium rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                          >
                            AI Audit
                          </button>
                          <button
                            onClick={() => onSelectRecord(rec)}
                            title="Load into Evaluator"
                            className="px-2 py-1 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => onDeleteRecord(rec.id)}
                            title="Delete Record"
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspection Modal */}
      {activeModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Audit Inspection: {activeModalRecord.applicantName}
                </h3>
                <div className="text-xs text-slate-400 font-mono">
                  Record ID: {activeModalRecord.id}
                </div>
              </div>
              <button
                onClick={() => setActiveModalRecord(null)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block">Annual Gross Earnings</span>
                <span className="font-mono text-white text-sm font-semibold">
                  ${activeModalRecord.annualIncome.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block">Requested Capital</span>
                <span className="font-mono text-white text-sm font-semibold">
                  ${activeModalRecord.requestedAmount.toLocaleString()} ({activeModalRecord.loanTermMonths} mos)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block">Calculated DTI</span>
                <span className="font-mono text-white text-sm font-semibold">
                  {activeModalRecord.dti}% (Cap: {activeModalRecord.maxAllowedDti}%)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block">Bureau Credit Score</span>
                <span className="font-mono text-emerald-400 text-sm font-semibold">
                  {activeModalRecord.creditScore} ({activeModalRecord.riskTier})
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">Decision Status &amp; Confidence</span>
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono font-bold text-sm ${
                    activeModalRecord.status === 'Approved'
                      ? 'text-emerald-400'
                      : activeModalRecord.status === 'Borderline Review'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {activeModalRecord.status}
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {activeModalRecord.compositeConfidenceScore}% Composite Confidence
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  onSelectRecord(activeModalRecord);
                  setActiveModalRecord(null);
                }}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Load into Form
              </button>
              <button
                onClick={() => {
                  onAuditRecord(activeModalRecord);
                  setActiveModalRecord(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors"
              >
                Launch AI Regulatory Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
