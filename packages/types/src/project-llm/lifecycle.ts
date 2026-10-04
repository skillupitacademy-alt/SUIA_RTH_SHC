/**
 * Project LLM Lifecycle Status
 * 
 * Represents the lifecycle state of an educational block family or version
 * in the Project LLM workflow.
 */
export type ProjectLlmLifecycleStatus =
  | 'DOCUMENTED'
  | 'DESIGNED'
  | 'PROTOTYPED'
  | 'IMPLEMENTED'
  | 'RUNTIME_INTEGRATED'
  | 'VALIDATED'
  | 'CERTIFIED'
  | 'UNKNOWN';

export const PROJECT_LLM_LIFECYCLE_STATUSES: readonly ProjectLlmLifecycleStatus[] = [
  'DOCUMENTED',
  'DESIGNED',
  'PROTOTYPED',
  'IMPLEMENTED',
  'RUNTIME_INTEGRATED',
  'VALIDATED',
  'CERTIFIED',
  'UNKNOWN',
] as const;
