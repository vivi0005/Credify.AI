import React, { useState, useMemo } from 'react';
import type { LoanApplication, EvaluationResult } from '../types';

interface EvaluationFormProps {
  onEvaluated: (result: EvaluationResult) => void;
  isLoading: boolean;
  onLiveValuesChange?: (values: { creditScore: number; dti: number; requestedAmount: number; annualIncome: number }) => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  onEvaluated,
  isLoading,
  onLiveValuesChange,
}) => {
  const [formData, setFormData] = useState<LoanApplication>({
    applicantName: 'David K. Miller',
    email: 'david.miller@fintech.io',
    annualIncome: 95000,
    requestedAmount: 28000,
    creditScore: 720,
    existingMonthlyDebt: 950,
    loanTermMonths: 36,
    employmentStatus: 'Salaried',
    loanPurpose: 'Debt Consolidation',
  });

  // Prospective calculations for real-time interactive feedback
  const liveMetrics = useMemo(() => {
    const score = formData.creditScore;
    let apr = 17.99;
    if (score >= 750) apr = 6.99;
    else if (score >= 700) apr = 8.49;
    else if (score >= 650) apr = 10.99;
    else if (score >= 620) apr = 13.99;

    const r = apr / 100 / 12;
    const n = formData.loanTermMonths || 36;
    const p = formData.requestedAmount || 1000;

    let payment = 0;
    if (r === 0) {
      payment = p / n;
    } else {
      payment = (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    }

    const monthlyGross = Math.max(1, (formData.annualIncome || 12000) / 12);
    const totalDebt = (formData.existingMonthlyDebt || 0) + payment;
    const prospectiveDti = Math.round((totalDebt / monthlyGross) * 1000) / 10;

    let maxDti = 30;
    if (score >= 700) maxDti = 45;
    else if (score >= 620) maxDti = 36;

    let predictedStatus: 'Approved' | 'Rejected' | 'Borderline Review' = 'Rejected';
    if (score >= 700 && prospectiveDti <= 45) predictedStatus = 'Approved';
    else if (score >= 620 && prospectiveDti <= 36) predictedStatus = 'Approved';
    else if (score >= 620 && prospectiveDti <= 40) predictedStatus = 'Borderline Review';

    return {
      apr,
      payment: Math.round(payment),
      prospectiveDti,
      maxDti,
      predictedStatus,
    };
  }, [formData]);

  // Notify parent of live coordinates for 2D Decision Plane synchronization
  React.useEffect(() => {
    if (onLiveValuesChange) {
      onLiveValuesChange({
        creditScore: formData.creditScore,
        dti: liveMetrics.prospectiveDti,
        requestedAmount: formData.requestedAmount,
        annualIncome: formData.annualIncome,
      });
    }
  }, [formData, liveMetrics.prospectiveDti, onLiveValuesChange]);

  const setPreset = (preset: Partial<LoanApplication>) => {
    setFormData((prev) => ({ ...prev, ...preset }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Evaluation failed');
      const data: EvaluationResult = await res.json();
      onEvaluated(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getCreditScoreTier = (score: number) => {
    if (score >= 800) return { label: 'Super Prime', color: 'text-emerald-400' };
    if (score >= 700) return { label: 'Prime', color: 'text-emerald-400' };
    if (score >= 620) return { label: 'Near Prime', color: 'text-amber-400' };
    if (score >= 580) return { label: 'Subprime', color: 'text-rose-400' };
    return { label: 'Deep Subprime', color: 'text-rose-500' };
  };

  const tier = getCreditScoreTier(formData.creditScore);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Loan Underwriting Vectors
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical financial inputs for automated debt service qualification
          </p>
        </div>

        {/* Live Prospective Status Indicator */}
        <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800/90 px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="text-slate-400">Projected:</span>
          <span
            className={`font-semibold ${
              liveMetrics.predictedStatus === 'Approved'
                ? 'text-emerald-400'
                : liveMetrics.predictedStatus === 'Borderline Review'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {liveMetrics.predictedStatus}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            DTI: <span className="tabular-nums font-semibold">{liveMetrics.prospectiveDti}%</span>
          </span>
        </div>
      </div>

      {/* Preset Personas */}
      <div className="my-4">
        <div className="text-[11px] font-medium text-slate-400 mb-2">
          Load Benchmark Presets
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() =>
              setPreset({
                applicantName: 'Elena Rostova',
                email: 'elena.rostova@nexus.org',
                annualIncome: 140000,
                requestedAmount: 30000,
                creditScore: 785,
                existingMonthlyDebt: 650,
                loanTermMonths: 36,
                employmentStatus: 'Salaried',
                loanPurpose: 'Home Improvement',
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors"
          >
            <div className="text-xs font-medium text-slate-200">Prime Tech</div>
            <div className="text-[10px] text-emerald-400 font-mono">785 FICO · 18% DTI</div>
          </button>
          <button
            type="button"
            onClick={() =>
              setPreset({
                applicantName: 'Jordan Hayes',
                email: 'jordan.hayes@supply.io',
                annualIncome: 65000,
                requestedAmount: 22000,
                creditScore: 660,
                existingMonthlyDebt: 1250,
                loanTermMonths: 48,
                employmentStatus: 'Salaried',
                loanPurpose: 'Debt Consolidation',
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 text-left transition-colors"
          >
            <div className="text-xs font-medium text-slate-200">Borderline Debt</div>
            <div className="text-[10px] text-amber-400 font-mono">660 FICO · 36% DTI</div>
          </button>
          <button
            type="button"
            onClick={() =>
              setPreset({
                applicantName: 'Marcus Ramirez',
                email: 'm.ramirez@logistics.net',
                annualIncome: 45000,
                requestedAmount: 35000,
                creditScore: 560,
                existingMonthlyDebt: 1100,
                loanTermMonths: 60,
                employmentStatus: 'Contractor',
                loanPurpose: 'Vehicle',
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 text-left transition-colors"
          >
            <div className="text-xs font-medium text-slate-200">Subprime High Risk</div>
            <div className="text-[10px] text-rose-400 font-mono">560 FICO · 51% DTI</div>
          </button>
          <button
            type="button"
            onClick={() =>
              setPreset({
                applicantName: 'Maya Patel',
                email: 'maya.patel@solaris.co',
                annualIncome: 115000,
                requestedAmount: 45000,
                creditScore: 730,
                existingMonthlyDebt: 1400,
                loanTermMonths: 48,
                employmentStatus: 'Business Owner',
                loanPurpose: 'Business Expansion',
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 text-left transition-colors"
          >
            <div className="text-xs font-medium text-slate-200">Founder Growth</div>
            <div className="text-[10px] text-blue-400 font-mono">730 FICO · 27% DTI</div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Applicant Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Applicant Legal Entity / Name
            </label>
            <input
              type="text"
              required
              value={formData.applicantName}
              onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Primary Contact Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Primary Numerical Vectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Annual Gross Income</label>
              <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold">
                ${formData.annualIncome.toLocaleString()}
              </span>
            </div>
            <input
              type="number"
              min="10000"
              max="1000000"
              step="1000"
              value={formData.annualIncome}
              onChange={(e) => setFormData({ ...formData, annualIncome: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Requested Loan Capital</label>
              <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold">
                ${formData.requestedAmount.toLocaleString()}
              </span>
            </div>
            <input
              type="number"
              min="1000"
              max="500000"
              step="1000"
              value={formData.requestedAmount}
              onChange={(e) => setFormData({ ...formData, requestedAmount: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
            />
          </div>
        </div>

        {/* Interactive Bureau Credit Score Slider */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">
              Bureau Credit Score (FICO / VantageScore)
            </label>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${tier.color}`}>
                {tier.label}
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {formData.creditScore}
              </span>
            </div>
          </div>

          <input
            type="range"
            min="300"
            max="850"
            step="5"
            value={formData.creditScore}
            onChange={(e) => setFormData({ ...formData, creditScore: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>300 (Subprime)</span>
            <span>620 (Near Prime)</span>
            <span>700 (Prime Cutoff)</span>
            <span>850 (Exceptional)</span>
          </div>
        </div>

        {/* Existing Debt & Term */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Existing Monthly Debt</label>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                ${formData.existingMonthlyDebt.toLocaleString()}/mo
              </span>
            </div>
            <input
              type="number"
              min="0"
              max="50000"
              step="50"
              value={formData.existingMonthlyDebt}
              onChange={(e) => setFormData({ ...formData, existingMonthlyDebt: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Amortization Term</label>
              <span className="text-xs font-mono text-slate-400">
                {formData.loanTermMonths} Months ({formData.loanTermMonths / 12} Yrs)
              </span>
            </div>
            <select
              value={formData.loanTermMonths}
              onChange={(e) => setFormData({ ...formData, loanTermMonths: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="12">12 Months (1 Year)</option>
              <option value="24">24 Months (2 Years)</option>
              <option value="36">36 Months (3 Years - Standard)</option>
              <option value="48">48 Months (4 Years)</option>
              <option value="60">60 Months (5 Years)</option>
              <option value="84">84 Months (7 Years)</option>
            </select>
          </div>
        </div>

        {/* Employment & Purpose */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Employment Status</label>
            <select
              value={formData.employmentStatus}
              onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Salaried">Salaried (Full-Time Verifiable W-2)</option>
              <option value="Self-Employed">Self-Employed (1099 / Tax Returns)</option>
              <option value="Contractor">Contractor / Gig Economy</option>
              <option value="Business Owner">Business Owner (Commercial Entity)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Stated Loan Purpose</label>
            <select
              value={formData.loanPurpose}
              onChange={(e) => setFormData({ ...formData, loanPurpose: e.target.value as any })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Debt Consolidation">Debt Consolidation</option>
              <option value="Home Improvement">Home Improvement</option>
              <option value="Business Expansion">Business Expansion</option>
              <option value="Vehicle">Vehicle Acquisition</option>
              <option value="Personal">Personal Major Expense</option>
            </select>
          </div>
        </div>

        {/* Estimated Real-Time Payment Strip */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
          <div className="text-slate-400">
            Est. Monthly Installment:{' '}
            <span className="font-mono font-semibold text-white tabular-nums">
              ${liveMetrics.payment.toLocaleString()}/mo
            </span>{' '}
            <span className="text-[10px] text-slate-500">(@ {liveMetrics.apr}% APR)</span>
          </div>
          <div className="text-slate-400">
            DTI Cap for Tier:{' '}
            <span className="font-mono font-semibold text-slate-300">{liveMetrics.maxDti}%</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span>Computing Underwriting Decision...</span>
          ) : (
            <>
              <span>Evaluate Loan Eligibility</span>
              <span className="font-mono text-[10px] bg-slate-950/20 px-2 py-0.5 rounded">
                Matrix v2.4
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
