import type { ExternalAiHandoff } from './handoff';
import type { CandidatePackage } from './candidate';
import type { ComplianceReview } from './compliance';
import type { CorrectionPackage } from './corrections';
import type { IntegrationPlanRecord } from './integration';
import type { EvidencePackage } from './evidence';
import type { CertificationPackage } from './certification';

/**
 * AGENT G gate variant: verifies the candidate package itself carries
 * the guiApproved flag, which Agent G sets by copying the handoff approval.
 * This is the runtime-checkable form of the GUI approval gate.
 */
export function assertCandidateGuiApproved(candidate: CandidatePackage): void {
  if (!candidate.guiApproved) {
    throw new Error(
      `Candidate ${candidate.candidateId} does not carry GUI approval. ` +
      'Agent G must only produce a CandidatePackage when guiApproval.decision === APPROVED on the handoff record.',
    );
  }
}

export type ProjectLlmWorkflowState =
  | 'REQUESTED'
  | 'BRIEF_READY'
  | 'HANDOFF_READY'
  | 'AWAITING_GUI_APPROVAL'
  | 'GUI_APPROVED'
  | 'CANDIDATE_READY'
  | 'COMPLIANCE_REVIEW'
  | 'COMPLIANCE_FAILED'
  | 'CORRECTION_REQUIRED'
  | 'COMPLIANCE_PASSED'
  | 'INTEGRATION_PLANNED'
  | 'AWAITING_IMPLEMENTATION_APPROVAL'
  | 'IMPLEMENTATION_APPROVED'
  | 'IMPLEMENTED'
  | 'VALIDATION_IN_PROGRESS'
  | 'VALIDATION_FAILED'
  | 'CERTIFICATION_READY'
  | 'CERTIFIED'
  | 'REJECTED'
  | 'STOPPED';

export type StopReason =
  | 'GUI_NOT_APPROVED'
  | 'MISSING_ARTIFACT'
  | 'COMPLIANCE_FAILURE'
  | 'ARCHITECTURE_CHANGE_REQUESTED'
  | 'UNAUTHORIZED_MUTATION'
  | 'MISSING_EVIDENCE'
  | 'SECURITY_FAILURE'
  | 'HAA_STOP'
  | 'UNKNOWN_REQUIREMENT';

/** Terminal states where the workflow cannot proceed further. */
export const TERMINAL_STATES: ReadonlySet<ProjectLlmWorkflowState> = new Set([
  'CERTIFIED',
  'REJECTED',
  'STOPPED',
]);

/** Authority-required states where the workflow must pause and wait for a human or HAA decision. */
export const AUTHORITY_REQUIRED_STATES: ReadonlySet<ProjectLlmWorkflowState> = new Set([
  'AWAITING_GUI_APPROVAL',
  'AWAITING_IMPLEMENTATION_APPROVAL',
  'CERTIFICATION_READY',
]);

/**
 * Allowed state transitions for the Project LLM workflow state machine.
 * Only transitions listed here are valid; any other transition is a governance violation.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<ProjectLlmWorkflowState, readonly ProjectLlmWorkflowState[]>> = {
  REQUESTED: ['BRIEF_READY'],
  BRIEF_READY: ['HANDOFF_READY'],
  HANDOFF_READY: ['AWAITING_GUI_APPROVAL'],
  AWAITING_GUI_APPROVAL: ['GUI_APPROVED', 'STOPPED'],
  GUI_APPROVED: ['CANDIDATE_READY'],
  CANDIDATE_READY: ['COMPLIANCE_REVIEW'],
  COMPLIANCE_REVIEW: ['COMPLIANCE_PASSED', 'COMPLIANCE_FAILED'],
  COMPLIANCE_FAILED: ['CORRECTION_REQUIRED', 'STOPPED'],
  CORRECTION_REQUIRED: ['CANDIDATE_READY'],
  COMPLIANCE_PASSED: ['INTEGRATION_PLANNED'],
  INTEGRATION_PLANNED: ['AWAITING_IMPLEMENTATION_APPROVAL'],
  AWAITING_IMPLEMENTATION_APPROVAL: ['IMPLEMENTATION_APPROVED', 'STOPPED'],
  IMPLEMENTATION_APPROVED: ['IMPLEMENTED'],
  IMPLEMENTED: ['VALIDATION_IN_PROGRESS'],
  VALIDATION_IN_PROGRESS: ['CERTIFICATION_READY', 'VALIDATION_FAILED'],
  VALIDATION_FAILED: ['CORRECTION_REQUIRED', 'STOPPED'],
  CERTIFICATION_READY: ['CERTIFIED', 'REJECTED', 'STOPPED'],
  // Terminal states have no outgoing transitions
  CERTIFIED: [],
  REJECTED: [],
  STOPPED: [],
} as const;

/**
 * Standard result type returned by every agent in the F→M pipeline.
 * The workflow orchestrator reads requiresHumanAction to decide whether to
 * continue autonomously or pause and wait for a USER or HAA decision.
 */
export interface AgentExecutionResult<T> {
  /** Which agent produced this result (e.g. 'AGENT_F', 'AGENT_H'). */
  agent: string;
  /** Whether the agent completed its bounded work successfully. */
  success: boolean;
  /** The state the workflow should transition to. Null if the agent failed without a valid next state. */
  nextState: ProjectLlmWorkflowState | null;
  /** The primary artifact produced by this agent run. */
  artifact?: T;
  /** Non-blocking observations from the agent. */
  findings?: string[];
  /** Issues that prevent progression (used when success = false). */
  blockers?: string[];
  /** Evidence items collected or referenced during this agent run. */
  evidence?: string[];
  /**
   * When true, the orchestrator MUST pause the workflow and surface humanAction
   * to the user or HAA. The AI must not invent an approval or continue past this point.
   */
  requiresHumanAction: boolean;
  /** Present when requiresHumanAction is true. Describes what authority is needed. */
  humanAction?: {
    reason: string;
    /** USER = standard human; HAA = only the Human Authority Agent may act. */
    requiredAuthority: 'USER' | 'HAA';
  };
}

/**
 * Complete workflow state for one Project LLM request.
 * All artifact slots are optional because they are populated incrementally.
 */
export interface ProjectLlmWorkflow {
  workflowId: string;
  requestId: string;
  state: ProjectLlmWorkflowState;
  artifacts: {
    handoffRecord?: ExternalAiHandoff;
    candidatePackage?: CandidatePackage;
    complianceReview?: ComplianceReview;
    correctionPackage?: CorrectionPackage;
    integrationPlan?: IntegrationPlanRecord;
    evidencePackage?: EvidencePackage;
    certificationPackage?: CertificationPackage;
  };
  /** How many correction loops have been executed (prevents infinite loops). */
  correctionLoopCount: number;
  stopReason?: StopReason;
  metadata: {
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
  };
}

export interface ProjectLlmWorkflowResult {
  status: 'COMPLETE' | 'WAITING' | 'STOPPED';
  workflow: ProjectLlmWorkflow;
  reason?: string;
}
