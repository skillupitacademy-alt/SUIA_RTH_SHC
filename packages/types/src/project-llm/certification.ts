export type HaaDecision =
  | 'APPROVE'
  | 'APPROVE_WITH_CONDITIONS'
  | 'REJECT'
  | 'CORRECT_AND_RESUBMIT'
  | 'STOP';

export interface CertificationPackage {
  certificationPackageId: string;
  requestId: string;
  candidateId: string;
  complianceReviewId: string;
  correctionPackageIds: string[];
  integrationPlanId: string;
  evidencePackageId: string;
  summary: {
    request: string;
    candidate: string;
    compliance: string;
    corrections: string;
    integration: string;
    evidence: string;
  };
  projectLlmStatus: 'NOT_READY' | 'CERTIFICATION_READY';
  haaDecision?: HaaDecision;
  haaDecisionAt?: string;
  createdAt: string;
}
