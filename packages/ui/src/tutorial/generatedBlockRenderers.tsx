import type React from 'react';
import type { BlockComponentProps } from './types';

import { ObjectiveO3Block } from './blocks/ObjectiveO3Block';
import { ObjectiveO1Block } from './blocks/ObjectiveO1Block';
export interface GeneratedBlockRenderer {
  family: string;
  version: string;
  component: React.ComponentType<BlockComponentProps<any>>;
}

// Project LLM appends approved renderer registrations here through a hash-bound placement operation.
export const GENERATED_BLOCK_RENDERERS: readonly GeneratedBlockRenderer[] = [
  { family: 'objective', version: 'O3', component: ObjectiveO3Block },
  { family: 'objective', version: 'O1', component: ObjectiveO1Block },
  // PROJECT_LLM_GENERATED_RENDERERS
];
