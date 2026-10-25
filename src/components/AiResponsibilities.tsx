import React, { useState } from 'react';
import type { EvaluationResult, AiAuditReport } from '../types';

interface AiResponsibilitiesProps {
  currentLoan: EvaluationResult | null;
  history: EvaluationResult[];
  onSelectLoan: (loan: EvaluationResult) => void;
}

export const AiResponsibilities: React.FC<AiResponsibilitiesProps> = ({
  currentLoan,
  history,
  onSelectLoan,
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(currentLoan?.id || history[0]?.id || '');
  const [auditReport, setAuditReport] = useState<AiAuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const activeLoan =
    history.find((l) => l.id === selectedLoanId) || currentLoan || history[0];

  const runAudit = async () => {
    if (!activeLoan) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId: activeLoan.id, loanData: activeLoan }),
      });
      if (!res.ok) throw new Error('Audit API failed');
      const data: AiAuditReport = await res.json();
      setAuditReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeLoan && !auditReport) {
      runAudit();
    }
  }, [activeLoan?.id]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
              Governance Framework 12 CFR Part 1002
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight mt-0.5">
              AI Responsibilities &amp; Fair Lending Oversight
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated model auditing, Equal Credit Opportunity Act (ECOA) certification, and Explainable AI (XAI)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedLoanId}
              onChange={(e) => {
                setSelectedLoanId(e.target.value);
                const found = history.find((l) => l.id === e.target.value);
                if (found) onSelectLoan(found);
              }}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              {history.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.applicantName} (${l.requestedAmount.toLocaleString()} · {l.status})
                </option>
              ))}
            </select>

            <button
              onClick={runAudit}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Auditing...' : 'Re-Run Audit'}
            </button>
          </div>
        </div>

        {/* 3 Core Ethical Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs font-semibold text-emerald-400 mb-1">
              01. Non-Discriminatory Model
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Algorithmic features strictly exclude prohibited protected bases (race, sex, marital status, religion, age). Only empirical debt service ratios and verifiable earnings are mathematically weighted.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs font-semibold text-blue-400 mb-1">
              02. Explainable Adverse Action
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In strict adherence to the Fair Credit Reporting Act (FCRA), every unapproved application receives explicit mathematical attributions outlining the top three contributing factors.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs font-semibold text-amber-400 mb-1">
              03. Human-in-the-Loop Safeguards
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Borderline loan requests (620-660 score or 35-40% DTI) automatically trip secondary review queues preventing automated algorithmic rejections without human officer verification.
            </p>
          </div>
        </div>
      </div>

      {/* Live AI Audit Report Card */}
      {auditReport && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-5 animate-fade-in">
          {/* Audit Verification Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div>
              <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                Audited Decision: {auditReport.applicantName}
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                {auditReport.complianceStatus}
              </h3>
              <div className="text-xs text-slate-400 font-mono">
                {auditReport.regulatoryCitation} · {auditReport.auditId}
              </div>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold">
              Certified Regulation B Compliant
            </div>
          </div>

          {/* Model Confidence & Feature Drivers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Feature Drivers &amp; Explainability Attributions
              </span>
              <span className="font-mono text-slate-400">
                Model Confidence: <span className="text-emerald-400 font-bold">{auditReport.compositeConfidenceScore}%</span> ({auditReport.modelConfidenceTier} Tier)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {auditReport.featureDrivers.map((driver, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{driver.feature}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {driver.weightPercentage}% weight
                    </span>
                  </div>
                  <div className="font-mono text-white text-sm font-semibold">
                    {driver.metric}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-tight">
                    {driver.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Human in the loop exception routing */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                Human-in-the-Loop (HITL) Routing Protocol
              </span>
              <span
                className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                  auditReport.hitlRouting.required
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {auditReport.hitlRouting.required ? 'HUMAN OVERRIDE REQUIRED' : 'AUTOMATED CLEARING'}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {auditReport.hitlRouting.reason}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
              <span>Queue: {auditReport.hitlRouting.reviewStage}</span>
              <span>·</span>
              <span>Role: {auditReport.hitlRouting.assigneeRole}</span>
            </div>
          </div>

          {/* Adverse Action & Legal Attestation */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
            <div className="font-semibold text-slate-200">
              Adverse Action Evaluation &amp; Underwriting Explanation
            </div>
            <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {auditReport.adverseActionSummary}
            </p>
          </div>

          {/* Prescriptive Borrower Coaching Roadmap */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
            <div className="font-semibold text-emerald-400">
              Actionable Financial Coaching &amp; Borrower Guidance Roadmap
            </div>
            <p className="text-slate-400">
              Proactive remediation steps generated to empower applicant debt reduction and rate optimization:
            </p>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              {auditReport.financialCoachingRoadmap.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Compliance Seal Footer */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-emerald-400">Statutory Attestation: </span>
            {auditReport.nonDiscriminationAttestation}
          </div>
        </div>
      )}
    </div>
  );
};
