/**
 * TypeScript types mirroring Python CanonicalWorkflowState and related models.
 * 
 * Source of truth: services/project-ai/app/orchestration/canonical_workflow.py
 * DO NOT diverge from backend enum values.
 * 
 * Last synchronized: M2.9 Wave 2 R4
 */

export enum CanonicalWorkflowStateEnum {
  REQUESTED = 'REQUESTED',
  DISCOVERY = 'DISCOVERY',
  BRIEF_READY = 'BRIEF_READY',
  AWAITING_GATE_1 = 'AWAITING_GATE_1',
  GUI_APPROVED = 'GUI_APPROVED',
  CANDIDATE_REQUESTED = 'CANDIDATE_REQUESTED',
  CANDIDATE_RECEIVED = 'CANDIDATE_RECEIVED',
  CANDIDATE_AUDIT = 'CANDIDATE_AUDIT',
  INTEGRATION_PLANNED = 'INTEGRATION_PLANNED',
  AWAITING_IMPLEMENTATION_APPROVAL = 'AWAITING_IMPLEMENTATION_APPROVAL',
  IMPLEMENTING = 'IMPLEMENTING',
  IMPLEMENTED = 'IMPLEMENTED',
  VERIFYING = 'VERIFYING',
  CERTIFICATION_READY = 'CERTIFICATION_READY',
  AWAITING_GATE_2 = 'AWAITING_GATE_2',
  CERTIFIED = 'CERTIFIED',
  REJECTED = 'REJECTED',
}

export type CertificationGateResult = {
  gate: string;
  result: 'PASS' | 'FAIL' | 'SKIPPED' | 'PENDING';
  detail?: string;
};

export type CertificationStatus = {
  workflowId: string;
  state: CanonicalWorkflowStateEnum;
  gates: CertificationGateResult[];
  certifiedAt?: string;
};

export type RuntimeHealthStatus = {
  workflowId: string;
  healthy: boolean;
  processStatus: string;
  lastChecked: string;
};

export type BrowserVerificationStatus = {
  workflowId: string;
  result: 'PASS' | 'FAIL' | 'SKIPPED';
  detail?: string;
};

export type CandidateResponse = {
  candidateId: string;
  status: string;
};

export type ApprovalResponse = {
  approved: boolean;
  workflowId: string;
};

export type RuntimeVerificationResponse = {
  triggered: boolean;
  workflowId: string;
};

export type CanonicalWorkflowState = {
  workflowId: string;
  state: CanonicalWorkflowStateEnum;
  certification?: CertificationStatus;
  runtimeHealth?: RuntimeHealthStatus;
  browserVerification?: BrowserVerificationStatus;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    completedAt?: string;
  };
};
