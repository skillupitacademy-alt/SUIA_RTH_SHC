import type { TutorialPageContentType } from '@quiz/types';

export interface GeneratedBlockVersionDefinition {
  type: TutorialPageContentType;
  version: string;
  payloadFormat: 'legacy' | 'canonical';
}

// Project LLM appends approved entries here through a hash-bound placement operation.
export const GENERATED_BLOCK_VERSION_DEFINITIONS: readonly GeneratedBlockVersionDefinition[] = [
  { type: 'objective', version: 'O3', payloadFormat: 'canonical' },
  { type: 'objective', version: 'O1', payloadFormat: 'canonical' },
  // PROJECT_LLM_GENERATED_DEFINITIONS
];
