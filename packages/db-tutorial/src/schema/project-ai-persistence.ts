/* istanbul ignore file */
/**
 * Project AI Persistence - Durable State for M2.9 R3
 * 
 * Architecture Rules:
 * - All tables use project_ai_* namespace in tutorial_prod database
 * - Drizzle is the ONLY migration authority (NO Alembic)
 * - Python SQLAlchemy models are read-only ORM mappings
 * - Schema changes ONLY through Drizzle migrations
 */

import { pgTable, uuid, text, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Project AI Workflows
 * Stores ProjectLLMWorkflow lifecycle state, artifact bindings, and approval tracking
 */
export const projectAiWorkflows = pgTable('project_ai_workflows', {
  // Primary Key
  workflowId: text('workflow_id').primaryKey(),
  
  // Target Specification
  specificationId: text('specification_id').notNull(),
  targetFamily: text('target_family').notNull(),
  targetVersion: text('target_version').notNull(),
  requesterId: text('requester_id').notNull(),
  
  // Lifecycle State
  currentState: text('current_state').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  
  // Artifact Bindings (hash-bound for security)
  contractId: text('contract_id'),
  contractSha256: text('contract_sha256'),
  
  candidateId: text('candidate_id'),
  candidateSha256: text('candidate_sha256'),
  
  manifestId: text('manifest_id'),
  manifestSha256: text('manifest_sha256'),
  
  snapshotId: text('snapshot_id'),
  snapshotSha256: text('snapshot_sha256'),
  
  // Approval Tracking
  approvalId: text('approval_id'),
  gateResults: jsonb('gate_results').$type<Record<string, any>>().notNull().default({}),
  
  // Evidence
  evidenceIds: jsonb('evidence_ids').$type<string[]>().notNull().default([]),
  
  // Terminal Status
  finalStatus: text('final_status'),
  
  // Optimistic Locking
  version: integer('version').notNull().default(1),
  
  // Idempotency Support
  idempotencyKey: text('idempotency_key'),
}, (table) => ({
  // Indexes for common queries
  idxWorkflowState: index('idx_workflow_state').on(table.currentState),
  idxWorkflowRequester: index('idx_workflow_requester').on(table.requesterId),
  idxWorkflowTarget: index('idx_workflow_target').on(table.targetFamily, table.targetVersion),
  idxWorkflowContractSha: index('idx_workflow_contract_sha').on(table.contractSha256),
  idxWorkflowCandidateSha: index('idx_workflow_candidate_sha').on(table.candidateSha256),
  idxWorkflowManifestSha: index('idx_workflow_manifest_sha').on(table.manifestSha256),
  idxWorkflowCreatedAt: index('idx_workflow_created_at').on(table.createdAt),
  
  // Unique constraint on idempotency key
  uniqWorkflowIdempotency: uniqueIndex('uniq_workflow_idempotency').on(table.idempotencyKey),
}));

/**
 * Project AI State Transitions
 * Records workflow state transition history for audit trail
 */
export const projectAiStateTransitions = pgTable('project_ai_state_transitions', {
  // Primary Key
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  
  // Foreign Key to Workflow
  workflowId: text('workflow_id')
    .notNull()
    .references(() => projectAiWorkflows.workflowId, { onDelete: 'cascade' }),
  
  // Transition Details
  fromState: text('from_state'),
  toState: text('to_state').notNull(),
  timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
  triggeredBy: text('triggered_by').notNull(),
  
  // Evidence
  evidenceId: text('evidence_id'),
  reason: text('reason'),
}, (table) => ({
  // Indexes for audit queries
  idxTransitionWorkflow: index('idx_transition_workflow').on(table.workflowId),
  idxTransitionTimestamp: index('idx_transition_timestamp').on(table.timestamp),
}));

/**
 * Project AI Contracts
 * Stores immutable engineering contracts for workflows (1:1 with workflow)
 */
export const projectAiContracts = pgTable('project_ai_contracts', {
  // Primary Key
  contractId: text('contract_id').primaryKey(),
  
  // Foreign Key to Workflow (1:1)
  workflowId: text('workflow_id')
    .notNull()
    .references(() => projectAiWorkflows.workflowId, { onDelete: 'cascade' }),
  
  // Immutability Verification
  contractHash: text('contract_hash').notNull(),
  
  // Contract Data (JSONB for flexibility)
  contractData: jsonb('contract_data').$type<Record<string, any>>().notNull(),
  
  // Metadata
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  contractVersion: text('contract_version').notNull().default('1.0'),
}, (table) => ({
  // Indexes for contract queries
  idxContractWorkflow: index('idx_contract_workflow').on(table.workflowId),
  idxContractHash: index('idx_contract_hash').on(table.contractHash),
  
  // Unique constraints
  uniqContractWorkflow: uniqueIndex('uniq_contract_workflow').on(table.workflowId),
  uniqContractHash: uniqueIndex('uniq_contract_hash').on(table.contractHash),
}));

/**
 * Project AI Candidates
 * Stores candidate block packages for evaluation and placement
 */
export const projectAiCandidates = pgTable('project_ai_candidates', {
  // Primary Key
  candidateId: text('candidate_id').primaryKey(),
  
  // Foreign Key to Workflow (optional - candidate may exist before workflow binding)
  workflowId: text('workflow_id')
    .references(() => projectAiWorkflows.workflowId, { onDelete: 'set null' }),
  
  // Files (JSONB array of CandidateFile objects)
  files: jsonb('files').$type<Array<{
    path: string;
    content: string;
    language?: string;
  }>>().notNull(),
  
  // Metadata
  uploadedAt: timestamp('uploaded_at', { mode: 'date' }).notNull().defaultNow(),
  uploadedBy: text('uploaded_by').notNull(),
  
  // Workflow Target Binding
  targetFamily: text('target_family'),
  targetVersion: text('target_version'),
  
  // Candidate Hash (computed from files)
  candidateSha256: text('candidate_sha256'),
}, (table) => ({
  // Indexes for candidate queries
  idxCandidateWorkflow: index('idx_candidate_workflow').on(table.workflowId),
  idxCandidateUploadedAt: index('idx_candidate_uploaded_at').on(table.uploadedAt),
  idxCandidateSha256: index('idx_candidate_sha256').on(table.candidateSha256),
}));

/**
 * Project AI Manifests
 * Stores placement decisions and integration instructions for candidates
 */
export const projectAiManifests = pgTable('project_ai_manifests', {
  // Primary Key
  manifestId: text('manifest_id').primaryKey(),
  
  // Foreign Key to Candidate
  candidateId: text('candidate_id')
    .notNull()
    .references(() => projectAiCandidates.candidateId, { onDelete: 'cascade' }),
  
  // Immutability Verification
  manifestHash: text('manifest_hash').notNull(),
  
  // Placement Decision
  decision: text('decision').notNull(),
  targetPath: text('target_path').notNull(),
  blockFamily: text('block_family').notNull(),
  blockVersion: text('block_version').notNull(),
  
  // Required Changes and Evidence
  requiredChanges: jsonb('required_changes').$type<Array<any>>().notNull().default([]),
  evidenceIds: jsonb('evidence_ids').$type<string[]>().notNull().default([]),
  
  // Metadata
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Indexes for manifest queries
  idxManifestCandidate: index('idx_manifest_candidate').on(table.candidateId),
  idxManifestHash: index('idx_manifest_hash').on(table.manifestHash),
  idxManifestDecision: index('idx_manifest_decision').on(table.decision),
  
  // Unique constraint on hash
  uniqManifestHash: uniqueIndex('uniq_manifest_hash').on(table.manifestHash),
}));

/**
 * Project AI Approvals
 * Stores hash-bound implementation approval records (1:1 with workflow)
 */
export const projectAiApprovals = pgTable('project_ai_approvals', {
  // Primary Key
  approvalId: text('approval_id').primaryKey(),
  
  // Foreign Key to Workflow (1:1)
  workflowId: text('workflow_id')
    .notNull()
    .references(() => projectAiWorkflows.workflowId, { onDelete: 'cascade' }),
  
  // Hash Bindings
  candidateSha256: text('candidate_sha256').notNull(),
  placementManifestId: text('placement_manifest_id').notNull(),
  placementManifestSha256: text('placement_manifest_sha256').notNull(),
  
  // Target Specification
  targetFamily: text('target_family').notNull(),
  targetVersion: text('target_version').notNull(),
  
  // Approval Tracking
  approvedBy: text('approved_by').notNull(),
  approvalTimestamp: timestamp('approval_timestamp', { mode: 'date' }).notNull().defaultNow(),
  status: text('status').notNull(),
  
  // Self-Approval Prevention
  workflowRequester: text('workflow_requester'),
  
  // Evidence and Rejection Reason
  evidence: jsonb('evidence').$type<Record<string, any>>().notNull().default({}),
  rejectionReason: text('rejection_reason'),
}, (table) => ({
  // Indexes for approval queries
  idxApprovalWorkflow: index('idx_approval_workflow').on(table.workflowId),
  idxApprovalStatus: index('idx_approval_status').on(table.status),
  idxApprovalCandidateSha: index('idx_approval_candidate_sha').on(table.candidateSha256),
  idxApprovalManifestSha: index('idx_approval_manifest_sha').on(table.placementManifestSha256),
  
  // Unique constraint on workflow (1:1)
  uniqApprovalWorkflow: uniqueIndex('uniq_approval_workflow').on(table.workflowId),
}));
