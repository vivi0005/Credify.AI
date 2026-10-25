import React, { useState } from 'react';

interface VivaQuestion {
  id: string;
  category: 'Architecture' | 'Mathematical Models' | 'Fintech Underwriting' | 'Fair Lending & Ethics';
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  codeSnippet?: string;
  keyTakeaway: string;
}

export const VivaGuide: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('q-1');

  const questions: VivaQuestion[] = [
    {
      id: 'q-1',
      category: 'Architecture',
      question: 'What is the Flask Application Factory Pattern and why did we implement it?',
      shortAnswer:
        'The Application Factory pattern packages the initialization of the Flask app inside a create_app() function rather than creating a global app instance.',
      detailedAnswer:
        'In basic Flask scripts, creating a global `app = Flask(__name__)` causes circular imports when database models, route blueprints, and configuration files all attempt to import `app`. By wrapping instantiation in `create_app(config_name)`, we can spin up multiple distinct app instances dynamically for testing with temporary SQLite databases or production with PostgreSQL, without modifying core logic.',
      codeSnippet: `def create_app(config_name=None):
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))
    db.init_app(app)
    app.register_blueprint(loan_bp, url_prefix='/api')
    return app`,
      keyTakeaway: 'Enables testing isolation, eliminates global state mutations, and allows dynamic environment configuration.',
    },
    {
      id: 'q-2',
      category: 'Architecture',
      question: 'Why is extension.py decoupled from both models and app.py?',
      shortAnswer:
        'Decoupling SQLAlchemy() and CORS() instances prevents circular import deadlocks between models and blueprints.',
      detailedAnswer:
        'If `db = SQLAlchemy(app)` is declared in `app.py`, then `models.py` must import `db` from `app.py`, while `app.py` must import `models.py` to register tables, creating an unresolvable circular dependency. By declaring unattached `db = SQLAlchemy()` in `extension.py`, both `app.py` and `models.py` import from `extension.py` cleanly. The app is subsequently bound via `db.init_app(app)`.',
      codeSnippet: `# extension.py
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

# app.py
from .extension import db
def create_app():
    ...
    db.init_app(app)`,
      keyTakeaway: 'Strict separation of plugin definition vs. runtime lifecycle binding.',
    },
    {
      id: 'q-3',
      category: 'Mathematical Models',
      question: 'How is the monthly installment amortized mathematically?',
      shortAnswer:
        'We use the standard actuarial annuity amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1].',
      detailedAnswer:
        'Where P is Principal (Requested Capital), r is the periodic monthly interest rate (APR / 100 / 12), and n is the total number of compounding monthly periods (term). This ensures that each payment pays down both accumulated monthly interest and retiring principal, yielding an exact zero balance at maturity.',
      codeSnippet: `def compute_amortization(amount: float, apr: float, months: int) -> float:
    r = (apr / 100.0) / 12.0
    numerator = amount * (r * ((1 + r) ** months))
    denominator = ((1 + r) ** months) - 1
    return round(numerator / denominator, 2)`,
      keyTakeaway: 'Prevents arbitrary linear estimates; guarantees mathematically accurate debt service forecasting.',
    },
    {
      id: 'q-4',
      category: 'Mathematical Models',
      question: 'How does the 2D Decision Boundary plane classify applicants?',
      shortAnswer:
        'The plane defines a non-linear piecewise classification space based on Bureau Credit Score (X-axis) and Debt-to-Income ratio (Y-axis).',
      detailedAnswer:
        'Instead of a single score threshold, real underwriting requires multi-dimensional debt tolerance. Prime borrowers (FICO >= 700) are permitted up to 45% post-obligation DTI. Near-Prime borrowers (FICO 620-699) have higher statistical default rates and are therefore restricted to a 36% DTI ceiling. Scores below 620 or DTI above 45% fall into the rejection domain.',
      codeSnippet: `if credit_score >= 700 and dti <= 45.0:
    return 'Approved'
elif credit_score >= 620 and dti <= 36.0:
    return 'Approved'
elif credit_score >= 620 and dti <= 40.0:
    return 'Borderline Review' # Trips HITL queue
else:
    return 'Rejected'`,
      keyTakeaway: 'Reflects real banking risk appetite where higher credit creditworthiness unlocks higher debt tolerance.',
    },
    {
      id: 'q-5',
      category: 'Mathematical Models',
      question: 'How is the Composite Confidence Score weighted?',
      shortAnswer:
        '60% weight on normalized Credit Bureau Score + 40% weight on normalized Debt-to-Income ratio.',
      detailedAnswer:
        'Credit score (300 to 850 range) is normalized to a 0-100 scale: `((Score - 300) / 550) * 100`. DTI (0 to 60% range) is normalized inversely: `(1 - (DTI / 60)) * 100`. The composite score is computed as `0.60 * NormCredit + 0.40 * NormDti`, providing a balanced indicator of repayment history vs. current cash flow capacity.',
      keyTakeaway: 'Ensures an applicant with high credit cannot be approved if burdened by overwhelming monthly debt.',
    },
    {
      id: 'q-6',
      category: 'Fair Lending & Ethics',
      question: 'What is the Equal Credit Opportunity Act (ECOA) and how does our system comply?',
      shortAnswer:
        'ECOA (12 CFR Part 1002 / Regulation B) makes it illegal for any creditor to discriminate on prohibited bases.',
      detailedAnswer:
        'Credify AI operates on a strictly anonymized, feature-restricted data model. Prohibited variables like race, gender, national origin, religion, and marital status are strictly excluded from the schema. Decisions are deterministic functions of mathematical cash flow and bureau records, verified by our AI Governance audit suite.',
      keyTakeaway: 'Fair lending compliance requires both algorithmically unbiased models and strict data schema boundaries.',
    },
    {
      id: 'q-7',
      category: 'Fair Lending & Ethics',
      question: 'Why does the Fair Credit Reporting Act (FCRA) mandate Adverse Action notices?',
      shortAnswer:
        'When credit is denied, federal law requires informing the applicant of the specific principal reasons for the denial.',
      detailedAnswer:
        'Black-box rejections are illegal in financial services. Our engine provides explicit Adverse Action reasons (e.g. "DTI exceeded 36% tier cap", "Credit Score below 620 minimum") alongside actionable remediation guidance to assist borrowers in regaining eligibility.',
      keyTakeaway: 'Explainable AI (XAI) is not merely a design preference in fintech—it is a legal mandate under 15 U.S.C. § 1681m.',
    },
    {
      id: 'q-8',
      category: 'Fair Lending & Ethics',
      question: 'What is Human-in-the-Loop (HITL) exception routing?',
      shortAnswer:
        'Borderline applications (such as 620-660 score with 35-40% DTI) are automatically flagged for senior human underwriter dual-signoff.',
      detailedAnswer:
        'Full automation without review on borderline scores can produce unintended disparate impact. By defining a buffer zone on the 2D Decision Plane, the system empowers human officers to evaluate mitigating factors (e.g., substantial cash reserves or continuous employment tenure) before issuing an adverse determination.',
      keyTakeaway: 'Harmonizes high-throughput automated decisioning with accountable human oversight for edge cases.',
    },
  ];

  const categories = ['All', 'Architecture', 'Mathematical Models', 'Fintech Underwriting', 'Fair Lending & Ethics'];

  const filtered = questions.filter((q) => {
    const matchesCat = activeCategory === 'All' ? true : q.category === activeCategory;
    const matchesSearch =
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.detailedAnswer.toLowerCase().includes(search.toLowerCase()) ||
      q.keyTakeaway.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
              Academic Project Defense &amp; Oral Exam Prep
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight mt-0.5">
              Viva Voce Technical Defense Hub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive technical, mathematical, and regulatory questions expected during academic viva panels
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {filtered.length} Curated Questions
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mt-4">
          <input
            type="text"
            placeholder="Search viva questions, formulas, or concepts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-md transition-all overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-850/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    {item.question}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {item.shortAnswer}
                  </p>
                </div>
                <div className="text-slate-400 text-base font-mono shrink-0 mt-1">
                  {isExpanded ? '−' : '+'}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-3 text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1">Detailed Defense:</h4>
                    <p className="text-slate-300 leading-relaxed font-sans">
                      {item.detailedAnswer}
                    </p>
                  </div>

                  {item.codeSnippet && (
                    <div>
                      <h4 className="font-semibold text-slate-400 font-mono text-[11px] mb-1">
                        Code Reference:
                      </h4>
                      <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                        {item.codeSnippet}
                      </pre>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-slate-300">
                    <span className="font-semibold text-emerald-400">Examiner Key Takeaway: </span>
                    {item.keyTakeaway}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
