/**
 * Project LLM Request Lifecycle
 * 
 * Contracts for block creation requests and HAA approval workflow.
 */

import { ProjectLlmLifecycleStatus } from './lifecycle';

export type ProjectLlmRequestStatus =
  | 'DRAFT'
  | 'BRIEF_GENERATED'
  | 'EXTERNAL_AI_HANDOFF'
  | 'PROTOTYPE_RECEIVED'
  | 'CANDIDATE_RECEIVED'
  | 'COMPLIANCE_REVIEW'
  | 'CORRECTION_IN_PROGRESS'
  | 'INTEGRATION_PLANNED'
  | 'VALIDATED'
  | 'CERTIFIED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface ProjectLlmBlockRequest {
  id: string;
  /** Target block family ID, e.g. "I", "O" */
  targetFamilyId: string;
  /** Target version ID, e.g. "I2" */
  targetVersionId: string;
  requestStatus: ProjectLlmRequestStatus;
  /** Lifecycle status of the block being created */
  blockLifecycleStatus: ProjectLlmLifecycleStatus;
  createdAt: string; // ISO 8601
  updatedAt: string;
  /** Reference to the creation brief (if generated) */
  briefRef?: string;
  /** Reference to received candidate (if any) */
  candidateRef?: string;
  /** HAA approval state */
  haaApprovalStatus: HaaApprovalStatus;
}

export type HaaApprovalStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'APPROVED_WITH_CONDITIONS'
  | 'REJECTED'
  | 'NOT_REQUIRED';

export interface HaaApprovalRecord {
  requestId: string;
  status: HaaApprovalStatus;
  reviewedAt?: string;
  conditions?: string[];
  approvedBy?: string;
  notes?: string;
}
