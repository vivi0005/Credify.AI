import React from 'react';
import type { EvaluationResult } from '../types';

interface ResultDisplayProps {
  result: EvaluationResult | null;
  onViewAiAudit: () => void;
  onInspectPlane: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  onViewAiAudit,
  onInspectPlane,
}) => {
  if (!result) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 text-center flex flex-col items-center justify-center min-h-[460px]">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 text-lg font-mono">
          AI
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Awaiting Loan Application</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Adjust the financial vectors or select a preset profile to generate an instant
          deterministic underwriting evaluation and Fair Lending audit.
        </p>
      </div>
    );
  }

  const isApproved = result.status === 'Approved';
  const isBorderline = result.status === 'Borderline Review';

  const statusColor = isApproved
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
    : isBorderline
    ? 'text-amber-400 border-amber-500/30 bg-amber-950/20'
    : 'text-rose-400 border-rose-500/30 bg-rose-950/20';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-5 animate-fade-in">
      {/* Header & Status (Clean Unboxed Typography) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Decision Certificate #{result.id.slice(-6).toUpperCase()}
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            {result.applicantName}
          </h2>
          <div className="text-xs text-slate-400">
            {result.employmentStatus} · {result.loanPurpose} ·{' '}
            <span className="font-mono tabular-nums">${result.requestedAmount.toLocaleString()}</span> requested
          </div>
        </div>

        {/* Status Callout */}
        <div className={`px-4 py-2 rounded-xl border ${statusColor} text-right`}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Underwriting Status
          </div>
          <div className="text-lg font-extrabold tracking-tight">
            {result.status}
          </div>
        </div>
      </div>

      {/* Metrics Quadrant */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Monthly Payment</div>
          <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
            ${result.monthlyPayment.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {result.loanTermMonths} mos @ {result.interestRate}% APR
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Debt-to-Income (DTI)</div>
          <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
            {result.dti}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Cap: {result.maxAllowedDti}% tolerance
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Bureau Credit Score</div>
          <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
            {result.creditScore}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
            {result.riskTier}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Composite Confidence</div>
          <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
            {result.compositeConfidenceScore}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            60% FICO + 40% DTI
          </div>
        </div>
      </div>

      {/* Weighted Decision Formula Transparency */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Model Confidence Attribution</span>
          <span className="font-mono text-slate-400 tabular-nums">
            {result.creditScoreContribution}% (Credit) + {result.dtiContribution}% (DTI) = {result.compositeConfidenceScore}%
          </span>
        </div>

        {/* Stacked bar */}
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${result.creditScoreContribution}%` }}
            title={`Credit Score Component: ${result.creditScoreContribution}%`}
          />
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${result.dtiContribution}%` }}
            title={`DTI Component: ${result.dtiContribution}%`}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            FICO Weight (60% max)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            DTI Weight (40% max)
          </span>
        </div>
      </div>

      {/* Decision Factors */}
      <div>
        <div className="text-xs font-semibold text-slate-300 mb-2">
          Key Underwriting Factors &amp; Empirical Drivers
        </div>
        <div className="space-y-2">
          {result.decisionFactors.map((df, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/70 text-xs"
            >
              <div
                className={`mt-0.5 font-bold font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  df.impact === 'positive'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : df.impact === 'negative'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {df.impact.toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="font-medium text-slate-200">{df.factor}: </span>
                <span className="text-slate-400">{df.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations & Action Plan */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span>Prescriptive Underwriting Guidance</span>
          <span className="text-[10px] font-mono text-slate-500">FCRA / ECOA Standards</span>
        </div>
        <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
          {result.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>

      {/* Adverse action notice if rejected */}
      {result.adverseReasons && result.adverseReasons.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-1">
          <div className="font-semibold text-rose-400">
            Adverse Action Notification Summary (FCRA 15 U.S.C. § 1681m)
          </div>
          <p className="text-slate-400">
            Federal law requires that we provide the primary factors that influenced this decision:
          </p>
          <ul className="list-disc list-inside text-rose-300/90 font-mono text-[11px] space-y-0.5">
            {result.adverseReasons.map((ar, i) => (
              <li key={i}>{ar}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
        <button
          onClick={onViewAiAudit}
          className="w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Run Gemini AI Compliance Audit</span>
          <span className="font-mono text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded">
            ECOA / Reg B
          </span>
        </button>
        <button
          onClick={onInspectPlane}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          Inspect in 2D Decision Plane
        </button>
      </div>
    </div>
  );
};
