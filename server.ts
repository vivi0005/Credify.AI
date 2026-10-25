import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import type { EvaluationResult, LoanApplication, SystemStats, User, AiAuditReport, FlaskCodeFile } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Seed Users
const users: User[] = [
  {
    id: 'usr-1',
    name: 'Sarah Jenkins, CRCM',
    email: 's.jenkins@credify.ai',
    role: 'Underwriting Officer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance, PhD',
    email: 'm.vance@credify.ai',
    role: 'Risk Analyst',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-3',
    name: 'Alex Chen',
    email: 'alex.chen@applicant.io',
    role: 'Loan Applicant',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
];

let currentUser: User = users[0]; // Default logged-in as Underwriting Officer

// Calculation Utilities
function calculateApr(creditScore: number): number {
  if (creditScore >= 750) return 6.99;
  if (creditScore >= 700) return 8.49;
  if (creditScore >= 650) return 10.99;
  if (creditScore >= 620) return 13.99;
  return 17.99;
}

function calculateRiskTier(creditScore: number): EvaluationResult['riskTier'] {
  if (creditScore >= 800) return 'Super Prime';
  if (creditScore >= 700) return 'Prime';
  if (creditScore >= 620) return 'Near Prime';
  if (creditScore >= 580) return 'Subprime';
  return 'Deep Subprime';
}

function calculateEvaluation(appData: LoanApplication): EvaluationResult {
  const apr = calculateApr(appData.creditScore);
  const monthlyRate = apr / 100 / 12;
  const n = appData.loanTermMonths || 36;
  const p = appData.requestedAmount;

  let monthlyPayment = 0;
  if (monthlyRate === 0) {
    monthlyPayment = p / n;
  } else {
    monthlyPayment = (p * (monthlyRate * Math.pow(1 + monthlyRate, n))) / (Math.pow(1 + monthlyRate, n) - 1);
  }
  monthlyPayment = Math.round(monthlyPayment * 100) / 100;

  const monthlyGrossIncome = Math.max(1, appData.annualIncome / 12);
  const totalMonthlyDebt = appData.existingMonthlyDebt + monthlyPayment;
  const dti = Math.round((totalMonthlyDebt / monthlyGrossIncome) * 1000) / 10; // e.g. 34.2%

  let maxAllowedDti = 30;
  if (appData.creditScore >= 700) {
    maxAllowedDti = 45;
  } else if (appData.creditScore >= 620) {
    maxAllowedDti = 36;
  }

  let status: EvaluationResult['status'] = 'Rejected';
  if (appData.creditScore >= 700 && dti <= 45) {
    status = 'Approved';
  } else if (appData.creditScore >= 620 && dti <= 36) {
    status = 'Approved';
  } else if (appData.creditScore >= 620 && dti <= 40) {
    status = 'Borderline Review';
  } else {
    status = 'Rejected';
  }

  // Composite Confidence Calculation: 60% Credit Score + 40% DTI
  // Normalized Credit Score: (score - 300) / 550 * 100
  const normCredit = Math.max(0, Math.min(100, ((appData.creditScore - 300) / 550) * 100));
  // Normalized DTI: (1 - (DTI / 60)) * 100
  const normDti = Math.max(0, Math.min(100, (1 - dti / 60) * 100));

  const creditScoreContribution = Math.round(normCredit * 0.6 * 10) / 10;
  const dtiContribution = Math.round(normDti * 0.4 * 10) / 10;
  const compositeConfidenceScore = Math.round((creditScoreContribution + dtiContribution) * 10) / 10;

  const decisionFactors = [];
  const adverseReasons = [];

  // Credit factor
  if (appData.creditScore >= 700) {
    decisionFactors.push({
      factor: 'Bureau Credit Profile',
      impact: 'positive' as const,
      detail: `Bureau score of ${appData.creditScore} satisfies prime liquidity thresholds (>700).`,
    });
  } else if (appData.creditScore >= 620) {
    decisionFactors.push({
      factor: 'Bureau Credit Profile',
      impact: 'neutral' as const,
      detail: `Bureau score of ${appData.creditScore} falls in the near-prime band (620-699).`,
    });
  } else {
    decisionFactors.push({
      factor: 'Bureau Credit Profile',
      impact: 'negative' as const,
      detail: `Bureau score of ${appData.creditScore} indicates subprime default probability (<620).`,
    });
    adverseReasons.push(`Bureau Credit Score (${appData.creditScore}) below minimum underwriting standard of 620.`);
  }

  // DTI factor
  if (dti <= 36) {
    decisionFactors.push({
      factor: 'Debt-to-Income (DTI)',
      impact: 'positive' as const,
      detail: `Post-obligation DTI of ${dti}% is well below the conservative 36% ceiling.`,
    });
  } else if (dti <= maxAllowedDti) {
    decisionFactors.push({
      factor: 'Debt-to-Income (DTI)',
      impact: 'neutral' as const,
      detail: `Post-obligation DTI of ${dti}% within allowable limit (${maxAllowedDti}%) for credit tier.`,
    });
  } else {
    decisionFactors.push({
      factor: 'Debt-to-Income (DTI)',
      impact: 'negative' as const,
      detail: `Post-obligation DTI of ${dti}% breaches tier maximum tolerance of ${maxAllowedDti}%.`,
    });
    adverseReasons.push(`Total Debt-to-Income ratio (${dti}%) exceeds max threshold of ${maxAllowedDti}%.`);
  }

  // Loan to Income Ratio
  const loanToIncomeRatio = Math.round((appData.requestedAmount / appData.annualIncome) * 100);
  if (loanToIncomeRatio <= 35) {
    decisionFactors.push({
      factor: 'Requested Capital Leverage',
      impact: 'positive' as const,
      detail: `Loan capital represents ${loanToIncomeRatio}% of annual earnings, within prudent leverage parameters.`,
    });
  } else if (loanToIncomeRatio <= 50) {
    decisionFactors.push({
      factor: 'Requested Capital Leverage',
      impact: 'neutral' as const,
      detail: `Loan capital represents ${loanToIncomeRatio}% of annual earnings; manageable debt load.`,
    });
  } else {
    decisionFactors.push({
      factor: 'Requested Capital Leverage',
      impact: 'negative' as const,
      detail: `Requested amount represents ${loanToIncomeRatio}% of annual gross income, elevating debt strain.`,
    });
    adverseReasons.push(`Requested capital is ${loanToIncomeRatio}% of annual earnings, exceeding 50% guideline.`);
  }

  const recommendations = [];
  if (status === 'Approved') {
    recommendations.push('Proceed with standard digital KYC verification and disbursement underwriting.');
    recommendations.push(`Offer prime APR rate of ${apr}% fixed over ${n} months.`);
    recommendations.push('Setup auto-pay for a 0.25% prospective rate discount incentive.');
  } else if (status === 'Borderline Review') {
    recommendations.push('Route application to Human-in-the-Loop Senior Underwriting Officer for manual debt verification.');
    recommendations.push(`Request 2 recent pay stubs or bank statements to verify supplemental cash reserves.`);
    recommendations.push(`Consider extending term to ${Math.min(84, n + 12)} months to compress DTI by ~${Math.round(dti * 0.12)}%.`);
  } else {
    recommendations.push('Issue formal FCRA Adverse Action Statement citing debt burden and bureau metrics.');
    recommendations.push(`Borrower guidance: Reducing monthly debt by $${Math.round(monthlyGrossIncome * 0.08)} drops DTI into qualifying range.`);
    recommendations.push('Recommend credit bureau remediation and re-evaluation in 90 days.');
  }

  return {
    id: `eval-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    applicantName: appData.applicantName || 'Applicant',
    email: appData.email || 'applicant@example.com',
    annualIncome: appData.annualIncome,
    requestedAmount: appData.requestedAmount,
    creditScore: appData.creditScore,
    existingMonthlyDebt: appData.existingMonthlyDebt,
    loanTermMonths: n,
    employmentStatus: appData.employmentStatus || 'Salaried',
    loanPurpose: appData.loanPurpose || 'Personal',
    monthlyPayment,
    interestRate: apr,
    dti,
    maxAllowedDti,
    status,
    creditScoreContribution,
    dtiContribution,
    compositeConfidenceScore,
    riskTier: calculateRiskTier(appData.creditScore),
    decisionFactors,
    recommendations,
    adverseReasons: adverseReasons.length > 0 ? adverseReasons : undefined,
  };
}

// In-Memory Evaluation Ledger with Realistic Seed Data
const evaluationLedger: EvaluationResult[] = [
  calculateEvaluation({
    applicantName: 'Elena Rostova',
    email: 'elena.rostova@nexus.org',
    annualIncome: 145000,
    requestedAmount: 32000,
    creditScore: 785,
    existingMonthlyDebt: 620,
    loanTermMonths: 36,
    employmentStatus: 'Salaried',
    loanPurpose: 'Home Improvement',
  }),
  calculateEvaluation({
    applicantName: 'David K. Miller',
    email: 'david.miller@fintech.io',
    annualIncome: 92000,
    requestedAmount: 24000,
    creditScore: 715,
    existingMonthlyDebt: 1100,
    loanTermMonths: 48,
    employmentStatus: 'Salaried',
    loanPurpose: 'Debt Consolidation',
  }),
  calculateEvaluation({
    applicantName: 'Tanya Sterling',
    email: 'tanya.sterling@studio.dev',
    annualIncome: 68000,
    requestedAmount: 18000,
    creditScore: 655,
    existingMonthlyDebt: 980,
    loanTermMonths: 36,
    employmentStatus: 'Self-Employed',
    loanPurpose: 'Business Expansion',
  }),
  calculateEvaluation({
    applicantName: 'Marcus Ramirez',
    email: 'm.ramirez@logistics.net',
    annualIncome: 54000,
    requestedAmount: 35000,
    creditScore: 590,
    existingMonthlyDebt: 1400,
    loanTermMonths: 60,
    employmentStatus: 'Contractor',
    loanPurpose: 'Vehicle',
  }),
  calculateEvaluation({
    applicantName: 'Aisha Al-Mansoor',
    email: 'aisha.m@medicare.org',
    annualIncome: 180000,
    requestedAmount: 60000,
    creditScore: 820,
    existingMonthlyDebt: 1250,
    loanTermMonths: 48,
    employmentStatus: 'Salaried',
    loanPurpose: 'Home Improvement',
  }),
  calculateEvaluation({
    applicantName: 'Bryan Kowalski',
    email: 'b.kowalski@trade.co',
    annualIncome: 62000,
    requestedAmount: 40000,
    creditScore: 630,
    existingMonthlyDebt: 1650,
    loanTermMonths: 36,
    employmentStatus: 'Business Owner',
    loanPurpose: 'Debt Consolidation',
  }),
];

// Seeded Flask Codebase Blueprint Files
const flaskCodeFiles: FlaskCodeFile[] = [
  {
    path: 'credify-ai/app.py',
    title: 'app.py',
    category: 'Application Factory',
    description: 'Central Flask Application Factory initializing SQLAlchemy, CORS, and registering blueprints.',
    content: `"""
Credify AI - Flask Application Factory
Author: Credify Systems Engineering
"""
import os
from flask import Flask, jsonify
from .config import get_config
from .extension import db, cors
from .routes.loan import loan_bp

def create_app(config_name=None):
    """
    Application Factory Pattern for Credify AI.
    Decouples configuration, database instances, and route blueprints.
    """
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(get_config(config_name))

    # Initialize Decoupled Extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Register Route Blueprints
    app.register_blueprint(loan_bp, url_prefix='/api')

    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Credify AI Engine',
            'version': '2.4.0'
        })

    # Create tables if not present
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
`,
  },
  {
    path: 'credify-ai/config.py',
    title: 'config.py',
    category: 'Configuration',
    description: 'Environment-aware settings reading DATABASE_URL and SECRET_KEY via python-dotenv.',
    content: `"""
Credify AI Configuration Specification
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'credify-secret-key-38827101')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DTI_PRIME_MAX = float(os.getenv('DTI_PRIME_MAX', 45.0))
    DTI_NEAR_PRIME_MAX = float(os.getenv('DTI_NEAR_PRIME_MAX', 36.0))
    CREDIT_SCORE_PRIME_MIN = int(os.getenv('CREDIT_SCORE_PRIME_MIN', 700))
    CREDIT_SCORE_NEAR_PRIME_MIN = int(os.getenv('CREDIT_SCORE_NEAR_PRIME_MIN', 620))

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL', 
        f"sqlite:///{BASE_DIR / 'credify_dev.db'}"
    )

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

def get_config(env_name):
    configs = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': DevelopmentConfig
    }
    return configs.get(env_name, DevelopmentConfig)
`,
  },
  {
    path: 'credify-ai/extension.py',
    title: 'extension.py',
    category: 'Architecture Decoupling',
    description: 'Decoupled SQLAlchemy and CORS instances to prevent circular import loops.',
    content: `"""
Credify AI - Decoupled Extension Bindings
Enforces zero circular dependencies across models and blueprints.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Decoupled instances - bound inside create_app()
db = SQLAlchemy()
cors = CORS()
`,
  },
  {
    path: 'credify-ai/models/loan_record.py',
    title: 'loan_record.py',
    category: 'Database Models',
    description: 'SQLAlchemy ORM model persisting evaluated applications, DTI, confidence, and timestamps.',
    content: `"""
Credify AI - Loan Record Schema
"""
from datetime import datetime
from ..extension import db

class LoanRecord(db.Model):
    __tablename__ = 'loan_records'

    id = db.Column(db.String(36), primary_key=True)
    applicant_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    annual_income = db.Column(db.Float, nullable=False)
    requested_amount = db.Column(db.Float, nullable=False)
    credit_score = db.Column(db.Integer, nullable=False)
    existing_monthly_debt = db.Column(db.Float, nullable=False)
    loan_term_months = db.Column(db.Integer, default=36)
    
    # Computed metrics
    monthly_payment = db.Column(db.Float, nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    dti = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(30), nullable=False) # Approved, Rejected, Borderline
    composite_confidence = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'applicantName': self.applicant_name,
            'email': self.email,
            'annualIncome': self.annual_income,
            'requestedAmount': self.requested_amount,
            'creditScore': self.credit_score,
            'existingMonthlyDebt': self.existing_monthly_debt,
            'loanTermMonths': self.loan_term_months,
            'monthlyPayment': self.monthly_payment,
            'interestRate': self.interest_rate,
            'dti': self.dti,
            'status': self.status,
            'compositeConfidenceScore': self.composite_confidence,
            'timestamp': self.created_at.isoformat()
        }
`,
  },
  {
    path: 'credify-ai/services/eligibility.py',
    title: 'eligibility.py',
    category: 'Business Logic & Math',
    description: 'Deterministic Decision Matrix, Amortization calculation, and 60/40 weighted confidence scoring.',
    content: `"""
Credify AI Underwriting Engine & Mathematical Models
"""
import math
import uuid

def compute_amortization(amount: float, apr: float, months: int) -> float:
    \"\"\"
    Monthly payment calculation: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    \"\"\"
    if months <= 0:
        return 0.0
    r = (apr / 100.0) / 12.0
    if r == 0:
        return round(amount / months, 2)
    numerator = amount * (r * ((1 + r) ** months))
    denominator = ((1 + r) ** months) - 1
    return round(numerator / denominator, 2)

def evaluate_loan_eligibility(payload: dict) -> dict:
    \"\"\"
    Deterministic underwriting logic implementing prime, near-prime, and subprime cutoffs.
    \"\"\"
    credit_score = int(payload.get('creditScore', 650))
    annual_income = float(payload.get('annualIncome', 60000))
    requested_amount = float(payload.get('requestedAmount', 15000))
    existing_debt = float(payload.get('existingMonthlyDebt', 500))
    term_months = int(payload.get('loanTermMonths', 36))

    # Determine APR bracket
    if credit_score >= 750:
        apr = 6.99
    elif credit_score >= 700:
        apr = 8.49
    elif credit_score >= 650:
        apr = 10.99
    elif credit_score >= 620:
        apr = 13.99
    else:
        apr = 17.99

    monthly_payment = compute_amortization(requested_amount, apr, term_months)
    monthly_gross_income = max(1.0, annual_income / 12.0)
    total_monthly_debt = existing_debt + monthly_payment
    dti = round((total_monthly_debt / monthly_gross_income) * 100.0, 1)

    # Decision Matrix
    if credit_score >= 700 and dti <= 45.0:
        status = 'Approved'
        max_dti = 45.0
    elif credit_score >= 620 and dti <= 36.0:
        status = 'Approved'
        max_dti = 36.0
    elif credit_score >= 620 and dti <= 40.0:
        status = 'Borderline Review'
        max_dti = 36.0
    else:
        status = 'Rejected'
        max_dti = 30.0

    # Composite Confidence: 60% Credit Score + 40% DTI
    norm_credit = max(0.0, min(100.0, ((credit_score - 300) / 550.0) * 100.0))
    norm_dti = max(0.0, min(100.0, (1.0 - (dti / 60.0)) * 100.0))
    confidence = round((norm_credit * 0.6) + (norm_dti * 0.4), 1)

    return {
        'id': str(uuid.uuid4()),
        'applicantName': payload.get('applicantName', 'Applicant'),
        'email': payload.get('email', 'applicant@credify.ai'),
        'annualIncome': annual_income,
        'requestedAmount': requested_amount,
        'creditScore': credit_score,
        'existingMonthlyDebt': existing_debt,
        'loanTermMonths': term_months,
        'monthlyPayment': monthly_payment,
        'interestRate': apr,
        'dti': dti,
        'maxAllowedDti': max_dti,
        'status': status,
        'compositeConfidenceScore': confidence
    }
`,
  },
  {
    path: 'credify-ai/routes/loan.py',
    title: 'loan.py',
    category: 'REST API Blueprint',
    description: 'REST routes for loan evaluation, history querying, and portfolio summary KPIs.',
    content: `"""
Credify AI - Loan Underwriting Blueprint
"""
from flask import Blueprint, request, jsonify
from ..extension import db
from ..models.loan_record import LoanRecord
from ..services.eligibility import evaluate_loan_eligibility

loan_bp = Blueprint('loan_bp', __name__)

@loan_bp.route('/evaluate', methods=['POST'])
def evaluate_loan():
    payload = request.get_json() or {}
    result = evaluate_loan_eligibility(payload)

    # Persist in SQLite/PostgreSQL
    record = LoanRecord(
        id=result['id'],
        applicant_name=result['applicantName'],
        email=result['email'],
        annual_income=result['annualIncome'],
        requested_amount=result['requestedAmount'],
        credit_score=result['creditScore'],
        existing_monthly_debt=result['existingMonthlyDebt'],
        loan_term_months=result['loanTermMonths'],
        monthly_payment=result['monthlyPayment'],
        interest_rate=result['interestRate'],
        dti=result['dti'],
        status=result['status'],
        composite_confidence=result['compositeConfidenceScore']
    )
    db.session.add(record)
    db.session.commit()

    return jsonify(result), 200

@loan_bp.route('/history', methods=['GET'])
def get_history():
    records = LoanRecord.query.order_by(LoanRecord.created_at.desc()).limit(100).all()
    return jsonify([r.to_dict() for r in records]), 200

@loan_bp.route('/stats', methods=['GET'])
def get_stats():
    total = LoanRecord.query.count()
    approved = LoanRecord.query.filter_by(status='Approved').count()
    rejected = LoanRecord.query.filter_by(status='Rejected').count()
    return jsonify({
        'total': total,
        'approved': approved,
        'rejected': rejected,
        'approvalRate': round((approved / total * 100), 1) if total > 0 else 0
    })
`,
  },
  {
    path: 'credify-ai/templates/index.html',
    title: 'index.html (Jinja2)',
    category: 'Presentation Layer',
    description: 'Standalone Jinja2 template with glassmorphic CSS styling and vanilla JS API bindings.',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Credify AI - Standalone Flask Interface</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen p-8">
  <div class="max-w-4xl mx-auto">
    <header class="border-b border-gray-800 pb-4 mb-6">
      <h1 class="text-2xl font-bold tracking-tight">Credify AI (Flask Engine)</h1>
      <p class="text-sm text-gray-400">Algorithmic Loan Eligibility & Underwriting Matrix</p>
    </header>
    <!-- Live Form Container -->
    <div id="app" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Evaluation Form & Output -->
    </div>
  </div>
</body>
</html>
`,
  },
  {
    path: 'credify-ai/test_eligibility.py',
    title: 'test_eligibility.py',
    category: 'Unit Testing',
    description: 'Pytest test cases testing prime, near-prime, DTI boundary violations, and subprime rejection.',
    content: `"""
Credify AI Unit Test Suite
"""
import pytest
from services.eligibility import evaluate_loan_eligibility, compute_amortization

def test_prime_applicant_approval():
    data = {
        'applicantName': 'Alice Prime',
        'creditScore': 780,
        'annualIncome': 120000,
        'requestedAmount': 25000,
        'existingMonthlyDebt': 400,
        'loanTermMonths': 36
    }
    result = evaluate_loan_eligibility(data)
    assert result['status'] == 'Approved'
    assert result['dti'] < 45.0
    assert result['compositeConfidenceScore'] >= 75.0

def test_subprime_rejection():
    data = {
        'applicantName': 'Bob Subprime',
        'creditScore': 550,
        'annualIncome': 40000,
        'requestedAmount': 30000,
        'existingMonthlyDebt': 800,
        'loanTermMonths': 36
    }
    result = evaluate_loan_eligibility(data)
    assert result['status'] == 'Rejected'

def test_amortization_math():
    payment = compute_amortization(10000, 12.0, 12)
    assert 880 < payment < 895
`,
  },
  {
    path: 'credify-ai/requirements.txt',
    title: 'requirements.txt',
    category: 'Dependencies',
    description: 'Python package manifest for deployment with Gunicorn, Flask, and SQLAlchemy.',
    content: `Flask==3.0.2
Flask-SQLAlchemy==3.1.1
Flask-CORS==4.0.0
python-dotenv==1.0.1
gunicorn==21.2.0
pytest==8.0.0
`,
  },
  {
    path: 'credify-ai/.gitignore',
    title: '.gitignore',
    category: 'Repository Hygiene',
    description: 'Git ignore rules for Python bytecode, virtual environments, and SQLite database artifacts.',
    content: `__pycache__/
*.py[cod]
*$py.class
*.so
.env
venv/
env/
*.db
credify_dev.db
.pytest_cache/
`,
  },
];

// Routes

// 1. Evaluate Loan
app.post('/api/evaluate', (req, res) => {
  try {
    const appData: LoanApplication = req.body;
    if (!appData.annualIncome || !appData.requestedAmount || !appData.creditScore) {
      return res.status(400).json({ error: 'Missing required financial parameters.' });
    }

    const result = calculateEvaluation(appData);
    evaluationLedger.unshift(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Underwriting evaluation error.' });
  }
});

// 2. Evaluation History
app.get('/api/history', (req, res) => {
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const statusFilter = (req.query.status as string) || 'all';

  let filtered = [...evaluationLedger];

  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.applicantName.toLowerCase().includes(search) ||
        r.email.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search)
    );
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase());
  }

  res.json(filtered);
});

// 3. System Stats
app.get('/api/stats', (req, res) => {
  const total = evaluationLedger.length;
  const approved = evaluationLedger.filter((r) => r.status === 'Approved').length;
  const rejected = evaluationLedger.filter((r) => r.status === 'Rejected').length;
  const borderline = evaluationLedger.filter((r) => r.status === 'Borderline Review').length;

  const totalCapital = evaluationLedger.reduce((sum, r) => sum + r.requestedAmount, 0);
  const avgDti = total > 0 ? Math.round((evaluationLedger.reduce((sum, r) => sum + r.dti, 0) / total) * 10) / 10 : 0;
  const avgScore =
    total > 0 ? Math.round(evaluationLedger.reduce((sum, r) => sum + r.creditScore, 0) / total) : 0;

  const stats: SystemStats = {
    totalEvaluations: total,
    approvedCount: approved,
    rejectedCount: rejected,
    borderlineCount: borderline,
    approvalRate: total > 0 ? Math.round((approved / total) * 1000) / 10 : 0,
    averageDti: avgDti,
    totalRequestedCapital: totalCapital,
    averageCreditScore: avgScore,
  };

  res.json(stats);
});

// 4. Delete Record
app.delete('/api/history/:id', (req, res) => {
  const id = req.params.id;
  const index = evaluationLedger.findIndex((r) => r.id === id);
  if (index !== -1) {
    evaluationLedger.splice(index, 1);
    return res.json({ success: true, message: 'Record deleted.' });
  }
  res.status(404).json({ error: 'Record not found.' });
});

// 5. Auth Endpoints
app.get('/api/auth/me', (req, res) => {
  res.json({ user: currentUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  const found = users.find((u) => u.email === email) || {
    id: `usr-${Date.now()}`,
    name: email.split('@')[0].replace('.', ' '),
    email,
    role: (role as User['role']) || 'Underwriting Officer',
  };
  currentUser = found;
  res.json({ success: true, user: currentUser });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role } = req.body;
  const newUser: User = {
    id: `usr-${Date.now()}`,
    name: name || 'Demo Officer',
    email: email || 'officer@credify.ai',
    role: role || 'Underwriting Officer',
  };
  users.push(newUser);
  currentUser = newUser;
  res.json({ success: true, user: currentUser });
});

// 6. Gemini AI Responsibilities & Regulatory Audit (/api/ai/audit)
app.post('/api/ai/audit', async (req, res) => {
  const { loanId, loanData } = req.body;
  const loan: EvaluationResult = loanData || evaluationLedger.find((r) => r.id === loanId) || evaluationLedger[0];

  if (!loan) {
    return res.status(404).json({ error: 'Loan evaluation record not found.' });
  }

  // Attempt to call Gemini API if key is present
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  let aiSummary = '';

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Senior Fair Lending Compliance Auditor and Model Risk Officer adhering to ECOA (Equal Credit Opportunity Act), Regulation B, and the Fair Credit Reporting Act (FCRA).
Review the following deterministic credit underwriting decision:
- Applicant: ${loan.applicantName}
- Bureau Credit Score: ${loan.creditScore} (Risk Tier: ${loan.riskTier})
- Annual Income: $${loan.annualIncome.toLocaleString()}
- Requested Loan Capital: $${loan.requestedAmount.toLocaleString()} over ${loan.loanTermMonths} months
- Estimated Monthly Payment: $${loan.monthlyPayment.toLocaleString()}
- Post-Obligation DTI: ${loan.dti}% (Cap: ${loan.maxAllowedDti}%)
- Decision Status: ${loan.status}
- Composite Confidence: ${loan.compositeConfidenceScore}%

Provide a concise 3-part audit summary:
1. Compliance Certification (Confirm no prohibited bases: race, color, religion, national origin, sex, marital status, age were considered; only empirical debt-to-income and bureau credit data).
2. Human-In-The-Loop (HITL) Assessment (Explain whether human officer signoff or exception override is indicated).
3. Prescriptive Financial Coaching (Concrete mathematical actions the borrower can take to optimize their credit profile, e.g. exact debt paydown or term adjustment).
Keep response professional, audit-grade, and concise.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      aiSummary = response.text || '';
    } catch (e: any) {
      console.warn('Gemini API call failed or rate-limited; falling back to deterministic audit engine:', e.message);
    }
  }

  // Feature Driver Attributions
  const drivers = [
    {
      feature: 'Debt-to-Income (DTI)',
      weightPercentage: 40,
      impact: loan.dti <= loan.maxAllowedDti ? ('favorable' as const) : ('unfavorable' as const),
      metric: `${loan.dti}% (Tolerance: ${loan.maxAllowedDti}%)`,
      description:
        loan.dti <= loan.maxAllowedDti
          ? 'Calculated debt burden comfortably accommodates proposed installment obligations.'
          : 'High monthly debt service reduces disposable margin for additional borrowing.',
    },
    {
      feature: 'Bureau Credit Score',
      weightPercentage: 60,
      impact: loan.creditScore >= 700 ? ('favorable' as const) : loan.creditScore >= 620 ? ('neutral' as const) : ('unfavorable' as const),
      metric: `${loan.creditScore} / 850`,
      description:
        loan.creditScore >= 700
          ? 'Prime historical repayment track record indicates minimal 30-day default probability.'
          : loan.creditScore >= 620
          ? 'Near-prime standing; acceptable with secondary reserve verification.'
          : 'Subprime tier signals elevated historical delinquency risk.',
    },
    {
      feature: 'Income-to-Loan Ratio',
      weightPercentage: 20,
      impact: loan.requestedAmount / loan.annualIncome <= 0.35 ? ('favorable' as const) : ('neutral' as const),
      metric: `${Math.round((loan.requestedAmount / loan.annualIncome) * 100)}% leverage`,
      description: 'Capital request measured against annual verifiable cash flow.',
    },
  ];

  const requiresHitl = loan.status === 'Borderline Review' || (loan.creditScore < 660 && loan.status === 'Approved');

  const auditReport: AiAuditReport = {
    auditId: `AUDIT-REG-${Date.now().toString(36).toUpperCase()}`,
    loanId: loan.id,
    applicantName: loan.applicantName,
    timestamp: new Date().toISOString(),
    complianceStatus: 'Certified Fair Lending Compliant (ECOA & Regulation B)',
    regulatoryCitation: '12 CFR Part 1002 (Equal Credit Opportunity Act) & 15 U.S.C. § 1681m (FCRA)',
    modelConfidenceTier: loan.compositeConfidenceScore >= 70 ? 'High' : loan.compositeConfidenceScore >= 50 ? 'Moderate' : 'Flagged',
    compositeConfidenceScore: loan.compositeConfidenceScore,
    featureDrivers: drivers,
    adverseActionSummary:
      loan.status === 'Rejected'
        ? `Primary factor: Debt-to-Income ratio (${loan.dti}%) exceeded max cap (${loan.maxAllowedDti}%). Secondary factor: Bureau credit score (${loan.creditScore}).`
        : 'Application meets all prime/near-prime thresholds. No adverse action notice triggered.',
    hitlRouting: {
      required: requiresHitl,
      reason: requiresHitl
        ? 'Application is in the borderline approval envelope (620-660 score or 35-40% DTI). Requires Level II Underwriter dual-authorization.'
        : 'Fully automated algorithmic execution without human exception review needed.',
      reviewStage: requiresHitl ? 'Level II Exception Underwriting Queue' : 'Direct Clearing Path',
      assigneeRole: 'Senior Risk Management Officer',
    },
    financialCoachingRoadmap: [
      `Pay down existing monthly debt by $${Math.max(100, Math.round(loan.existingMonthlyDebt * 0.15))} to drop DTI by ~${Math.round(loan.dti * 0.12)}%.`,
      `Electing a ${Math.min(84, loan.loanTermMonths + 12)}-month amortization term compresses monthly payment to reduce cash-flow pressure.`,
      `Maintain clean on-time payment streaks across all revolving trade lines for 90 days to lift bureau score by ~25-40 points.`,
    ],
    nonDiscriminationAttestation:
      'Attestation: The underwriting model operates solely on empirical credit bureau inputs, debt obligations, and verifiable income figures. No demographic, geographical, or protected personal characteristics are collected or modeled.',
  };

  if (aiSummary) {
    auditReport.adverseActionSummary = aiSummary;
  }

  // Mark loan as audited
  const targetIndex = evaluationLedger.findIndex((r) => r.id === loan.id);
  if (targetIndex !== -1) {
    evaluationLedger[targetIndex].auditedByAi = true;
  }

  res.json(auditReport);
});

// 7. Flask Code Files Blueprint Inspector
app.get('/api/code/files', (req, res) => {
  res.json(flaskCodeFiles);
});

// Vite Server Setup / Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Credify AI Full-Stack Server active on http://localhost:${PORT}`);
  });
}

startServer();
