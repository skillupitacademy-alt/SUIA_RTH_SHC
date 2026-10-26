import type React from 'react';
import type { BlockComponentProps } from './types';

export interface GeneratedBlockRenderer {
  family: string;
  version: string;
  component: React.ComponentType<BlockComponentProps<any>>;
}

// Project LLM appends approved renderer registrations here through a hash-bound placement operation.
export const GENERATED_BLOCK_RENDERERS: readonly GeneratedBlockRenderer[] = [
  // PROJECT_LLM_GENERATED_RENDERERS
];
