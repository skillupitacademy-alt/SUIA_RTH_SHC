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
  targetFamily?: string;
  targetVersion?: string;
  candidateId?: string;
  manifestId?: string;
  rawGateResults?: Record<string, any>;
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

export type PlacementFileOperation = {
  action: 'CREATE' | 'PATCH_RENDERER' | 'PATCH_REGISTRY' | 'PATCH_TYPES' | 'SKIP';
  source_filename: string;
  source_sha256: string;
  target_path: string;
  expected_pre_hash?: string | null;
  patch_strategy?: string | null;
  description: string;
};

export type PlacementManifest = {
  manifestId: string;
  candidateId: string;
  decision: 'ADD' | 'UPDATE' | 'EXTEND' | 'REUSE' | 'REJECT';
  targetPath: string;
  blockFamily: string;
  blockVersion: string;
  requiredChanges: string[];
  fileOperations?: PlacementFileOperation[];
  evidenceIds: string[];
  manifestHash: string;
  createdAt: string;
};

export type PlacementExecutionResult = {
  status: string;
  action: string;
  targetPath: string;
  branch?: string;
  commit?: string;
  [key: string]: unknown;
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
