export interface LoanApplication {
  id?: string;
  applicantName: string;
  email: string;
  annualIncome: number;
  requestedAmount: number;
  creditScore: number;
  existingMonthlyDebt: number;
  loanTermMonths: number;
  employmentStatus: 'Salaried' | 'Self-Employed' | 'Contractor' | 'Business Owner';
  loanPurpose: 'Debt Consolidation' | 'Home Improvement' | 'Business Expansion' | 'Vehicle' | 'Personal';
}

export interface DecisionFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  detail: string;
}

export interface EvaluationResult {
  id: string;
  timestamp: string;
  applicantName: string;
  email: string;
  annualIncome: number;
  requestedAmount: number;
  creditScore: number;
  existingMonthlyDebt: number;
  loanTermMonths: number;
  employmentStatus: string;
  loanPurpose: string;
  monthlyPayment: number;
  interestRate: number;
  dti: number;
  maxAllowedDti: number;
  status: 'Approved' | 'Rejected' | 'Borderline Review';
  creditScoreContribution: number;
  dtiContribution: number;
  compositeConfidenceScore: number;
  riskTier: 'Super Prime' | 'Prime' | 'Near Prime' | 'Subprime' | 'Deep Subprime';
  decisionFactors: DecisionFactor[];
  recommendations: string[];
  adverseReasons?: string[];
  auditedByAi?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Underwriting Officer' | 'Risk Analyst' | 'Loan Applicant';
  avatar?: string;
}

export interface FeatureDriver {
  feature: string;
  weightPercentage: number;
  impact: 'favorable' | 'unfavorable' | 'neutral';
  metric: string;
  description: string;
}

export interface AiAuditReport {
  auditId: string;
  loanId: string;
  applicantName: string;
  timestamp: string;
  complianceStatus: string;
  regulatoryCitation: string;
  modelConfidenceTier: 'High' | 'Moderate' | 'Flagged';
  compositeConfidenceScore: number;
  featureDrivers: FeatureDriver[];
  adverseActionSummary: string;
  hitlRouting: {
    required: boolean;
    reason: string;
    reviewStage: string;
    assigneeRole: string;
  };
  financialCoachingRoadmap: string[];
  nonDiscriminationAttestation: string;
}

export interface SystemStats {
  totalEvaluations: number;
  approvedCount: number;
  rejectedCount: number;
  borderlineCount: number;
  approvalRate: number;
  averageDti: number;
  totalRequestedCapital: number;
  averageCreditScore: number;
}

export interface FlaskCodeFile {
  path: string;
  title: string;
  category: string;
  description: string;
  content: string;
}
