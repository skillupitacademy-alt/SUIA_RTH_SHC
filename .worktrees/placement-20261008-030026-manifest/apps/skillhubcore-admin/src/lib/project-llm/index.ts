/**
 * Project LLM Frontend Integration
 * 
 * CLASSIFICATION: CLIENT_SIDE_HELPERS
 * DISPOSITION: Types-only module; state authority is backend CanonicalWorkflowState
 * 
 * The previous projectLlmWorkflowCoordinator.ts was classified as COMPETING_STATE_AUTHORITY
 * and has been RETIRED. This module now provides only:
 * 
 * - TypeScript types mirroring backend enums/models
 * - API client for backend communication
 * - React hooks for state fetching
 * - UI components for certification and verification
 * - Creation brief generators and repository intelligence helpers
 * 
 * CRITICAL RULES:
 * 1. State authority is backend CanonicalWorkflowState ONLY
 * 2. Frontend never fabricates workflow state or certification results
 * 3. Frontend never creates its own state machine
 * 4. All data flows from backend via API calls
 * 
 * Last updated: M2.9 Wave 2 R4
 */

// Types
export * from './types/canonicalWorkflowState';

// API Client
export { ProjectLlmClient, projectLlmClient } from './api/projectLlmClient';

// Hooks
export { useWorkflowState } from './hooks/useWorkflowState';
export type { UseWorkflowStateResult } from './hooks/useWorkflowState';

// Components
export { CertificationBadge } from './components/CertificationBadge';
export { RuntimeVerificationPanel } from './components/RuntimeVerificationPanel';

// Creation Brief & Repository Intelligence (pre-existing utilities, preserved)
export * from './projectLlmCreationBrief';
export * from './projectLlmBlockCorpus';
export * from './projectLlmRepositoryIntelligence';
export * from './projectLlmReferencePatterns';
