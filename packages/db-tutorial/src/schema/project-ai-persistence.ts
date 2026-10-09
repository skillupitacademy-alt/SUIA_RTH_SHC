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

import { pgTable, uuid, text, varchar, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Project AI Workflows
 * Stores ProjectLLMWorkflow lifecycle state, artifact bindings, and approval tracking
 */
export const projectAiWorkflows = pgTable('project_ai_workflows', {
  // Primary Key
  workflowId: uuid('workflow_id').primaryKey().defaultRandom(),
  
  // Target Specification
  specificationId: uuid('specification_id').notNull(),
  targetFamily: varchar('target_family', { length: 100 }).notNull(),
  targetVersion: varchar('target_version', { length: 100 }).notNull(),
  requesterId: varchar('requester_id', { length: 255 }).notNull(),
  
  // Lifecycle State
  currentState: varchar('current_state', { length: 100 }).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  
  // Artifact Bindings (hash-bound for security)
  contractId: uuid('contract_id'),
  contractSha256: varchar('contract_sha256', { length: 64 }),
  
  candidateId: uuid('candidate_id'),
  candidateSha256: varchar('candidate_sha256', { length: 64 }),
  
  manifestId: uuid('manifest_id'),
  manifestSha256: varchar('manifest_sha256', { length: 64 }),
  
  snapshotId: uuid('snapshot_id'),
  snapshotSha256: varchar('snapshot_sha256', { length: 64 }),
  
  // Approval Tracking
  approvalId: uuid('approval_id'),
  gateResults: jsonb('gate_results').$type<Record<string, any>>().notNull().default({}),
  
  // Evidence
  evidenceIds: jsonb('evidence_ids').$type<string[]>().notNull().default([]),
  
  // Terminal Status
  finalStatus: varchar('final_status', { length: 50 }),
  
  // Optimistic Locking
  version: integer('version').notNull().default(1),
  
  // Idempotency Support
  idempotencyKey: varchar('idempotency_key', { length: 255 }),
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
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  
  // Foreign Key to Workflow
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => projectAiWorkflows.workflowId, { 
      onDelete: 'cascade',
      // Explicit constraint name to match SQLAlchemy convention
      name: 'fk_state_transitions_workflow_id'
    }),
  
  // Transition Details
  fromState: varchar('from_state', { length: 100 }),
  toState: varchar('to_state', { length: 100 }).notNull(),
  timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
  triggeredBy: varchar('triggered_by', { length: 255 }).notNull(),
  
  // Evidence
  evidenceId: uuid('evidence_id'),
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
  contractId: uuid('contract_id').primaryKey().defaultRandom(),
  
  // Foreign Key to Workflow (1:1)
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => projectAiWorkflows.workflowId, { 
      onDelete: 'cascade',
      name: 'fk_contracts_workflow_id'
    }),
  
  // Immutability Verification
  contractHash: varchar('contract_hash', { length: 64 }).notNull(),
  
  // Contract Data (JSONB for flexibility)
  contractData: jsonb('contract_data').$type<Record<string, any>>().notNull(),
  
  // Metadata
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  contractVersion: varchar('contract_version', { length: 50 }).notNull().default('1.0'),
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
  candidateId: uuid('candidate_id').primaryKey().defaultRandom(),
  
  // Foreign Key to Workflow (optional - candidate may exist before workflow binding)
  workflowId: uuid('workflow_id')
    .references(() => projectAiWorkflows.workflowId, { 
      onDelete: 'set null',
      name: 'fk_candidates_workflow_id'
    }),
  
  // Files (JSONB array of CandidateFile objects)
  files: jsonb('files').$type<Array<{
    path: string;
    content: string;
    language?: string;
  }>>().notNull(),
  
  // Metadata
  uploadedAt: timestamp('uploaded_at', { mode: 'date' }).notNull().defaultNow(),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
  
  // Workflow Target Binding
  targetFamily: varchar('target_family', { length: 100 }),
  targetVersion: varchar('target_version', { length: 100 }),
  
  // Candidate Hash (computed from files)
  candidateSha256: varchar('candidate_sha256', { length: 64 }),
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
  manifestId: uuid('manifest_id').primaryKey().defaultRandom(),
  
  // Foreign Key to Candidate
  candidateId: uuid('candidate_id')
    .notNull()
    .references(() => projectAiCandidates.candidateId, { 
      onDelete: 'cascade',
      name: 'fk_manifests_candidate_id'
    }),
  
  // Immutability Verification
  manifestHash: varchar('manifest_hash', { length: 64 }).notNull(),
  
  // Placement Decision
  decision: varchar('decision', { length: 50 }).notNull(),
  targetPath: varchar('target_path', { length: 500 }).notNull(),
  blockFamily: varchar('block_family', { length: 100 }).notNull(),
  blockVersion: varchar('block_version', { length: 100 }).notNull(),
  
  // Required Changes and Evidence
  requiredChanges: jsonb('required_changes').$type<Array<any>>().notNull().default([]),
  evidenceIds: jsonb('evidence_ids').$type<Array<string>>().notNull().default([]),
  
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
  approvalId: uuid('approval_id').primaryKey().defaultRandom(),
  
  // Foreign Key to Workflow (1:1)
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => projectAiWorkflows.workflowId, { 
      onDelete: 'cascade',
      name: 'fk_approvals_workflow_id'
    }),
  
  // Hash Bindings
  candidateSha256: varchar('candidate_sha256', { length: 64 }).notNull(),
  placementManifestId: uuid('placement_manifest_id').notNull(),
  placementManifestSha256: varchar('placement_manifest_sha256', { length: 64 }).notNull(),
  
  // Target Specification
  targetFamily: varchar('target_family', { length: 100 }).notNull(),
  targetVersion: varchar('target_version', { length: 100 }).notNull(),
  
  // Approval Tracking
  approvedBy: varchar('approved_by', { length: 255 }).notNull(),
  approvalTimestamp: timestamp('approval_timestamp', { mode: 'date' }).notNull().defaultNow(),
  status: varchar('status', { length: 50 }).notNull(),
  
  // Self-Approval Prevention
  workflowRequester: varchar('workflow_requester', { length: 255 }),
  
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
