/**
 * Project LLM Compliance Review
 * 
 * Contracts for compliance checking, findings, corrections, and integration planning.
 */

export type ComplianceCheckTarget =
  | 'UBRC'
  | 'TUTORIAL_COMPOSER'
  | 'TUTORIAL_DOCUMENT'
  | 'TUTORIAL_PAGE_RUNTIME'
  | 'ILS_PARTICIPATION'
  | 'LSNB_NAVIGATION'
  | 'RSSB_RUNTIME'
  | 'SKILLUP_THEME'
  | 'RTH_THEME';

export type ComplianceFindingSeverity = 'BLOCKING' | 'WARNING' | 'INFO';

export interface ComplianceFinding {
  target: ComplianceCheckTarget;
  severity: ComplianceFindingSeverity;
  code: string;
  description: string;
  location?: string; // file path or JSX selector
  correctionInstructions?: string;
}

export type ComplianceVerdict = 'PASS' | 'FAIL' | 'PASS_WITH_WARNINGS' | 'PENDING';

export interface ComplianceReviewRecord {
  requestId: string;
  reviewedAt: string;
  verdict: ComplianceVerdict;
  findings: ComplianceFinding[];
  evidencePaths: string[];
}

export interface CorrectionInstruction {
  findingCode: string;
  instructionText: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  automatable: boolean;
}

export interface IntegrationPlan {
  requestId: string;
  targetFiles: string[];
  steps: IntegrationStep[];
  validationCriteria: string[];
}

export interface IntegrationStep {
  order: number;
  description: string;
  targetFile?: string;
  automatable: boolean;
  completed: boolean;
}

export type ComplianceResult = 'PASS' | 'FAIL' | 'WARNING' | 'UNKNOWN';
export type ComplianceCategory =
  | 'ARCHITECTURE'
  | 'FAMILY_VERSION'
  | 'COMPOSER'
  | 'TUTORIAL_DOCUMENT'
  | 'TUTORIAL_RENDERER'
  | 'UBRC'
  | 'ILS'
  | 'LSNB'
  | 'RSSB'
  | 'THEME'
  | 'SECURITY'
  | 'ACCESSIBILITY'
  | 'TESTING'
  | 'EVIDENCE';

export interface ComplianceFindingDetail {
  findingId: string;
  category: ComplianceCategory;
  result: ComplianceResult;
  ruleId: string;
  message: string;
  artifactPath?: string;
  evidence?: string[];
  remediation?: string;
}

export interface ComplianceReview {
  reviewId: string;
  candidateId: string;
  targetFamilyId: string;
  targetVersionId: string;
  findings: ComplianceFindingDetail[];
  overallResult: ComplianceResult;
  reviewedAt: string;
  reviewer: 'PROJECT_LLM';
}
