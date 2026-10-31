import type { CanonicalWorkflowStateEnum } from './canonicalWorkflowState';

export interface EngineeringContract extends Record<string, unknown> {
  contract_hash?: string;
  target?: { family?: string; version?: string };
  target_family?: string;
  target_version?: string;
}

export interface ViewportVerification {
  width: number;
  passed?: boolean;
  block_found?: boolean;
  document_overflow_x?: boolean;
  block_overflow_x?: boolean;
  child_boundary_overflow?: boolean;
  overflowing_children_count?: number;
}

interface ModalityVerification {
  status?: string;
  details?: string;
  focusable_count?: number;
  preserved_surfaces?: number;
  total_surfaces?: number;
  viewports_tested?: ViewportVerification[];
}

export interface VerificationEvidence {
  accessibility?: { passed?: boolean; violations_count?: number; passes_count?: number };
  modality_checks?: {
    keyboard_navigation?: ModalityVerification;
    reduced_motion?: ModalityVerification;
    forced_colors?: ModalityVerification;
    responsive_viewports?: ModalityVerification;
  };
  dropdown_registered?: boolean;
  rendered_dom?: boolean;
  port?: number;
  screenshot_path?: string;
  screenshot_sha256?: string;
  navigationApi?: { status?: string };
  blockRender?: { status?: string; selector?: string };
  lsnb?: { status?: string };
  rssb?: { status?: string };
  identityMode?: string;
  identityHash?: string;
  verifiedCommit?: string;
  verifiedAt?: string;
}

export interface BackendGateResult {
  status?: string;
  verdict?: string;
  result?: string;
  detail?: string;
  reason?: string;
  message?: string;
  commit?: string;
  branch?: string;
  verified_commit?: string;
  evidence_id?: string;
  evidenceId?: string;
  evidence_ids?: string[];
  evidence_hash?: string;
  evidenceHash?: string;
  candidate_sha256?: string;
  timestamp?: string;
  created_at?: string;
  total_tests?: number;
  totalTests?: number;
  passed_tests?: number;
  passedTests?: number;
  findings?: string[];
  blockers?: string[];
  runner_metadata?: VerificationEvidence;
  evidence_payload?: VerificationEvidence;
  screenshot_sha256?: string;
  accessibility?: VerificationEvidence['accessibility'];
  modality_checks?: VerificationEvidence['modality_checks'];
}

export interface BackendGateResults {
  [key: string]: BackendGateResult | string | undefined;
  composer?: BackendGateResult;
  learner_runtime?: BackendGateResult;
}

interface BackendArtifact {
  id?: string;
  artifact_id?: string;
  sha256?: string;
}

export interface WorkflowApiResponse {
  workflow_id?: string;
  workflowId?: string;
  gate_results?: BackendGateResults;
  state?: { current?: CanonicalWorkflowStateEnum; current_state?: CanonicalWorkflowStateEnum };
  current_state?: CanonicalWorkflowStateEnum;
  updated_at?: string;
  target?: { family?: string; version?: string };
  artifacts?: { candidate?: BackendArtifact; manifest?: BackendArtifact; contract?: BackendArtifact };
  candidate_sha256?: string;
  manifest_sha256?: string;
  contract_sha256?: string;
  final_status?: string;
}
