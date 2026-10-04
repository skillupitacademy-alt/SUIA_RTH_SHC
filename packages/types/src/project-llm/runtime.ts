/**
 * Project LLM Runtime Status
 * 
 * Defines the runtime implementation-status layer, separate from corpus taxonomy.
 */

import { ProjectLlmLifecycleStatus } from './lifecycle';

/**
 * Runtime implementation status — separate from corpus/architectural taxonomy
 */
export interface ProjectLlmRuntimeStatus {
  /** Number of block versions with full verified runtime implementations (I1, C1, D1) */
  readonly verifiedImplementations: 3;
  /** Number of incomplete runtime implementations (S1) */
  readonly incompleteImplementations: 1;
  /** Number of planned educational families not yet implemented (14: O,V,CP,E,M,MT,BP,Q,EX,T,INT,QZ,IV,P) */
  readonly plannedFamilies: 14;
}

export type UbrcComplianceLevel = 'FULL' | 'PARTIAL' | 'NONE';

export interface BlockVersionImplementationStatus {
  /** Version identifier, e.g. "I1", "C1", "D1" */
  versionId: string;
  /** Parent family identifier, e.g. "I", "C", "D" */
  familyId: string;
  lifecycleStatus: ProjectLlmLifecycleStatus;
  /** UBRC compliance level: FULL=3/3 attributes, PARTIAL=2/3, NONE=0/3 */
  ubrcCompliance: UbrcComplianceLevel;
  /** Whether a version-routing mechanism is present */
  versionRoutingPresent: boolean;
  /** Evidence: file paths or commit refs confirming implementation */
  implementationEvidence: string[];
  /** Human-readable note (e.g. "Missing S-type version enforcement") */
  notes?: string;
}

export interface ProjectLlmRuntimeRegistry {
  readonly status: ProjectLlmRuntimeStatus;
  /** Fully verified implementations */
  verifiedImplementations: BlockVersionImplementationStatus[];
  /** Started but incomplete implementations */
  incompleteImplementations: BlockVersionImplementationStatus[];
  /** Family IDs of families planned but not yet implemented */
  plannedFamilyIds: string[];
}

/** Compile-time constants for runtime counts */
export const RUNTIME_VERIFIED_COUNT = 3 as const;
export const RUNTIME_INCOMPLETE_COUNT = 1 as const;
export const RUNTIME_PLANNED_FAMILIES_COUNT = 14 as const;
